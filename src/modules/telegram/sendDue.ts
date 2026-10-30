import { GrammyError } from 'grammy';

import type { Api } from 'grammy';
import type { ReminderService } from '@/modules/reminder';

// Telegram answers 400 or 403 when the chat is gone or the bot is blocked. Another try cannot help.
const REFUSED_CODES = [400, 403];

const isChatRefused = (error: unknown): boolean => error instanceof GrammyError && REFUSED_CODES.includes(error.error_code);

/** Sends each reminder whose time has come. A sent one leaves the list. A failed one stays for the next try, unless the chat refuses. Returns the error texts. */
export async function sendDue(job: { api: Api; reminders: ReminderService; now: number }): Promise<string[]> {
  const problems: string[] = [];
  for (const item of job.reminders.listDue(job.now)) {
    try {
      await job.api.sendMessage(item.chatId, `⏰ Напоминание: ${item.text}`);
      job.reminders.removeReminder(item.id);
    } catch (error) {
      problems.push(`Reminder ${item.id} was not sent: ${error instanceof Error ? error.message : String(error)}`);
      if (isChatRefused(error)) job.reminders.removeReminder(item.id);
    }
  }
  return problems;
}
