import type { AnalysisResult } from './analysisResult';
import type { AnalysisRow } from './analysisRow';
import type { AnalysisTable } from './analysisTable';
import type { ColorPlan } from './colorPlan';
import type { DiscountGroups } from './discountGroups';
import type { GroupReport } from './groupReport';

import { ALT_STOCK_MIN, ENOUGH_REELS, FRESH_REEL_DAYS, LOW_STOCK, RUN_OUT_DAYS, RUN_OUT_SOLD, STALE_REEL_DAYS, STOCK_ABOVE } from './analysisRules';
import { buildReelsPlan } from './buildReelsPlan';
import { summarizeModels } from './summarizeModels';

const bySales = (first: AnalysisRow, second: AnalysisRow): number => second.sold - first.sold || first.line - second.line;
const byStock = (first: AnalysisRow, second: AnalysisRow): number => second.stock - first.stock || first.line - second.line;
const byStockReels = (first: AnalysisRow, second: AnalysisRow): number => second.stock - first.stock || second.reels - first.reels || first.line - second.line;
const byPeriodReels = (first: AnalysisRow, second: AnalysisRow): number => second.periodReels - first.periodReels || first.line - second.line;
const byRunOut = (first: AnalysisRow, second: AnalysisRow): number => (first.daysLeft ?? 0) - (second.daysLeft ?? 0) || second.sold - first.sold || first.line - second.line;
const byReturns = (first: AnalysisRow, second: AnalysisRow): number => second.returns - first.returns || first.line - second.line;

const sumOf = (rows: AnalysisRow[], pick: (row: AnalysisRow) => number): number => rows.reduce((total, row) => total + pick(row), 0);
const isRunningOut = (row: AnalysisRow): boolean => row.sold >= RUN_OUT_SOLD && row.daysLeft !== undefined && row.daysLeft <= RUN_OUT_DAYS;

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
    runningOut: rows.filter(isRunningOut).sort(byRunOut),
    published: rows.filter((row) => row.periodReels > 0).sort(byPeriodReels),
  };
}

// The colored rows of the main assortment are planned. A planned row is shot when it has a Reels in the shooting period.
function colorPlanOf(job: { main: AnalysisRow[]; shotText: string }): ColorPlan {
  const planned = job.main.filter((row) => row.planned);
  const shot = planned.filter((row) => row.shotReels > 0);
  return {
    planned: planned.length,
    shot: shot.length,
    shotReels: sumOf(shot, (row) => row.shotReels),
    unshot: planned.filter((row) => row.shotReels === 0).sort(byStock),
    shotText: job.shotText,
  };
}

// A new discount: main assortment, stock above the limit, weak sales, and enough published Reels (all time).
const isCandidate = (row: AnalysisRow, weakMax: number): boolean => row.stock > STOCK_ABOVE && row.sold <= weakMax && row.reels >= ENOUGH_REELS;

// The age of the last Reels says what to do first. No readable date means the content is not known to be fresh.
function candidateGroup(row: AnalysisRow): keyof DiscountGroups {
  if (row.daysSinceReel === undefined || row.daysSinceReel > STALE_REEL_DAYS) return 'refresh';
  return row.daysSinceReel <= FRESH_REEL_DAYS ? 'wait' : 'price';
}

function groupCandidates(job: { main: AnalysisRow[]; weakMax: number }): DiscountGroups {
  const candidates = job.main.filter((row) => isCandidate(row, job.weakMax)).sort(byStockReels);
  return {
    price: candidates.filter((row) => candidateGroup(row) === 'price'),
    refresh: candidates.filter((row) => candidateGroup(row) === 'refresh'),
    wait: candidates.filter((row) => candidateGroup(row) === 'wait'),
  };
}

// The stock of a model, all colors together.
function stockByModel(main: AnalysisRow[]): Map<string, number> {
  const stocks = new Map<string, number>();
  for (const row of main) stocks.set(row.model, (stocks.get(row.model) ?? 0) + row.stock);
  return stocks;
}

// A stock of 1–2 is kept out of the separate Reels, unless the other colors of the model have enough stock.
function isLowStock(job: { row: AnalysisRow; modelStock: Map<string, number> }): boolean {
  const others = (job.modelStock.get(job.row.model) ?? 0) - job.row.stock;
  return job.row.stock > 0 && job.row.stock <= LOW_STOCK && others < ALT_STOCK_MIN;
}

/**
 * Counts the two groups apart: promo products (yellow and red rows) and the main assortment.
 * Discounts, the low stock rule, models, and the content plan use the main assortment only, and only when there are sales to judge.
 * A candidate for a price check or for waiting gets no Reels; a candidate for a content refresh does.
 */
export function analyzeRows(table: AnalysisTable): AnalysisResult {
  const { weakMax } = table;
  const promo = table.rows.filter((row) => row.group === 'promo');
  const main = table.rows.filter((row) => row.group === 'main');
  const discount = table.hasSales ? groupCandidates({ main, weakMax }) : { price: [], refresh: [], wait: [] };
  const modelStock = stockByModel(main);
  const held = new Set([...discount.price, ...discount.wait]);
  const lowStock = table.hasSales ? main.filter((row) => isLowStock({ row, modelStock })) : [];
  const forPlan = table.hasSales ? main.filter((row) => row.stock > 0 && !held.has(row) && !lowStock.includes(row)) : [];
  return {
    promo: reportGroup({ rows: promo, weakMax }),
    main: reportGroup({ rows: main, weakMax }),
    returns: table.rows.filter((row) => row.returns > 0).sort(byReturns),
    discount,
    lowStock: lowStock.filter((row) => row.sold > 0).sort(bySales),
    plan: buildReelsPlan({ rows: forPlan, salesDays: table.salesDays }),
    models: table.hasSales ? summarizeModels(main) : [],
    colorPlan: colorPlanOf({ main, shotText: table.shotText }),
    stockLabel: table.stockLabel,
    periodText: table.periodText,
    notes: table.notes,
    weekLabels: table.weekLabels,
    hasSales: table.hasSales,
    weakMax,
    windowed: table.windowed,
  };
}
