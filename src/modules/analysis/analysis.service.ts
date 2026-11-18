import { Injectable } from '@nestjs/common';

import { SheetService } from '@/modules/sheet';
import { analyzeRows } from './analyzeRows';
import { formatAnalysis } from './formatAnalysis';
import { readAnalysisRows } from './readAnalysisRows';

/** Analyzes the sheet "отчет" by the color rules of the team. The numbers come from code, never from the AI. It changes nothing. */
@Injectable()
export class AnalysisService {
  constructor(private readonly sheet: SheetService) {}

  /** Reads the sheet and gives the text of the analysis. */
  async buildReport(): Promise<string> {
    return formatAnalysis(analyzeRows(readAnalysisRows(await this.sheet.readGrid())));
  }
}
