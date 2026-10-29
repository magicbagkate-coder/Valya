import { cellNumber, cellText } from './cellValue';

const SCAN_ROWS = 10;

function isSalesRow(row: unknown[]): boolean {
  return cellText(row[0]).includes(', ') && cellNumber(row[1]) !== undefined;
}

/**
 * Tells which 1C file this is by its rows. A stock file has the header words in the first two rows.
 * A sales file has a row with "name, article" in column A and a number in column B. A header or empty rows above are fine.
 */
export function detectKind(rows: unknown[][]): 'sales' | 'stock' | 'unknown' {
  const header = rows
    .slice(0, 2)
    .flat()
    .map((cell) => cellText(cell).toLowerCase())
    .join(' ');
  if (header.includes('итого') || header.includes('характеристик')) return 'stock';
  return rows.slice(0, SCAN_ROWS).some(isSalesRow) ? 'sales' : 'unknown';
}
