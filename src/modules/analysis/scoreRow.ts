import type { AnalysisRow } from './analysisRow';

import { DEMAND_FULL, REELS_FULL, STALE_DAYS_FULL, STOCK_FULL, WEIGHT_CONTENT, WEIGHT_DEMAND, WEIGHT_STOCK, WEIGHT_TREND } from './analysisRules';
import { trendValue } from './trend';

// Without the margin, these weights are all that can be counted. The score is scaled to 100 on them.
const COUNTED_WEIGHT = WEIGHT_DEMAND + WEIGHT_STOCK + WEIGHT_CONTENT + WEIGHT_TREND;
// The part of the content points for the number of Reels. The rest is for the time since the last one.
const REELS_SHARE = 0.6;
const DAYS_PER_FORTNIGHT = 14;

const cappedShare = (value: number): number => Math.max(0, Math.min(1, value));

// Lack of content from 0 (a lot of fresh content) to 1 (no Reels, or none for a long time).
function contentGap(row: AnalysisRow): number {
  const fewReels = 1 - cappedShare(row.reels / REELS_FULL);
  const stale = row.daysSinceReel === undefined ? 1 : cappedShare(row.daysSinceReel / STALE_DAYS_FULL);
  return REELS_SHARE * fewReels + (1 - REELS_SHARE) * stale;
}

/**
 * The score of a product for the content plan, from 0 to 100. Confirmed demand, enough stock, lack of content, and the trend.
 * The demand is taken for 14 days, so a longer or shorter period gives the same scale. The margin is not counted: the table has no price or cost.
 */
export function scoreRow(job: { row: AnalysisRow; salesDays: number }): number {
  const { row } = job;
  const perFortnight = job.salesDays > 0 ? (row.sold / job.salesDays) * DAYS_PER_FORTNIGHT : 0;
  const earned =
    cappedShare(perFortnight / DEMAND_FULL) * WEIGHT_DEMAND +
    cappedShare(row.stock / STOCK_FULL) * WEIGHT_STOCK +
    contentGap(row) * WEIGHT_CONTENT +
    trendValue(row.weeks) * WEIGHT_TREND;
  return Math.round((earned / COUNTED_WEIGHT) * 100);
}
