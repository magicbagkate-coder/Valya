import type { AnalysisRow } from './analysisRow';

/** The product rows of the sheet, and the headers of the columns that they were counted from. */
export type AnalysisTable = { rows: AnalysisRow[]; lastWeekLabel: string; prevWeekLabel: string; stockLabel: string };
