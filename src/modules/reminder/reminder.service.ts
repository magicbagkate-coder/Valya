import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';

import type { NewReminder, ReminderItem } from './reminderItem';

import { appEnv } from '@/config/appEnv';
import { parseReminders } from './parseReminders';

/** Keeps the pending reminders on disk, so a restart or an update does not lose them. */
@Injectable()
export class ReminderService {
  private readonly log = new Logger('Reminder');
  private readonly file = path.join(appEnv.dataDir, 'reminders.json');
  private items = this.readFile();

  private readFile(): ReminderItem[] {
    try {
      return parseReminders(JSON.parse(readFileSync(this.file, 'utf8')));
    } catch (error) {
      const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
      if (!missing) this.log.warn(`Reminder file is not readable, starting empty: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  private writeFile(): void {
    try {
      mkdirSync(path.dirname(this.file), { recursive: true });
      const tempFile = `${this.file}.tmp`;
      writeFileSync(tempFile, JSON.stringify(this.items));
      renameSync(tempFile, this.file);
    } catch (error) {
      this.log.error(`Reminder file was not saved: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** Saves a reminder for a chat and gives it a number. */
  addReminder(job: NewReminder): ReminderItem {
    const id = Math.max(0, ...this.items.map((item) => item.id)) + 1;
    const item = { id, chatId: job.chatId, text: job.text, dueAt: job.dueAt };
    this.items = [...this.items, item];
    this.writeFile();
    return item;
  }

  /** Returns the pending reminders of a chat, the nearest first. */
  listFor(chatId: number): ReminderItem[] {
    return this.items.filter((item) => item.chatId === chatId).sort((first, second) => first.dueAt - second.dueAt);
  }

  /** Returns the reminders whose time has come. */
  listDue(now: number): ReminderItem[] {
    return this.items.filter((item) => item.dueAt <= now);
  }

  /** Deletes a reminder, for example after it was sent. */
  removeReminder(id: number): void {
    this.items = this.items.filter((item) => item.id !== id);
    this.writeFile();
  }

  /** Cancels a reminder of a chat. A number of another chat is not touched. Tells if a reminder was found. */
  cancelReminder(job: { chatId: number; id: number }): boolean {
    const found = this.items.some((item) => item.id === job.id && item.chatId === job.chatId);
    if (found) this.removeReminder(job.id);
    return found;
  }
}
