import type { AnalysisRow } from './analysisRow';
import type { ColorPlan } from './colorPlan';
import type { DiscountGroups } from './discountGroups';
import type { GroupReport } from './groupReport';
import type { ModelSummary } from './modelSummary';
import type { PlanItem } from './planItem';

/**
 * Everything that the analysis found. The promo products (yellow and red) and the main assortment are counted apart.
 * returns: rows with returns or corrections (negative sales), both groups. discount: main products for a new discount, in three groups.
 * lowStock: main products that sold, but have a stock of 1–2 and no other color with enough stock, so they stay out of the separate Reels.
 * plan: the Reels of the next week, main assortment only, with a score. models: the models with several colors.
 * discount, lowStock, plan, and models are empty when there are no sales to judge (hasSales is false).
 * colorPlan: what the colors of the sheet mark as planned for the content, and how much of it was shot.
 * periodText, notes, weekLabels, weakMax, windowed: how the period was counted, for the text of the report.
 */
export type AnalysisResult = {
  promo: GroupReport;
  main: GroupReport;
  returns: AnalysisRow[];
  discount: DiscountGroups;
  lowStock: AnalysisRow[];
  plan: PlanItem[];
  models: ModelSummary[];
  colorPlan: ColorPlan;
  stockLabel: string;
  periodText: string;
  notes: string[];
  weekLabels: string[];
  hasSales: boolean;
  weakMax: number;
  windowed: boolean;
};
