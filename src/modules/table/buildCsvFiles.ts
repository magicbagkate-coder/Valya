import type { GridRow, SheetDump } from '@/modules/sheet';
import type { CsvFile } from './csvFile';

import { isPlanned, rowGroup } from '@/modules/analysis';
import { columnLetter, SHEET_TITLE } from '@/modules/sheet';
import { colorName } from './colorName';

// A sheet is never wider than this, so a wrong sheet cannot make a huge file.
const MAX_WIDTH = 200;

const quoteCell = (text: string): string => (/[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);
const lineOf = (cells: string[]): string => cells.map(quoteCell).join(',');
const isEmptyRow = (row: GridRow): boolean => row.cells.every((cell) => cell.trim() === '');

// "F 04-10.11" is column F with the header "04-10.11". A column without a header is only its letter.
function columnNames(header: GridRow | undefined, width: number): string[] {
  return Array.from({ length: width }, (empty, index) => `${columnLetter(index)} ${(header?.cells[index] ?? '').replace(/\s+/g, ' ').trim()}`.trim());
}

// The sheet "отчет" also gets the group (promo or main) and the planned mark, counted by the same rules as the analysis.
function marksOf(job: { row: GridRow; main: boolean }): string[] {
  if (!job.main) return [];
  return [rowGroup(job.row), isPlanned(job.row) ? 'yes' : 'no'];
}

function toFile(job: { dump: SheetDump; position: number }): CsvFile {
  const { dump } = job;
  const main = dump.title.trim() === SHEET_TITLE;
  const width = Math.min(MAX_WIDTH, Math.max(0, ...dump.rows.map((row) => row.cells.length)));
  const columns = ['line', 'row_color', ...(main ? ['group', 'planned'] : []), ...columnNames(dump.rows[0], width)];
  const body = dump.rows.flatMap((row, index) =>
    index === 0 || isEmptyRow(row)
      ? []
      : [[String(index + 1), colorName(row), ...marksOf({ row, main }), ...Array.from({ length: width }, (empty, cell) => row.cells[cell] ?? '')]],
  );
  return {
    name: `sheet_${job.position}.csv`,
    text: [columns, ...body].map(lineOf).join('\n'),
    sheet: dump.title.trim(),
    rows: body.length,
    columns,
  };
}

/**
 * Turns the sheets of the Google table into CSV files, one for each sheet that has data rows.
 * Each row has its line number in the sheet and the name of its color. The sheet "отчет" also has the group and the planned mark.
 */
export function buildCsvFiles(dumps: SheetDump[]): CsvFile[] {
  return dumps.map((dump, index) => toFile({ dump, position: index + 1 })).filter((file) => file.rows > 0);
}
