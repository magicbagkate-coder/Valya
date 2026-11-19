import type { AnalysisRow } from './analysisRow';
import type { GroupReport } from './groupReport';
import type { PlanItem } from './planItem';

/**
 * Everything that the analysis found. The promo products (yellow and red) and the main assortment are counted apart.
 * candidates: main products for a new discount. plan: the Reels of the next week, main assortment only.
 * Both are empty when there are no sales to judge (hasSales is false).
 * periodText, notes, weakMax, windowed: how the period was counted, for the text of the report.
 */
export type AnalysisResult = {
  promo: GroupReport;
  main: GroupReport;
  candidates: AnalysisRow[];
  plan: PlanItem[];
  stockLabel: string;
  periodText: string;
  notes: string[];
  hasSales: boolean;
  weakMax: number;
  windowed: boolean;
};
