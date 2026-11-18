import type { GridRow } from '@/modules/sheet';
import type { AnalysisRow } from './analysisRow';
import type { AnalysisTable } from './analysisTable';
import type { TableColumns } from './tableColumns';

import { findColumns } from './findColumns';
import { rowGroup } from './rowGroup';
import { toNumber } from './toNumber';

// The article is in column D. A row without an article is not a product.
const ARTICLE_INDEX = 3;
const FIRST_LINE = 2;

const cellAt = (cells: string[], index: number): string => cells[index] ?? '';

function toRow(job: { row: GridRow; line: number; columns: TableColumns }): AnalysisRow[] {
  const { cells } = job.row;
  const { columns } = job;
  const article = cellAt(cells, ARTICLE_INDEX).trim();
  if (article === '') return [];
  const soldLast = toNumber(cellAt(cells, columns.lastWeek));
  const soldBefore = columns.prevWeek >= 0 ? toNumber(cellAt(cells, columns.prevWeek)) : 0;
  const reels = cells
    .slice(columns.reelsFrom, columns.reelsTo)
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '');
  return [
    {
      line: job.line,
      article,
      group: rowGroup(job.row),
      soldLast,
      soldTwo: soldLast + soldBefore,
      stock: toNumber(cellAt(cells, columns.stock)),
      reels: reels.length,
      lastReel: reels.at(-1) ?? '',
    },
  ];
}

/** Reads the grid of the sheet "отчет" into product rows. Each filled cell of the content block is one published Reels. */
export function readAnalysisRows(grid: GridRow[]): AnalysisTable {
  const headers = grid[0]?.cells ?? [];
  const columns = findColumns(headers);
  const rows = grid.slice(1).flatMap((row, index) => toRow({ row, line: index + FIRST_LINE, columns }));
  return {
    rows,
    lastWeekLabel: cellAt(headers, columns.lastWeek).trim(),
    prevWeekLabel: columns.prevWeek >= 0 ? cellAt(headers, columns.prevWeek).trim() : '',
    stockLabel: cellAt(headers, columns.stock).trim(),
  };
}
