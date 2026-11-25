import type { AnalysisRow } from './analysisRow';
import type { ColorPlan } from './colorPlan';
import type { GroupReport } from './groupReport';
import type { PlanItem } from './planItem';

/**
 * Everything that the analysis found. The promo products (yellow and red) and the main assortment are counted apart.
 * candidates: main products for a new discount. plan: the Reels of the next week, main assortment only.
 * Both are empty when there are no sales to judge (hasSales is false). colorPlan: what the colors of the sheet mark as planned for the content, and how much of it was shot.
 * periodText, notes, weakMax, windowed: how the period was counted, for the text of the report.
 */
export type AnalysisResult = {
  promo: GroupReport;
  main: GroupReport;
  candidates: AnalysisRow[];
  plan: PlanItem[];
  colorPlan: ColorPlan;
  stockLabel: string;
  periodText: string;
  notes: string[];
  hasSales: boolean;
  weakMax: number;
  windowed: boolean;
};
