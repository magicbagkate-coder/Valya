import type { sheets_v4 } from '@googleapis/sheets';

// The article is in column D. The whole row has the same color, so the color of this cell is the color of the row.
const ARTICLE_INDEX = 3;
// A color part from 0 to 1. White is (1, 1, 1). The limit leaves room for small differences.
const WHITE_PART = 0.95;

/** One row of the sheet: the text of its cells and the background color of the row (each part from 0 to 1). */
export type GridRow = { cells: string[]; red: number; green: number; blue: number };

/** A whole sheet: its title and all its rows, the first row is the header. */
export type SheetDump = { title: string; rows: GridRow[] };

const WHITE_COLOR = { red: 1, green: 1, blue: 1 };

// Google leaves out a color part that is 0. A cell without a color is white.
function readColor(color: sheets_v4.Schema$Color | undefined): Pick<GridRow, 'red' | 'green' | 'blue'> {
  if (!color) return WHITE_COLOR;
  return { red: color.red ?? 0, green: color.green ?? 0, blue: color.blue ?? 0 };
}

const isWhite = (color: Pick<GridRow, 'red' | 'green' | 'blue'>): boolean =>
  color.red >= WHITE_PART && color.green >= WHITE_PART && color.blue >= WHITE_PART;

const textsOf = (row: sheets_v4.Schema$RowData): string[] => (row.values ?? []).map((cell) => cell.formattedValue ?? '');

/** Turns a row of the Google API into a grid row. The color of the row is the color of the article cell (column D). */
export function toGridRow(row: sheets_v4.Schema$RowData): GridRow {
  const values = row.values ?? [];
  return { cells: textsOf(row), ...readColor(values[ARTICLE_INDEX]?.effectiveFormat?.backgroundColor) };
}

/** Turns a row of any sheet into a grid row. The color of the row is the first color in it that is not white. */
export function toDumpRow(row: sheets_v4.Schema$RowData): GridRow {
  const colors = (row.values ?? []).map((cell) => readColor(cell.effectiveFormat?.backgroundColor));
  return { cells: textsOf(row), ...(colors.find((color) => !isWhite(color)) ?? WHITE_COLOR) };
}
