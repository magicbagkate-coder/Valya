import type { AnalysisResult } from './analysisResult';
import type { AnalysisRow } from './analysisRow';
import type { AnalysisTable } from './analysisTable';
import type { GroupReport } from './groupReport';

import { ENOUGH_REELS, STOCK_ABOVE, WEAK_SOLD_MAX } from './analysisRules';
import { buildReelsPlan } from './buildReelsPlan';

const bySales = (first: AnalysisRow, second: AnalysisRow): number =>
  second.soldTwo - first.soldTwo || second.soldLast - first.soldLast || first.line - second.line;
const byStock = (first: AnalysisRow, second: AnalysisRow): number => second.stock - first.stock || first.line - second.line;
const byStockReels = (first: AnalysisRow, second: AnalysisRow): number => second.stock - first.stock || second.reels - first.reels || first.line - second.line;

const sumOf = (rows: AnalysisRow[], pick: (row: AnalysisRow) => number): number => rows.reduce((total, row) => total + pick(row), 0);
const isWeak = (row: AnalysisRow): boolean => row.soldTwo <= WEAK_SOLD_MAX;

function reportGroup(rows: AnalysisRow[]): GroupReport {
  return {
    items: rows.length,
    soldLast: sumOf(rows, (row) => row.soldLast),
    soldTwo: sumOf(rows, (row) => row.soldTwo),
    stock: sumOf(rows, (row) => row.stock),
    reels: sumOf(rows, (row) => row.reels),
    noReels: rows.filter((row) => row.reels === 0).length,
    best: rows.filter((row) => row.soldTwo > WEAK_SOLD_MAX).sort(bySales),
    weak: rows.filter((row) => isWeak(row) && row.stock > 0).sort(byStock),
    unsold: rows.filter((row) => row.soldTwo <= 0 && row.stock > 0).sort(byStock),
    piling: rows.filter((row) => isWeak(row) && row.stock > STOCK_ABOVE).sort(byStock),
  };
}

// A new discount: main assortment, stock above the limit, weak sales, and enough published Reels.
const isCandidate = (row: AnalysisRow): boolean => row.stock > STOCK_ABOVE && isWeak(row) && row.reels >= ENOUGH_REELS;

/**
 * Counts the two groups apart: promo products (yellow and red rows) and the main assortment.
 * The content plan and the discount candidates use the main assortment only.
 */
export function analyzeRows(table: AnalysisTable): AnalysisResult {
  const promo = table.rows.filter((row) => row.group === 'promo');
  const main = table.rows.filter((row) => row.group === 'main');
  const candidates = main.filter(isCandidate).sort(byStockReels);
  const planned = main.filter((row) => row.stock > 0 && !isCandidate(row));
  return {
    promo: reportGroup(promo),
    main: reportGroup(main),
    candidates,
    plan: buildReelsPlan(planned),
    lastWeekLabel: table.lastWeekLabel,
    prevWeekLabel: table.prevWeekLabel,
    stockLabel: table.stockLabel,
  };
}
