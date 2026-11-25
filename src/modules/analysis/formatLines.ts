import type { AnalysisRow } from './analysisRow';
import type { GroupReport } from './groupReport';

import { DAYS_SHOWN } from './analysisRules';
import { weeksText } from './trend';

/** How the report talks about the numbers: if there are sales, what counts as weak, and if the user asked for a time frame. */
export type Style = { hasSales: boolean; weakMax: number; windowed: boolean };

export type ListJob = { title: string; rows: AnalysisRow[]; toLine: (row: AnalysisRow) => string; limit: number };

/** The sales of a product. With two weeks or more it also tells each week and the trend. */
export const soldPart = (row: AnalysisRow): string => (row.weeks.length > 1 ? `продано ${row.sold} (${weeksText(row.weeks)})` : `продано ${row.sold}`);

/** The stock of a product, and for how many days it lasts if the stock is small. */
export function stockPart(row: AnalysisRow): string {
  if (row.stock <= 0) return row.sold > 0 ? 'остаток 0 (товара нет)' : 'остаток 0';
  const left = row.daysLeft !== undefined && row.daysLeft <= DAYS_SHOWN ? `, хватит на ~${row.daysLeft} дн.` : '';
  return `остаток ${row.stock}${left}`;
}

export const soldLine = (row: AnalysisRow): string => `• ${row.article} (стр. ${row.line}): ${soldPart(row)}, ${stockPart(row)}`;

// With a time frame the line tells the Reels of the frame and all Reels. Without it, only all Reels. Without sales, it does not tell the sales.
export function reelsLineFor(style: Style): (row: AnalysisRow) => string {
  return (row) => {
    const last = row.lastReel ? `, последний ${row.lastReel}` : '';
    const reels = style.windowed ? `Reels за период ${row.periodReels}, всего ${row.reels}` : `Reels ${row.reels}`;
    const sold = style.hasSales ? `${soldPart(row)}, ` : '';
    return `• ${row.article} (стр. ${row.line}): ${sold}${stockPart(row)}, ${reels}${last}`;
  };
}

export const weakText = (weakMax: number): string => `продано 0–${weakMax} шт за период`;

// A title with the number of products, and the first ones. An empty list says "нет".
export function listLines(job: ListJob): string[] {
  if (job.rows.length === 0) return [`${job.title}: нет.`];
  const shown = job.rows.length > job.limit ? `, первые ${job.limit}` : '';
  return [`${job.title}: ${job.rows.length}${shown}`, ...job.rows.slice(0, job.limit).map(job.toLine)];
}

export const totalsLine = (group: GroupReport): string => `Продано за период: ${group.sold} шт. Остаток сейчас: ${group.stock} шт.`;

export const NO_SALES_LINE = 'Продажи за этот период я не считаю, поэтому списков по продажам нет.';
