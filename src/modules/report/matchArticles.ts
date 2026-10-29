import type { TableRow } from './tableRow';

import { isMarkdown } from './isMarkdown';

const NEXT_CHARS = new Set([' ', '-', '_', '(']);

/** The rows of each article, and the rows that the matcher refuses to use with the reason. */
export type ArticleMatch = { rows: Map<string, TableRow[]>; blocked: Map<number, string> };

function startsWithArticle(key: string, article: string): boolean {
  return key.startsWith(article) && NEXT_CHARS.has(key.charAt(article.length));
}

function findRows(article: string, table: TableRow[], known: Set<string>): TableRow[] {
  const exact = table.filter((tableRow) => tableRow.key === article);
  if (exact.length > 0) return exact;
  return table.filter((tableRow) => startsWithArticle(tableRow.key, article) && !known.has(tableRow.key));
}

function removeRow(rows: Map<string, TableRow[]>, article: string, row: number): void {
  const left = (rows.get(article) ?? []).filter((tableRow) => tableRow.row !== row);
  rows.set(article, left);
  if (left.length === 0) rows.delete(article);
}

function dropShared(match: ArticleMatch): void {
  const claims = new Map<number, string[]>();
  for (const [article, rows] of match.rows) {
    for (const tableRow of rows) claims.set(tableRow.row, [...(claims.get(tableRow.row) ?? []), article]);
  }
  for (const [row, articles] of claims) {
    if (articles.length < 2) continue;
    match.blocked.set(row, `подходит несколько артикулов: ${articles.join(', ')}`);
    for (const article of articles) removeRow(match.rows, article, row);
  }
}

/**
 * Finds the table rows of each article.
 * An exact match wins. Otherwise a row matches if its text starts with the article and a space, "-", "_", or "(" follows.
 * A row with a markdown mark never matches an article without it, and the reverse.
 */
export function matchArticles(articles: string[], table: TableRow[]): ArticleMatch {
  const known = new Set(articles);
  const match: ArticleMatch = { rows: new Map(), blocked: new Map() };
  for (const article of articles) {
    const found = findRows(article, table, known);
    const allowed = found.filter((tableRow) => isMarkdown(tableRow.key) === isMarkdown(article));
    for (const tableRow of found) {
      if (!allowed.includes(tableRow)) match.blocked.set(tableRow.row, `уценка и обычный артикул не совпадают (${article})`);
    }
    if (allowed.length > 0) match.rows.set(article, allowed);
  }
  dropShared(match);
  return match;
}
