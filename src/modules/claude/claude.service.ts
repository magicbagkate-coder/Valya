import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';

import type { Hints } from '@/modules/report';

import { appEnv } from '@/config/appEnv';
import { parseHintsJson } from '@/modules/report';

const MODEL_NAME = 'claude-sonnet-5-5';
const MAX_TOKENS = 500;

const HELP_TEXT = [
  'Я вношу продажи и остатки из файлов 1С в Google-таблицу.',
  '1. Пришли файл продаж и файл остатков (.xlsx).',
  '2. Напиши период продаж (неделя, день или месяц) и дату остатков, например: «продажи 21-26.10, остатки 27,10».',
  'Когда всё есть, я запишу данные в таблицу и пришлю сводку.',
].join('\n');

const SYSTEM_TEXT = `You are Valya, a Telegram assistant of a small shop team.
Your only job: the user sends two 1C Excel files (sales for a period, stock for a date) and tells the sales period and the stock date. The period can be a day, a week, a month, or any range. Code outside this chat writes them to the Google sheet and sends the report.
You cannot write to the table yourself. Never say that you wrote or changed anything.
Answer in Russian, in 1 to 3 short sentences. If the user asks how to use you, say: send both files, then write the period and the date, for example "продажи 21-26.10, остатки 27,10".
If the user asks something outside this job, say briefly that you only help with sales and stock files.
The line "Status" shows what the bot already has. Use it to say what is still missing.`;

const EXTRACT_TEXT = `Extract two labels from a Russian message of a shop employee.
"period" is the sales period. "stockDate" is the date of the stock (остатки).
Write labels in the style of the sheet, always with two digits for the day and the month, without the year:
a day: "21,10"; a range in one month: "21-26,10"; a range over two months: "28,09-04,10"; a whole month: "01-31,10" (use the real last day of that month).
A week "с 21 по 27 октября" is "21-27,10". Today is {today}; use it for words such as "вчера" and "прошлая неделя".
Use null for a label that the message does not say. Do not guess.
Answer with JSON only: {"period": string or null, "stockDate": string or null}`;

/** Talks to the user in free text and reads periods from free text. It never touches the sheet. */
@Injectable()
export class ClaudeService {
  private readonly log = new Logger('Claude');
  private readonly client = appEnv.anthropicKey ? new Anthropic({ apiKey: appEnv.anthropicKey }) : undefined;

  private async askClaude(system: string, content: string): Promise<string | undefined> {
    if (!this.client) return undefined;
    try {
      const response = await this.client.messages.create({
        model: MODEL_NAME,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content }],
      });
      const block = response.content.find((part) => part.type === 'text');
      return block && block.type === 'text' ? block.text : undefined;
    } catch (error) {
      this.log.error(`Claude request failed: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  /** Answers a free text message. Returns the help text if Claude is off or fails. */
  async answerUser(text: string, status: string): Promise<string> {
    const answer = await this.askClaude(SYSTEM_TEXT, `Status: ${status}\n\nMessage: ${text}`);
    return answer ?? HELP_TEXT;
  }

  /** Reads the sales period and the stock date from a free text, for example "за октябрь". */
  async extractHints(text: string): Promise<Hints> {
    const today = new Date().toISOString().slice(0, 10);
    const answer = await this.askClaude(EXTRACT_TEXT.replace('{today}', today), text);
    return answer ? parseHintsJson(answer) : {};
  }
}
