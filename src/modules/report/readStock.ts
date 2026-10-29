import { normalizeArticle } from './normalizeArticle';
import { cellNumber, cellText } from './cellValue';

const HEADER_ROWS = 2;

/** Reads the stock rows of the 1C file: article in column B, stock in column C, data from row 3. */
export function readStock(rows: unknown[][]): Map<string, number> {
  const stock = new Map<string, number>();
  for (const row of rows.slice(HEADER_ROWS)) {
    const article = normalizeArticle(cellText(row[1]));
    const quantity = cellNumber(row[2]);
    if (article === '' || quantity === undefined) continue;
    stock.set(article, (stock.get(article) ?? 0) + quantity);
  }
  return stock;
}
