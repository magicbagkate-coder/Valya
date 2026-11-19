import type { AnalysisRow } from './analysisRow';
import type { PlanItem } from './planItem';

import { PLAN_ITEM_MAX, PLAN_TOTAL } from './analysisRules';

// What sells better goes first. If two products sell the same, the one with fewer published Reels goes first. Then the bigger stock.
const byPriority = (first: AnalysisRow, second: AnalysisRow): number =>
  second.sold - first.sold || first.reels - second.reels || second.stock - first.stock || first.line - second.line;

/**
 * Splits the Reels of the next week over the products that are given (the main assortment that is in stock).
 * Round after round, each product in the order of priority gets one more Reels, until the plan is full or each product has the maximum.
 */
export function buildReelsPlan(rows: AnalysisRow[]): PlanItem[] {
  const ranked = [...rows].sort(byPriority);
  const counts = ranked.map(() => 0);
  let left = PLAN_TOTAL;
  for (let round = 0; round < PLAN_ITEM_MAX; round += 1) {
    for (const [index, count] of counts.entries()) {
      if (left <= 0) break;
      counts[index] = count + 1;
      left -= 1;
    }
  }
  return ranked.flatMap((row, index) => {
    const count = counts[index] ?? 0;
    return count > 0 ? [{ line: row.line, article: row.article, count, sold: row.sold, stock: row.stock, reels: row.reels }] : [];
  });
}
