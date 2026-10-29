import type { ArticleMatch } from './matchArticles';
import type { PlanResult } from './planResult';
import type { TableRow } from './tableRow';

import { findSimilar } from './findSimilar';
import { isMarkdown } from './isMarkdown';
import { looksLikeArticle } from './looksLikeArticle';
import { matchArticles } from './matchArticles';

type PlanInput = { table: TableRow[]; sales: Map<string, number>; stock: Map<string, number> };

function emptyPlan(): PlanResult {
  return {
    salesWrites: new Map(),
    stockWrites: new Map(),
    untouched: [],
    zeroed: [],
    duplicates: [],
    salesMissing: 0,
    stockMissing: 0,
    salesTotal: 0,
    stockTotal: 0,
  };
}

function noteBlocked(plan: PlanResult, kind: 'sales' | 'stock', blocked: { match: ArticleMatch; byRow: Map<number, TableRow> }): void {
  const { match, byRow } = blocked;
  for (const [row, reason] of match.blocked) {
    plan.untouched.push({ kind, row, text: byRow.get(row)?.raw ?? '', reason, old: byRow.get(row)?.oldStock ?? '' });
  }
}

function planSales(plan: PlanResult, sales: Map<string, number>, match: ArticleMatch): void {
  plan.salesMissing = sales.size - match.rows.size;
  for (const [article, rows] of match.rows) {
    const first = rows[0];
    const quantity = sales.get(article) ?? 0;
    if (!first || quantity === 0) continue;
    plan.salesWrites.set(first.row, quantity);
    plan.salesTotal += quantity;
    if (rows.length > 1) plan.duplicates.push(`${article}: продажи записаны в первую строку ${first.row} из ${rows.map((one) => one.row).join(', ')}`);
  }
}

function unmatchedReason(key: string, loose: string[]): string | undefined {
  if (!looksLikeArticle(key)) return 'это не артикул';
  if (isMarkdown(key)) return 'уценка, в остатках нет такой строки';
  const similar = findSimilar(key, loose);
  return similar ? `в остатках есть похожий артикул «${similar}»` : undefined;
}

function planZero(plan: PlanResult, tableRow: TableRow, loose: string[]): void {
  const reason = unmatchedReason(tableRow.key, loose);
  if (reason) {
    plan.untouched.push({ kind: 'stock', row: tableRow.row, text: tableRow.raw, reason, old: tableRow.oldStock });
    return;
  }
  const old = Number(tableRow.oldStock.replace(',', '.'));
  plan.stockWrites.set(tableRow.row, 0);
  if (old > 0) plan.zeroed.push({ row: tableRow.row, text: tableRow.raw, old });
}

function planStock(plan: PlanResult, input: PlanInput, match: ArticleMatch): void {
  const matched = new Set<number>();
  plan.stockMissing = input.stock.size - match.rows.size;
  for (const [article, rows] of match.rows) {
    const quantity = input.stock.get(article) ?? 0;
    for (const tableRow of rows) {
      plan.stockWrites.set(tableRow.row, quantity);
      plan.stockTotal += quantity;
      matched.add(tableRow.row);
    }
    if (rows.length > 1) plan.duplicates.push(`${article}: остаток записан в строки ${rows.map((one) => one.row).join(', ')}`);
  }
  const loose = [...input.stock.keys()].filter((article) => !match.rows.has(article));
  const rest = input.table.filter((tableRow) => tableRow.key !== '' && !matched.has(tableRow.row) && !match.blocked.has(tableRow.row));
  for (const tableRow of rest) planZero(plan, tableRow, loose);
}

/**
 * Decides what to write for each table row. It writes sales and stock as the instruction says,
 * and it leaves unclear rows alone with a reason.
 */
export function buildPlan(input: PlanInput): PlanResult {
  const byRow = new Map(input.table.map((tableRow) => [tableRow.row, tableRow]));
  const salesMatch = matchArticles([...input.sales.keys()], input.table);
  const stockMatch = matchArticles([...input.stock.keys()], input.table);
  const plan = emptyPlan();
  planSales(plan, input.sales, salesMatch);
  planStock(plan, input, stockMatch);
  noteBlocked(plan, 'sales', { match: salesMatch, byRow });
  noteBlocked(plan, 'stock', { match: stockMatch, byRow });
  return plan;
}
