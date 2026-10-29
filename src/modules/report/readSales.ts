import { normalizeArticle } from './normalizeArticle';
import { cellNumber, cellText } from './cellValue';

/** Adds the sales of one row. The article is the text after the last ", " in column A. */
export function addSalesRow(sales: Map<string, number>, row: unknown[]): void {
  const name = cellText(row[0]);
  const comma = name.lastIndexOf(', ');
  const quantity = cellNumber(row[1]);
  if (comma === -1 || quantity === undefined) return;
  const article = normalizeArticle(name.slice(comma + 2));
  if (article === '') return;
  sales.set(article, (sales.get(article) ?? 0) + quantity);
}

/** Reads the sales rows of the 1C file. Returns the sum of pieces for each article. A return is negative. */
export function readSales(rows: unknown[][]): Map<string, number> {
  const sales = new Map<string, number>();
  for (const row of rows) addSalesRow(sales, row);
  return sales;
}
