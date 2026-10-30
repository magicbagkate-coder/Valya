import { Injectable, Logger } from '@nestjs/common';
import { Api } from 'grammy';

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { appEnv } from '@/config/appEnv';
import { ReminderService } from '@/modules/reminder';
import { sendDue } from './sendDue';

// How often the bot looks for reminders whose time has come.
const TICK_MS = 20_000;

/** Writes each reminder to its chat at its time. It looks every 20 seconds, so a reminder is at most 20 seconds late. */
@Injectable()
export class ReminderSender implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('ReminderSender');
  private ticker?: NodeJS.Timeout;
  private sending = false;

  constructor(private readonly reminders: ReminderService) {}

  onModuleInit(): void {
    if (!appEnv.telegramToken) return;
    const api = new Api(appEnv.telegramToken);
    this.ticker = setInterval(() => void this.sendRound(api), TICK_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.ticker);
  }

  // One round at a time: a slow round must not send the same reminder twice.
  private async sendRound(api: Api): Promise<void> {
    if (this.sending) return;
    this.sending = true;
    try {
      for (const problem of await sendDue({ api, reminders: this.reminders, now: Date.now() })) this.log.warn(problem);
    } finally {
      this.sending = false;
    }
  }
}
