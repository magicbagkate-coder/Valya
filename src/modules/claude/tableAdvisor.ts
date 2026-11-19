import { Injectable, Logger } from '@nestjs/common';

import type { AnalysisPeriod } from '@/modules/analysis';
import type { FullReport } from './fullReport';

import { AnalysisService } from '@/modules/analysis';
import { ADVISOR_PROMPT } from './advisorPrompt';
import { createAnthropic } from './anthropicClient';
import { MODEL_NAME } from './modelName';

// The model thinks before it writes, and the thinking counts in this limit too. A small limit cuts the text.
const ADVICE_TOKENS = 8000;

/** Makes the analysis of the table in two steps: the code counts the report, then Claude writes the conclusions and the recommendations. */
@Injectable()
export class TableAdvisor {
  private readonly log = new Logger('TableAdvisor');
  private readonly client = createAnthropic();

  constructor(private readonly analysis: AnalysisService) {}

  // Claude gets the exact report. If it fails, the report is still sent, without conclusions.
  private async writeAdvice(report: string): Promise<string> {
    if (!this.client) return '';
    try {
      const response = await this.client.messages.create({
        model: MODEL_NAME,
        max_tokens: ADVICE_TOKENS,
        system: ADVISOR_PROMPT,
        messages: [{ role: 'user', content: report }],
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

  /** Builds the report for a period (no period means the last two sales columns) and the conclusions. An unreadable period is an error with a plain message. */
  async buildFullReport(period?: AnalysisPeriod): Promise<FullReport> {
    const report = await this.analysis.buildReport(period);
    return { report, advice: await this.writeAdvice(report) };
  }
}
