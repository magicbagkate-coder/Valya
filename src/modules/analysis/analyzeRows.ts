import type { AnalysisResult } from './analysisResult';
import type { AnalysisRow } from './analysisRow';
import type { AnalysisTable } from './analysisTable';
import type { GroupReport } from './groupReport';

import { ENOUGH_REELS, STOCK_ABOVE } from './analysisRules';
import { buildReelsPlan } from './buildReelsPlan';

const bySales = (first: AnalysisRow, second: AnalysisRow): number => second.sold - first.sold || first.line - second.line;
const byStock = (first: AnalysisRow, second: AnalysisRow): number => second.stock - first.stock || first.line - second.line;
const byStockReels = (first: AnalysisRow, second: AnalysisRow): number => second.stock - first.stock || second.reels - first.reels || first.line - second.line;
const byPeriodReels = (first: AnalysisRow, second: AnalysisRow): number => second.periodReels - first.periodReels || first.line - second.line;

const sumOf = (rows: AnalysisRow[], pick: (row: AnalysisRow) => number): number => rows.reduce((total, row) => total + pick(row), 0);

function reportGroup(job: { rows: AnalysisRow[]; weakMax: number }): GroupReport {
  const { rows } = job;
  const isWeak = (row: AnalysisRow): boolean => row.sold <= job.weakMax;
  return {
    items: rows.length,
    sold: sumOf(rows, (row) => row.sold),
    stock: sumOf(rows, (row) => row.stock),
    reels: sumOf(rows, (row) => row.reels),
    periodReels: sumOf(rows, (row) => row.periodReels),
    noReels: rows.filter((row) => row.reels === 0).length,
    best: rows.filter((row) => row.sold > job.weakMax).sort(bySales),
    weak: rows.filter((row) => isWeak(row) && row.stock > 0).sort(byStock),
    unsold: rows.filter((row) => row.sold <= 0 && row.stock > 0).sort(byStock),
    piling: rows.filter((row) => isWeak(row) && row.stock > STOCK_ABOVE).sort(byStock),
    published: rows.filter((row) => row.periodReels > 0).sort(byPeriodReels),
  };
}

// A new discount: main assortment, stock above the limit, weak sales, and enough published Reels (all time).
const isCandidate = (row: AnalysisRow, weakMax: number): boolean => row.stock > STOCK_ABOVE && row.sold <= weakMax && row.reels >= ENOUGH_REELS;

/**
 * Counts the two groups apart: promo products (yellow and red rows) and the main assortment.
 * The content plan and the discount candidates use the main assortment only, and only when there are sales to judge.
 */
export function analyzeRows(table: AnalysisTable): AnalysisResult {
  const { weakMax } = table;
  const promo = table.rows.filter((row) => row.group === 'promo');
  const main = table.rows.filter((row) => row.group === 'main');
  const candidates = table.hasSales ? main.filter((row) => isCandidate(row, weakMax)).sort(byStockReels) : [];
  const planned = table.hasSales ? main.filter((row) => row.stock > 0 && !isCandidate(row, weakMax)) : [];
  return {
    promo: reportGroup({ rows: promo, weakMax }),
    main: reportGroup({ rows: main, weakMax }),
    candidates,
    plan: buildReelsPlan(planned),
    stockLabel: table.stockLabel,
    periodText: table.periodText,
    notes: table.notes,
    hasSales: table.hasSales,
    weakMax,
    windowed: table.windowed,
  };
}
