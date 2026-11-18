import { Injectable } from '@nestjs/common';

import type { ChatReply } from './chatReply';

import { AnalysisService } from '@/modules/analysis';
import { MemoryService } from '@/modules/memory';
import { formatDue, ReminderService } from '@/modules/reminder';

const SKIPPED_TEXT = 'Не получилось поставить напоминание: время непонятно или уже прошло. Скажи, на когда его поставить.';

/** Does what Claude asked with its tools: sets and cancels reminders, runs the analysis of the table. The code gives the exact result. */
@Injectable()
export class ReplyActions {
  constructor(
    private readonly reminders: ReminderService,
    private readonly analysis: AnalysisService,
    private readonly memory: MemoryService,
  ) {}

  /** The pending reminders of a chat, one line each, for the context of Claude. */
  pendingLines(chatId: number): string[] {
    return this.reminders.listFor(chatId).map((item) => `№${item.id} ${formatDue(item.dueAt)} — ${item.text}`);
  }

  private reminderNotes(chatId: number, reply: ChatReply): string[] {
    const cancelled = reply.cancels.map((id) =>
      this.reminders.cancelReminder({ chatId, id }) ? `Напоминание №${id} отменено.` : `Напоминания №${id} нет.`,
    );
    const set = reply.reminders.map((request) => {
      const item = this.reminders.addReminder({ chatId, ...request });
      return `⏰ Напомню ${formatDue(item.dueAt)}: ${item.text} (№${item.id}).`;
    });
    return [...cancelled, ...set, ...(reply.skipped > 0 ? [SKIPPED_TEXT] : [])];
  }

  // The report is saved for the chat, so that Claude can answer questions about it later.
  private async runAnalysis(chatId: number): Promise<string> {
    try {
      const text = await this.analysis.buildReport();
      this.memory.saveAnalysis({ chatId, text });
      return text;
    } catch (error) {
      return `Не получилось проанализировать таблицу: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /** Sets and cancels the reminders, adds the exact result to the answer, and runs the analysis if Claude asked for it. */
  async applyActions(chatId: number, reply: ChatReply): Promise<ChatReply> {
    const notes = this.reminderNotes(chatId, reply).join('\n');
    const report = reply.analyze ? await this.runAnalysis(chatId) : '';
    return { ...reply, text: [reply.text, notes].filter((part) => part !== '').join('\n\n'), report };
  }
}
