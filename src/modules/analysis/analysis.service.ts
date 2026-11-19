import { Injectable } from '@nestjs/common';

import type { AnalysisPeriod } from './analysisPeriod';

import { SheetService } from '@/modules/sheet';
import { clockText } from '@/modules/reminder';
import { analyzeRows } from './analyzeRows';
import { clockDay } from './dates';
import { formatAnalysis } from './formatAnalysis';
import { readAnalysisRows } from './readAnalysisRows';
import { resolveWindow } from './resolveWindow';

const NO_PERIOD = { from: '', to: '' };

/** Analyzes the sheet "отчет" by the color rules of the team. The numbers come from code, never from the AI. It changes nothing. */
@Injectable()
export class AnalysisService {
  constructor(private readonly sheet: SheetService) {}

  /**
   * Reads the sheet and gives the text of the analysis. Without a period it counts the last two sales columns.
   * With a period ("from" and "to" as days like "2026-11-18") it counts the sales and the Reels of that time frame.
   * An unreadable period is an error with a plain message.
   */
  async buildReport(period: AnalysisPeriod = NO_PERIOD): Promise<string> {
    const today = clockDay(clockText(Date.now())) ?? 0;
    const window = resolveWindow({ period, today });
    const grid = await this.sheet.readGrid();
    return formatAnalysis(analyzeRows(readAnalysisRows({ grid, today, window })));
  }
}
