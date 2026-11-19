import type { TableColumns } from './tableColumns';

import { normalizeArticle } from '@/modules/report';

// Column F, if the sheet has no column "Приход" before the sales columns.
const FIRST_SALES = 5;

/**
 * Finds the columns by their headers. The sales columns lie before the stock column "остаток…".
 * The published Reels are in the block that starts at "ДАТА ВЫЛОЖЕННОГО КОНТЕНТА" and ends where the block of posts starts.
 */
export function findColumns(headers: string[]): TableColumns {
  const names = headers.map((header) => normalizeArticle(header));
  const stock = names.findIndex((name) => name.startsWith('ОСТАТОК'));
  const reelsFrom = names.findIndex((name) => name.includes('ВЫЛОЖЕННОГО КОНТЕНТА'));
  const income = names.findIndex((name) => name.startsWith('ПРИХОД'));
  const firstSales = income >= 0 ? income + 1 : FIRST_SALES;
  if (stock < 1 || stock - 1 < firstSales) throw new Error('В шапке таблицы нет колонки «остаток…» после колонок продаж.');
  if (reelsFrom < 0) throw new Error('В шапке таблицы нет колонки «ДАТА ВЫЛОЖЕННОГО КОНТЕНТА».');
  const postsFrom = names.findIndex((name, index) => index > reelsFrom && name.includes('ПОСТОВ'));
  return {
    salesFrom: firstSales,
    lastWeek: stock - 1,
    prevWeek: stock - 2 >= firstSales ? stock - 2 : -1,
    stock,
    reelsFrom,
    reelsTo: postsFrom > 0 ? postsFrom : Number.MAX_SAFE_INTEGER,
  };
}
