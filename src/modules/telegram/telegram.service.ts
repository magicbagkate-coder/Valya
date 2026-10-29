import { Injectable, Logger } from '@nestjs/common';
import { Bot } from 'grammy';

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { Context } from 'grammy';
import type { ChatState } from './chatState';

import { appEnv } from '@/config/appEnv';
import { AgentService } from '@/modules/agent';
import { ClaudeService } from '@/modules/claude';
import { detectKind, loadRows, parseHints } from '@/modules/report';
import { describeState } from './describeState';
import { splitMessage } from './splitMessage';

type ReceivedFile = { kind: 'sales' | 'stock'; buffer: Buffer };

/** The Telegram bot. It takes files and messages, runs the agent, and answers in the chat. */
@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('Telegram');
  private readonly chats = new Map<number, ChatState>();
  private bot?: Bot;

  constructor(
    private readonly agent: AgentService,
    private readonly claude: ClaudeService,
  ) {}

  onModuleInit(): void {
    if (!appEnv.telegramToken) {
      this.log.warn('TELEGRAM_BOT_TOKEN is not set. The bot is off.');
      return;
    }
    const bot = new Bot(appEnv.telegramToken);
    bot.use((ctx, next) => this.checkAccess(ctx, next));
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

  private stateFor(ctx: Context): ChatState {
    const chatId = ctx.chat?.id ?? 0;
    const state = this.chats.get(chatId) ?? {};
    this.chats.set(chatId, state);
    return state;
  }

  private async sendParts(ctx: Context, text: string): Promise<void> {
    for (const part of splitMessage(text)) await ctx.reply(part);
  }

  private async downloadFile(ctx: Context, fileId: string): Promise<Buffer> {
    const file = await ctx.api.getFile(fileId);
    const response = await fetch(`https://api.telegram.org/file/bot${appEnv.telegramToken}/${file.file_path}`);
    if (!response.ok) throw new Error(`Telegram file download failed with status ${response.status}.`);
    return Buffer.from(await response.arrayBuffer());
  }

  private cleanHints(text: string): ChatState {
    const hints = parseHints(text);
    return { ...(hints.period ? { period: hints.period } : {}), ...(hints.stockDate ? { stockDate: hints.stockDate } : {}) };
  }

  private async receiveFile(ctx: Context): Promise<ReceivedFile | undefined> {
    const document = ctx.message?.document;
    if (!document || !/\.xlsx$/i.test(document.file_name ?? '')) {
      await ctx.reply('Пришли файл в формате .xlsx.');
      return undefined;
    }
    const buffer = await this.downloadFile(ctx, document.file_id);
    const kind = detectKind(await loadRows(buffer));
    if (kind === 'unknown') {
      await ctx.reply('Не понял, что это за файл. Мне нужен файл продаж или файл остатков из 1С.');
      return undefined;
    }
    return { kind, buffer };
  }

  private async onDocument(ctx: Context): Promise<void> {
    const received = await this.receiveFile(ctx);
    if (!received) return;
    const state = this.stateFor(ctx);
    state[received.kind] = received.buffer;
    Object.assign(state, this.cleanHints(ctx.message?.caption ?? ''));
    await ctx.reply(received.kind === 'sales' ? 'Принял файл продаж.' : 'Принял файл остатков.');
    await this.runIfReady(ctx, state);
  }

  private async onText(ctx: Context): Promise<void> {
    const text = ctx.message?.text ?? '';
    const state = this.stateFor(ctx);
    const hints = this.cleanHints(text);
    if (Object.keys(hints).length > 0) {
      Object.assign(state, hints);
      await this.runIfReady(ctx, state);
      return;
    }
    const { have, missing } = describeState(state);
    const status = `has: ${have.join(', ') || 'nothing'}; missing: ${missing.join(', ') || 'nothing'}`;
    await this.sendParts(ctx, await this.claude.answerUser(text, status));
  }

  private async runIfReady(ctx: Context, state: ChatState): Promise<void> {
    const { sales, stock, period, stockDate } = state;
    if (!sales || !stock || !period || !stockDate) {
      await ctx.reply(`Жду: ${describeState(state).missing.join('; ')}.`);
      return;
    }
    await ctx.reply('Записываю в таблицу…');
    try {
      await this.sendParts(ctx, await this.agent.runReport({ sales, stock, period, stockDate }));
      state.sales = undefined;
      state.stock = undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.error(`Run failed: ${message}`);
      await ctx.reply(`Не получилось записать: ${message}. Файлы сохранены, повтори, когда исправится.`);
    }
  }
}
