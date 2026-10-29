import { cellNumber, cellText } from './cellValue';

/** Tells which 1C file this is by its rows. */
export function detectKind(rows: unknown[][]): 'sales' | 'stock' | 'unknown' {
  const header = rows
    .slice(0, 2)
    .flat()
    .map((cell) => cellText(cell).toLowerCase())
    .join(' ');
  if (header.includes('итого') || header.includes('характеристик')) return 'stock';
  const first = rows[0] ?? [];
  const looksSales = cellText(first[0]).includes(', ') && cellNumber(first[1]) !== undefined;
  return looksSales ? 'sales' : 'unknown';
}
