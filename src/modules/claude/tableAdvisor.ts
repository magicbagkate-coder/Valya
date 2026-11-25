import { Injectable, Logger } from '@nestjs/common';

import type { AnalyzeRequest } from './analyzeRequest';
import type { FullReport } from './fullReport';

import { AnalysisService } from '@/modules/analysis';
import { ADVISOR_PROMPT } from './advisorPrompt';
import { createAnthropic } from './anthropicClient';
import { MODEL_NAME } from './modelName';

// The model thinks before it writes, and the thinking counts in this limit too. A small limit cuts the text.
const ADVICE_TOKENS = 8000;
const NO_REQUEST = { from: '', to: '', question: '' };

// The question of the user goes before the report, so that the conclusions can answer it first.
const adviceInput = (job: { report: string; question: string }): string =>
  job.question === '' ? job.report : `QUESTION OF THE USER: ${job.question}\n\nREPORT OF THE CODE:\n${job.report}`;

/** Makes the analysis of the table in two steps: the code counts the report, then Claude writes the conclusions and the recommendations. */
@Injectable()
export class TableAdvisor {
  private readonly log = new Logger('TableAdvisor');
  private readonly client = createAnthropic();

  constructor(private readonly analysis: AnalysisService) {}

  // Claude gets the exact report. If it fails, the report is still sent, without conclusions.
  private async writeAdvice(job: { report: string; question: string }): Promise<string> {
    if (!this.client) return '';
    try {
      const response = await this.client.messages.create({
        model: MODEL_NAME,
        max_tokens: ADVICE_TOKENS,
        system: ADVISOR_PROMPT,
        messages: [{ role: 'user', content: adviceInput(job) }],
      });
      if (response.stop_reason === 'max_tokens') this.log.warn('The conclusions were cut by the token limit.');
      return response.content
        .flatMap((block) => (block.type === 'text' ? [block.text] : []))
        .join('')
        .trim();
    } catch (error) {
      this.log.error(`The conclusions failed: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }

  /**
   * Builds the report for a request (no time frame means the last two sales columns) and the conclusions.
   * If the request has a question, the conclusions answer it first. An unreadable time frame is an error with a plain message.
   */
  async buildFullReport(request: AnalyzeRequest = NO_REQUEST): Promise<FullReport> {
    const report = await this.analysis.buildReport(request);
    return { report, advice: await this.writeAdvice({ report, question: request.question }), question: request.question };
  }
}
