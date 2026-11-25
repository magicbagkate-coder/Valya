import type { AnalysisRow } from './analysisRow';
import type { PlanItem } from './planItem';

import { LOW_STOCK, PLAN_ITEM_MAX, PLAN_TOTAL } from './analysisRules';
import { scoreRow } from './scoreRow';
import { trendMark } from './trend';

type Scored = { row: AnalysisRow; score: number };

// The higher score goes first. If two products have the same score, the one that sold more goes first.
const byScore = (first: Scored, second: Scored): number => second.score - first.score || second.row.sold - first.row.sold || first.row.line - second.row.line;

// A stock just above the limit is allowed, but the plan warns about it.
const noteOf = (row: AnalysisRow): string => (row.stock === LOW_STOCK + 1 ? `остаток всего ${row.stock}, проверьте запас перед съёмкой` : '');

/**
 * Splits the Reels of the next week over the products that are given (the main assortment that is allowed in the plan).
 * The products are ordered by their score. Round after round, each product in that order gets one more Reels,
 * until the plan is full or each product has the maximum.
 */
export function buildReelsPlan(job: { rows: AnalysisRow[]; salesDays: number }): PlanItem[] {
  const ranked = job.rows.map((row) => ({ row, score: scoreRow({ row, salesDays: job.salesDays }) })).sort(byScore);
  const counts = ranked.map(() => 0);
  let left = PLAN_TOTAL;
  for (let round = 0; round < PLAN_ITEM_MAX; round += 1) {
    for (const [index, count] of counts.entries()) {
      if (left <= 0) break;
      counts[index] = count + 1;
      left -= 1;
    }
  }
  return ranked.flatMap(({ row, score }, index) => {
    const count = counts[index] ?? 0;
    if (count === 0) return [];
    return [
      { line: row.line, article: row.article, count, score, sold: row.sold, trend: trendMark(row.weeks), stock: row.stock, reels: row.reels, lastReel: row.lastReel, note: noteOf(row) },
    ];
  });
}
