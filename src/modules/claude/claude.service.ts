import { Injectable, Logger } from '@nestjs/common';

import type Anthropic from '@anthropic-ai/sdk';
import type { Hints } from '@/modules/report';
import type { ChatReply } from './chatReply';

import { MemoryService } from '@/modules/memory';
import { clockText, formatDue, ReminderService } from '@/modules/reminder';
import { parseHintsJson } from '@/modules/report';
import { createAnthropic } from './anthropicClient';
import { buildContext } from './buildContext';
import { FileService } from './file.service';
import { ASSISTANT_PROMPT } from './assistantPrompt';
import { CODE_TOOL } from './codeTool';
import { FILES_BETA } from './filesBeta';
import { LABEL_TOOL } from './labelTool';
import { pickRecent } from './pickRecent';
import { readReply } from './readReply';
import { CANCEL_TOOL, REMINDER_TOOL } from './reminderTool';
import { userContent } from './userContent';
import { WEB_SEARCH_TOOL } from './webSearchTool';

const MODEL_NAME = 'claude-sonnet-5-5';
const CHAT_TOKENS = 3000;
const EXTRACT_TOKENS = 300;
// A long calculation can pause the answer. The bot then asks Claude to go on, up to this many times.
const MAX_ROUNDS = 5;

const HELP_TEXT = [
  'Я вношу продажи и остатки из файлов 1С в Google-таблицу.',
  '1. Пришли файл продаж и файл остатков (.xlsx).',
  '2. Напиши период продаж (неделя, день или месяц) и дату остатков, например: «продажи 21-26.10, остатки 27,10».',
  'Когда всё есть, я запишу данные в таблицу и пришлю сводку.',
].join('\n');

const OFFLINE_TEXT = 'Сейчас я не могу подключиться к ИИ и отвечаю только по делу.\n';
const TOO_LONG_TEXT = 'Расчёт занял слишком много времени. Попробуй спросить проще или по частям.';
const SKIPPED_TEXT = 'Не получилось поставить напоминание: время непонятно или уже прошло. Скажи, на когда его поставить.';

// A reply of the code itself: no labels, no reminders.
const NO_ACTIONS = { labels: {}, reminders: [], cancels: [], skipped: 0 };

const EXTRACT_TEXT = `Extract two labels from a Russian message of a shop employee.
"period" is the sales period. "stockDate" is the date of the stock (остатки).
Write labels in the style of the sheet, always with two digits for the day and the month, without the year:
a day: "21,10"; a range in one month: "21-26,10"; a range over two months: "28,09-04,10"; a whole month: "01-31,10" (use the real last day of that month).
A week "с 21 по 27 октября" is "21-27,10". Today is {today}; use it for words such as "вчера" and "прошлая неделя".
Use null for a label that the message does not say. Do not guess.
Answer with JSON only: {"period": string or null, "stockDate": string or null}`;

/** One message of the user and the facts about the chat. */
export type ChatInput = { chatId: number; text: string; facts: string };
type Request = { system: string; tools: Anthropic.Messages.ToolUnion[]; messages: Anthropic.Messages.MessageParam[] };

// The tools of the code itself. They work at every level.
const BASE_TOOLS: Anthropic.Messages.ToolUnion[] = [LABEL_TOOL, REMINDER_TOOL, CANCEL_TOOL];

// From the most to the least. 1) all: base tools, internet, code sandbox. 2) base tools and internet. 3) base tools only.
const TOOL_LEVELS: Anthropic.Messages.ToolUnion[][] = [[...BASE_TOOLS, WEB_SEARCH_TOOL, CODE_TOOL], [...BASE_TOOLS, WEB_SEARCH_TOOL], BASE_TOOLS];

const todayText = (): string => new Date().toISOString().slice(0, 10);

// The history keeps only text. A note tells what the tool saved, so that Claude does not doubt it later.
function turnNote(reply: ChatReply): string {
  const saved = Object.entries(reply.labels)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}=${value}`)
    .join(', ');
  const note = saved ? `[saved: ${saved}]` : '';
  return [reply.text, note].filter((part) => part !== '').join('\n') || '(no answer)';
}

/** The AI of the bot. It chats, analyzes data files with code, searches the web, and reads periods. It never touches the sheet. */
@Injectable()
export class ClaudeService {
  private readonly log = new Logger('Claude');
  private readonly client = createAnthropic();

  constructor(
    private readonly memory: MemoryService,
    private readonly files: FileService,
    private readonly reminders: ReminderService,
  ) {}

  /** Forgets the talk and the data file of a chat. The last report stays. */
  async forgetChat(chatId: number): Promise<void> {
    this.memory.clearTurns(chatId);
    await this.files.dropFile(chatId);
  }

  private contextOf(input: ChatInput): string {
    const pending = this.reminders.listFor(input.chatId).map((item) => `№${item.id} ${formatDue(item.dueAt)} — ${item.text}`);
    return buildContext(input.facts, { lastReport: this.memory.loadReport(input.chatId), fileName: this.memory.loadFile(input.chatId)?.name, reminders: pending });
  }

  // The code does what Claude asked: it cancels and sets the reminders, then adds the exact result to the answer.
  private applyReminders(chatId: number, reply: ChatReply): ChatReply {
    const cancelled = reply.cancels.map((id) =>
      this.reminders.cancelReminder({ chatId, id }) ? `Напоминание №${id} отменено.` : `Напоминания №${id} нет.`,
    );
    const set = reply.reminders.map((request) => {
      const item = this.reminders.addReminder({ chatId, ...request });
      return `⏰ Напомню ${formatDue(item.dueAt)}: ${item.text} (№${item.id}).`;
    });
    const failed = reply.skipped > 0 ? [SKIPPED_TEXT] : [];
    const notes = [...cancelled, ...set, ...failed].join('\n');
    return { ...reply, text: [reply.text, notes].filter((part) => part !== '').join('\n\n') };
  }

  // One request. If Claude pauses a long calculation, the loop sends its work back so that it can go on.
  private async sendRequest(request: Request): Promise<ChatReply> {
    const messages = [...request.messages];
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      const response = await this.client?.messages.create(
        { model: MODEL_NAME, max_tokens: CHAT_TOKENS, system: request.system, tools: request.tools, messages },
        { headers: { 'anthropic-beta': FILES_BETA } },
      );
      if (response?.stop_reason !== 'pause_turn') return readReply(response?.content ?? [], Date.now());
      messages.push({ role: 'assistant', content: response.content });
    }
    return { text: TOO_LONG_TEXT, ...NO_ACTIONS };
  }

  // The data file goes into the request only when the code sandbox is one of the tools.
  private async askChat(input: ChatInput, tools: Anthropic.Messages.ToolUnion[]): Promise<ChatReply> {
    const file = tools.includes(CODE_TOOL) ? this.memory.loadFile(input.chatId) : undefined;
    return this.sendRequest({
      system: `${ASSISTANT_PROMPT.replaceAll('{today}', todayText()).replaceAll('{now}', clockText(Date.now()))}\n\nCONTEXT (facts of this chat)\n${this.contextOf(input)}`,
      tools,
      messages: [...pickRecent(this.memory.loadTurns(input.chatId)), { role: 'user', content: userContent(input.text, file) }],
    });
  }

  // If a tool is not available, the bot steps down one level. The internet stays until the last level.
  private async askWithFallback(input: ChatInput): Promise<ChatReply> {
    let lastError: unknown;
    for (const tools of TOOL_LEVELS) {
      try {
        return await this.askChat(input, tools);
      } catch (error) {
        lastError = error;
        this.log.warn(`Chat with ${tools.length} tools failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    throw lastError;
  }

  /**
   * Answers a message as a normal AI assistant. The context says what the chat has and the last report.
   * If the chat has a data file, Claude can analyze it with code. The talk is saved on disk.
   * If the user tells the period or the date, Claude saves them with the tool.
   */
  async talkToUser(input: ChatInput): Promise<ChatReply> {
    if (!this.client) return { text: HELP_TEXT, ...NO_ACTIONS };
    try {
      const reply = this.applyReminders(input.chatId, await this.askWithFallback(input));
      this.memory.addTurns(input.chatId, [
        { role: 'user', content: input.text },
        { role: 'assistant', content: turnNote(reply) },
      ]);
      return reply;
    } catch (error) {
      this.log.error(`Claude chat failed: ${error instanceof Error ? error.message : String(error)}`);
      return { text: `${OFFLINE_TEXT}${HELP_TEXT}`, ...NO_ACTIONS };
    }
  }

  /** Reads the sales period and the stock date from a short text, for example the caption of a file. */
  async extractHints(text: string): Promise<Hints> {
    if (!this.client) return {};
    try {
      const response = await this.client.messages.create({
        model: MODEL_NAME,
        max_tokens: EXTRACT_TOKENS,
        system: EXTRACT_TEXT.replace('{today}', todayText()),
        messages: [{ role: 'user', content: text }],
      });
      const block = response.content.find((part) => part.type === 'text');
      return block && block.type === 'text' ? parseHintsJson(block.text) : {};
    } catch (error) {
      this.log.error(`Claude extract failed: ${error instanceof Error ? error.message : String(error)}`);
      return {};
    }
  }
}
