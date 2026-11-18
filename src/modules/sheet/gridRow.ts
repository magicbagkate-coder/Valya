import type { sheets_v4 } from '@googleapis/sheets';

// The article is in column D. The whole row has the same color, so the color of this cell is the color of the row.
const ARTICLE_INDEX = 3;

/** One row of the sheet: the text of its cells and the background color of the row (each part from 0 to 1). */
export type GridRow = { cells: string[]; red: number; green: number; blue: number };

const WHITE_COLOR = { red: 1, green: 1, blue: 1 };

// Google leaves out a color part that is 0. A cell without a color is white.
function readColor(color: sheets_v4.Schema$Color | undefined): Pick<GridRow, 'red' | 'green' | 'blue'> {
  if (!color) return WHITE_COLOR;
  return { red: color.red ?? 0, green: color.green ?? 0, blue: color.blue ?? 0 };
}

/** Turns a row of the Google API into a grid row. */
export function toGridRow(row: sheets_v4.Schema$RowData): GridRow {
  const values = row.values ?? [];
  return {
    cells: values.map((cell) => cell.formattedValue ?? ''),
    ...readColor(values[ARTICLE_INDEX]?.effectiveFormat?.backgroundColor),
  };
}
