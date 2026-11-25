import type { GridRow } from '@/modules/sheet';
import type { AnalysisRow } from './analysisRow';
import type { AnalysisTable } from './analysisTable';
import type { DayRange } from './dates';
import type { SalesPick } from './salesPick';
import type { TableColumns } from './tableColumns';

import { dayText, reelDay } from './dates';
import { findColumns } from './findColumns';
import { colorWords, splitArticle } from './modelKey';
import { pickSales } from './pickSales';
import { isPlanned, rowGroup } from './rowGroup';
import { toNumber } from './toNumber';

// The article is in column D. A row without an article is not a product.
const ARTICLE_INDEX = 3;
const FIRST_LINE = 2;
// Without a time frame, a Reels counts as shot when it is from the last week.
const SHOT_DAYS = 7;

type RowJob = { row: GridRow; line: number; columns: TableColumns; pick: SalesPick; today: number; window?: DayRange; shotWindow: DayRange };

const cellAt = (cells: string[], index: number): string => cells[index] ?? '';
const sumOf = (values: number[]): number => values.reduce((total, value) => total + value, 0);

// Reels published inside the time frame. A cell without a readable date is not counted there.
function countInWindow(job: { reels: string[]; today: number; window: DayRange }): number {
  return job.reels.filter((cell) => {
    const day = reelDay(cell, job.today);
    return day !== undefined && day >= job.window.from && day <= job.window.to;
  }).length;
}

// Days since the latest Reels that has a readable date.
function daysSince(job: { reels: string[]; today: number }): number | undefined {
  const days = job.reels.flatMap((cell) => {
    const day = reelDay(cell, job.today);
    return day === undefined ? [] : [day];
  });
  return days.length > 0 ? job.today - Math.max(...days) : undefined;
}

// For how many days the stock lasts at the pace of the counted sales. A product that sold and has no stock lasts 0 days.
function daysLeftOf(job: { sold: number; stock: number; salesDays: number }): number | undefined {
  if (job.sold <= 0 || job.salesDays <= 0) return undefined;
  return job.stock <= 0 ? 0 : Math.round(((job.stock * job.salesDays) / job.sold) * 10) / 10;
}

function toRow(job: RowJob): AnalysisRow[] {
  const { cells } = job.row;
  const article = cellAt(cells, ARTICLE_INDEX).trim();
  if (article === '') return [];
  const reels = cells
    .slice(job.columns.reelsFrom, job.columns.reelsTo)
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '');
  const weeks = job.pick.indexes.map((index) => toNumber(cellAt(cells, index)));
  const sold = sumOf(weeks.filter((value) => value > 0));
  const stock = toNumber(cellAt(cells, job.columns.stock));
  return [
    {
      line: job.line,
      article,
      model: article,
      color: '',
      group: rowGroup(job.row),
      planned: isPlanned(job.row),
      weeks,
      sold,
      returns: Math.abs(sumOf(weeks.filter((value) => value < 0))),
      stock,
      daysLeft: daysLeftOf({ sold, stock, salesDays: job.pick.salesDays }),
      reels: reels.length,
      periodReels: job.window ? countInWindow({ reels, today: job.today, window: job.window }) : reels.length,
      shotReels: countInWindow({ reels, today: job.today, window: job.shotWindow }),
      lastReel: reels.at(-1) ?? '',
      daysSinceReel: daysSince({ reels, today: job.today }),
    },
  ];
}

// The model and the color come from the article and from the color words that the whole table uses.
function withModels(rows: AnalysisRow[]): AnalysisRow[] {
  const colors = colorWords(rows.map((row) => row.article));
  return rows.map((row) => ({ ...row, ...splitArticle({ article: row.article, colors }) }));
}

/**
 * Reads the grid of the sheet "отчет" into product rows. Each filled cell of the content block is one published Reels.
 * With a window (a time frame), the sales columns and the Reels are counted for that frame. Today is a day number.
 */
export function readAnalysisRows(job: { grid: GridRow[]; today: number; window?: DayRange }): AnalysisTable {
  const headers = job.grid[0]?.cells ?? [];
  const columns = findColumns(headers);
  const pick = pickSales({ headers, columns, today: job.today, window: job.window });
  const shotWindow = job.window ?? { from: job.today - SHOT_DAYS + 1, to: job.today };
  const rows = job.grid.slice(1).flatMap((row, index) => toRow({ row, line: index + FIRST_LINE, columns, pick, today: job.today, window: job.window, shotWindow }));
  return {
    rows: withModels(rows),
    stockLabel: cellAt(headers, columns.stock).trim(),
    periodText: pick.periodText,
    notes: pick.notes,
    weekLabels: pick.labels,
    salesDays: pick.salesDays,
    hasSales: pick.hasSales,
    weakMax: pick.weakMax,
    windowed: job.window !== undefined,
    shotText: job.window ? pick.periodText : `с ${dayText(shotWindow.from)} по ${dayText(shotWindow.to)} (${SHOT_DAYS} дн.)`,
  };
}
