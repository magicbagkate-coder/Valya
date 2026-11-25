import type { GridRow } from '@/modules/sheet';
import type { AnalysisRow } from './analysisRow';
import type { AnalysisTable } from './analysisTable';
import type { DayRange } from './dates';
import type { SalesPick } from './salesPick';
import type { TableColumns } from './tableColumns';

import { dayText, reelDay } from './dates';
import { findColumns } from './findColumns';
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

// Reels published inside the time frame. A cell without a readable date is not counted there.
function countInWindow(job: { reels: string[]; today: number; window: DayRange }): number {
  return job.reels.filter((cell) => {
    const day = reelDay(cell, job.today);
    return day !== undefined && day >= job.window.from && day <= job.window.to;
  }).length;
}

function toRow(job: RowJob): AnalysisRow[] {
  const { cells } = job.row;
  const article = cellAt(cells, ARTICLE_INDEX).trim();
  if (article === '') return [];
  const reels = cells
    .slice(job.columns.reelsFrom, job.columns.reelsTo)
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '');
  return [
    {
      line: job.line,
      article,
      group: rowGroup(job.row),
      planned: isPlanned(job.row),
      sold: job.pick.indexes.reduce((total, index) => total + toNumber(cellAt(cells, index)), 0),
      stock: toNumber(cellAt(cells, job.columns.stock)),
      reels: reels.length,
      periodReels: job.window ? countInWindow({ reels, today: job.today, window: job.window }) : reels.length,
      shotReels: countInWindow({ reels, today: job.today, window: job.shotWindow }),
      lastReel: reels.at(-1) ?? '',
    },
  ];
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
    rows,
    stockLabel: cellAt(headers, columns.stock).trim(),
    periodText: pick.periodText,
    notes: pick.notes,
    hasSales: pick.hasSales,
    weakMax: pick.weakMax,
    windowed: job.window !== undefined,
    shotText: job.window ? pick.periodText : `с ${dayText(shotWindow.from)} по ${dayText(shotWindow.to)} (${SHOT_DAYS} дн.)`,
  };
}
