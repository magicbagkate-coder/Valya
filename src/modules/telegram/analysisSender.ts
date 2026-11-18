import { Injectable, Logger } from '@nestjs/common';
import { Api } from 'grammy';

import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { appEnv } from '@/config/appEnv';
import { AnalysisService, dueReportDate } from '@/modules/analysis';
import { MemoryService } from '@/modules/memory';
import { clockText } from '@/modules/reminder';
import { splitMessage } from './splitMessage';

// How often the bot looks at the clock.
const TICK_MS = 60_000;

/** Sends the analysis of the table to the team chat every Wednesday at 09:00 Kyiv time. Each chat gets it once a day. */
@Injectable()
export class AnalysisSender implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('AnalysisSender');
  private ticker?: NodeJS.Timeout;
  private sending = false;

  constructor(
    private readonly analysis: AnalysisService,
    private readonly memory: MemoryService,
  ) {}

  onModuleInit(): void {
    if (!appEnv.telegramToken) return;
    const api = new Api(appEnv.telegramToken);
    this.ticker = setInterval(() => void this.sendRound(api), TICK_MS);
  }

  onModuleDestroy(): void {
    clearInterval(this.ticker);
  }

  // The chats of the setting, or all chats that talk with the bot.
  private targetChats(): number[] {
    return appEnv.analysisChatIds.length > 0 ? appEnv.analysisChatIds : this.memory.listChats();
  }

  private async sendToChat(job: { api: Api; chatId: number; text: string; date: string }): Promise<void> {
    try {
      for (const part of splitMessage(job.text)) await job.api.sendMessage(job.chatId, part);
      this.memory.saveAnalysis({ chatId: job.chatId, text: job.text, date: job.date });
    } catch (error) {
      this.log.warn(`The analysis was not sent to chat ${job.chatId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // One round at a time. A chat that already got the analysis today is skipped. A failed chat gets another try in a minute.
  private async sendRound(api: Api): Promise<void> {
    const date = dueReportDate(clockText(Date.now()));
    if (!date || this.sending) return;
    const waiting = this.targetChats().filter((chatId) => this.memory.loadAnalysisDate(chatId) !== date);
    if (waiting.length === 0) return;
    this.sending = true;
    try {
      const text = await this.analysis.buildReport();
      for (const chatId of waiting) await this.sendToChat({ api, chatId, text, date });
    } catch (error) {
      this.log.warn(`The weekly analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.sending = false;
    }
  }
}
