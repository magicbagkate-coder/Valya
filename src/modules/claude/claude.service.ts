import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';

import { appEnv } from '@/config/appEnv';

const MODEL_NAME = 'claude-sonnet-5-5';
const MAX_TOKENS = 500;

const HELP_TEXT = [
  'Я вношу продажи и остатки из файлов 1С в Google-таблицу.',
  '1. Пришли файл продаж и файл остатков (.xlsx).',
  '2. Напиши период продаж и дату остатков, например: «продажи 21-26.10, остатки 27,10».',
  'Когда всё есть, я запишу данные в таблицу и пришлю сводку.',
].join('\n');

const SYSTEM_TEXT = `You are Valya, a Telegram assistant of a small shop team.
Your only job: the user sends two 1C Excel files (sales for a week, stock for a date) and tells the week period and the stock date. Code outside this chat writes them to the Google sheet and sends the report.
You cannot write to the table yourself. Never say that you wrote or changed anything.
Answer in Russian, in 1 to 3 short sentences. If the user asks how to use you, say: send both files, then write the period and the date, for example "продажи 21-26.10, остатки 27,10".
If the user asks something outside this job, say briefly that you only help with sales and stock files.
The line "Status" shows what the bot already has. Use it to say what is still missing.`;

/** Talks to the user in free text. It never touches the sheet. */
@Injectable()
export class ClaudeService {
  private readonly log = new Logger('Claude');
  private readonly client = appEnv.anthropicKey ? new Anthropic({ apiKey: appEnv.anthropicKey }) : undefined;

  /** Answers a free text message. Returns the help text if Claude is off or fails. */
  async answerUser(text: string, status: string): Promise<string> {
    if (!this.client) return HELP_TEXT;
    try {
      const response = await this.client.messages.create({
        model: MODEL_NAME,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_TEXT,
        messages: [{ role: 'user', content: `Status: ${status}\n\nMessage: ${text}` }],
      });
      const block = response.content.find((part) => part.type === 'text');
      return block && block.type === 'text' ? block.text : HELP_TEXT;
    } catch (error) {
      this.log.error(`Claude request failed: ${error instanceof Error ? error.message : String(error)}`);
      return HELP_TEXT;
    }
  }
}
