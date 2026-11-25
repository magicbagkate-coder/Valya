import type { AnalysisRow } from './analysisRow';

/**
 * The product rows of the sheet and what they were counted from.
 * periodText and notes explain the period. hasSales: false when there are no sales to judge. weakMax: the most items that count as weak sales.
 * windowed: true when the user asked for a time frame. shotText: the shooting period for the plan by color, as text.
 */
export type AnalysisTable = {
  rows: AnalysisRow[];
  stockLabel: string;
  periodText: string;
  notes: string[];
  hasSales: boolean;
  weakMax: number;
  windowed: boolean;
  shotText: string;
};
