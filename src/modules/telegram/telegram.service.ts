import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Context } from 'grammy';
import type { ChatState } from './chatState';
import type { IncomingFile } from './incomingFile';
import type { RunInput } from '@/modules/agent';

import { appEnv } from '@/config/appEnv';
import { AgentService } from '@/modules/agent';
import { ClaudeService, FileService } from '@/modules/claude';
import { parseHints } from '@/modules/report';
import { classifyFile } from './classifyFile';
import { describeState } from './describeState';
import { hintsToState } from './hintsToState';
import { isDataFile } from './isDataFile';
import { isPureHint } from './isPureHint';
import { splitMessage } from './splitMessage';
import { stateFacts } from './stateFacts';
import { wantsAnalysis } from './wantsAnalysis';

// A text with a digit or a month or period word can hold a period. Then Claude reads it.
const MAYBE_HINT = /\d|январ|феврал|март|апрел|ма[йя]|июн|июл|август|сентябр|октябр|ноябр|декабр|недел|вчера|сегодня/i;

const TYPING_MS = 4000;
const DATA_FILE_TEXT = 'Не принял файл «{name}». Я открываю таблицы и данные: .xlsx, .xls, .csv, .tsv, .txt, .json.';
const OTHER_NOTE = '\n\n[Система: этот файл не похож на выгрузки 1С для таблицы (продажи или остатки), поэтому открыт для анализа.]';
const OPEN_FAILED_TEXT = 'Не получилось открыть файл для анализа. Попробуй ещё раз чуть позже.';

const captionOf = (ctx: Context): string => ctx.message?.caption ?? '';

const defaultAsk =(name: string): string => `Я загрузил файл «${name}». Посмотри, что в нём, коротко опиши и предложи, что можно посчитать или проанализировать.`;

/** The Telegram bot. It takes files and messages, writes the 1C files to the table, analyzes other data, and chats. */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Telegram');
  private readonly chats = new Map<number, ChatState>();
  private bot?: Bot;

  constructor(
    private readonly agent: AgentService,
    private readonly claude: ClaudeService,
    private readonly files: FileService,
  ) {}

  onModuleInit(): void {
    if (!appEnv.telegramToken) {
      this.log.warn('TELEGRAM_BOT_TOKEN is not set. The bot is off.');
      return;
    }
    const bot = new Bot(appEnv.telegramToken);
    bot.use((ctx, next) => this.checkAccess(ctx, next));
    bot.command('forget', (ctx) => this.onForget(ctx));
    bot.on('message:document', (ctx) => this.onDocument(ctx));
    bot.on('message:text', (ctx) => this.onText(ctx));
    bot.errorHandler = (failure) => this.log.error(`Update failed: ${failure.message}`);
    this.bot = bot;
    // Long polling runs until onModuleDestroy stops it. The error handler above reports errors.
    void bot.start({ onStart: () => this.log.log('Telegram bot started') });
  }

  async onModuleDestroy(): Promise<void> {
    await this.bot?.stop();
  }

  private async checkAccess(ctx: Context, next: () => Promise<void>): Promise<void> {
    const userId = ctx.from?.id ?? 0;
    if (appEnv.allowedIds.includes(userId)) return next();
    await ctx.reply(`Нет доступа. Твой Telegram ID: ${userId}. Передай его владельцу бота.`);
  }

  private async onForget(ctx: Context): Promise<void> {
    await this.claude.forgetChat(ctx.chat?.id ?? 0);
    await ctx.reply('Хорошо, переписку и загруженный файл для анализа забыл. Последний отчёт о записи в таблицу я помню.');
  }

  private stateFor(ctx: Context): ChatState {
    const chatId = ctx.chat?.id ?? 0;
    const state = this.chats.get(chatId) ?? {};
    this.chats.set(chatId, state);
    return state;
  }

  private async sendParts(ctx: Context, text: string): Promise<void> {
    for (const part of splitMessage(text)) await ctx.reply(part);
  }

  private async sendTyping(ctx: Context): Promise<void> {
    try {
      await ctx.replyWithChatAction('typing');
    } catch (error) {
      this.log.warn(`Typing signal failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // A long calculation can take a minute. The typing signal lasts 5 seconds, so it is sent again and again.
  private async withTyping<T>(ctx: Context, task: () => Promise<T>): Promise<T> {
    const timer = setInterval(() => void this.sendTyping(ctx), TYPING_MS);
    await this.sendTyping(ctx);
    try {
      return await task();
    } finally {
      clearInterval(timer);
    }
  }

  private async downloadFile(ctx: Context, fileId: string): Promise<Buffer> {
    const file = await ctx.api.getFile(fileId);
    const response = await fetch(`https://api.telegram.org/file/bot${appEnv.telegramToken}/${file.file_path}`);
    if (!response.ok) throw new Error(`Telegram file download failed with status ${response.status}.`);
    return Buffer.from(await response.arrayBuffer());
  }

  // The code reads the plain forms. Claude reads the rest, for example "за октябрь".
  private async findHints(text: string): Promise<ChatState> {
    const found = hintsToState(parseHints(text));
    if ((found.period && found.stockDate) || !MAYBE_HINT.test(text)) return found;
    return { ...hintsToState(await this.claude.extractHints(text)), ...found };
  }

  private async receiveFile(ctx: Context): Promise<IncomingFile | undefined> {
    const document = ctx.message?.document;
    const name = document?.file_name ?? '';
    if (!document || !isDataFile(name)) {
      await ctx.reply(DATA_FILE_TEXT.replace('{name}', name));
      return undefined;
    }
    return { name, buffer: await this.downloadFile(ctx, document.file_id), caption: captionOf(ctx) };
  }

  // A 1C file goes to the table, unless the caption asks for an analysis. Any other data file is analyzed.
  private async onDocument(ctx: Context): Promise<void> {
    const file = await this.receiveFile(ctx);
    if (!file) return;
    const kind = await classifyFile(file.name, file.buffer);
    this.log.log(`File "${file.name}" (${file.buffer.length} bytes) is ${kind}`);
    const stored = await this.files.storeFile(ctx.chat?.id ?? 0, file.name, file.buffer);
    if (kind !== 'other' && !wantsAnalysis(file.caption)) {
      await this.addToTable(ctx, kind, file);
      return;
    }
    await this.analyzeFile(ctx, { file, stored, note: kind === 'other' ? OTHER_NOTE : '' });
  }

  private async addToTable(ctx: Context, kind: 'sales' | 'stock', file: IncomingFile): Promise<void> {
    const state = this.stateFor(ctx);
    state[kind] = file.buffer;
    Object.assign(state, await this.findHints(file.caption));
    await ctx.reply(kind === 'sales' ? 'Принял файл продаж.' : 'Принял файл остатков.');
    await this.runIfReady(ctx, state);
  }

  private async analyzeFile(ctx: Context, job: { file: IncomingFile; stored: boolean; note: string }): Promise<void> {
    if (!job.stored) {
      await ctx.reply(OPEN_FAILED_TEXT);
      return;
    }
    const question = job.file.caption || defaultAsk(job.file.name);
    await this.talkToUser(ctx, `${question}${job.note}`, this.stateFor(ctx));
  }

  private async onText(ctx: Context): Promise<void> {
    const text = ctx.message?.text ?? '';
    const state = this.stateFor(ctx);
    const plain = hintsToState(parseHints(text));
    if (isPureHint(text) && Object.keys(plain).length > 0) {
      Object.assign(state, plain);
      await this.runIfReady(ctx, state);
      return;
    }
    await this.talkToUser(ctx, text, state);
  }

  // Any other text goes to Claude, as a talk with an AI. If the user tells a period or a date, the code uses it.
  private async talkToUser(ctx: Context, text: string, state: ChatState): Promise<void> {
    const chatId = ctx.chat?.id ?? 0;
    const reply = await this.withTyping(ctx, () => this.claude.talkToUser({ chatId, text, facts: stateFacts(state) }));
    if (reply.text) await this.sendParts(ctx, reply.text);
    const labels = hintsToState(reply.labels);
    if (Object.keys(labels).length === 0) return;
    Object.assign(state, labels);
    await this.runIfReady(ctx, state);
  }

  private async runIfReady(ctx: Context, state: ChatState): Promise<void> {
    const { sales, stock, period, stockDate } = state;
    if (!sales || !stock || !period || !stockDate) {
      await ctx.reply(`Жду: ${describeState(state).missing.join('; ')}.`);
      return;
    }
    await ctx.reply('Записываю в таблицу…');
    await this.runAgent(ctx, state, { chatId: ctx.chat?.id ?? 0, sales, stock, period, stockDate });
  }

  private async runAgent(ctx: Context, state: ChatState, input: RunInput): Promise<void> {
    try {
      await this.sendParts(ctx, await this.agent.runReport(input));
      state.sales = undefined;
      state.stock = undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error(`Run failed: ${message}`);
      await ctx.reply(`Не получилось записать: ${message}. Файлы сохранены, повтори, когда исправится.`);
    }
  }
}
