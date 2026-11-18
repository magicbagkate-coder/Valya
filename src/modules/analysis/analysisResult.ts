import type { AnalysisRow } from './analysisRow';
import type { GroupReport } from './groupReport';
import type { PlanItem } from './planItem';

/**
 * Everything that the analysis found. The promo products (yellow and red) and the main assortment are counted apart.
 * candidates: main products for a new discount. plan: the Reels of the next week, main assortment only.
 */
export type AnalysisResult = {
  promo: GroupReport;
  main: GroupReport;
  candidates: AnalysisRow[];
  plan: PlanItem[];
  lastWeekLabel: string;
  prevWeekLabel: string;
  stockLabel: string;
};
