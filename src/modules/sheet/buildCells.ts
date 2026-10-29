import type { PlanResult } from '@/modules/report';

import { SHEET_TITLE } from './sheetTitle';

type CellsInput = {
  plan: PlanResult;
  salesColumn: string;
  stockColumn: string;
  newHeaders: { sales?: string; stock: string };
};

/** One cell write for the Sheets API. */
export type CellWrite = { range: string; values: (string | number)[][] };

const cellOf = (column: string, row: number, value: string | number): CellWrite => ({
  range: `'${SHEET_TITLE}'!${column}${row}`,
  values: [[value]],
});

/** Lists each cell that the agent writes: new headers, sales numbers, and stock numbers. Nothing else. */
export function buildCells(input: CellsInput): CellWrite[] {
  const cells: CellWrite[] = [];
  if (input.newHeaders.sales) cells.push(cellOf(input.salesColumn, 1, input.newHeaders.sales));
  cells.push(cellOf(input.stockColumn, 1, input.newHeaders.stock));
  for (const [row, quantity] of input.plan.salesWrites) cells.push(cellOf(input.salesColumn, row, quantity));
  for (const [row, quantity] of input.plan.stockWrites) cells.push(cellOf(input.stockColumn, row, quantity));
  return cells;
}
