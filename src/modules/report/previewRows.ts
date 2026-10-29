import { cellText } from './cellValue';

const MAX_ROWS = 3;
const MAX_LENGTH = 90;

/** Shows the first non-empty rows of a file as short text, to explain why a file is not clear. */
export function previewRows(rows: unknown[][]): string {
  return rows
    .map((row) => row.slice(0, 4).map(cellText).join(' | '))
    .filter((line) => line.replace(/[\s|]/g, '') !== '')
    .slice(0, MAX_ROWS)
    .map((line, index) => `${index + 1}) ${line.slice(0, MAX_LENGTH)}`)
    .join('\n');
}
