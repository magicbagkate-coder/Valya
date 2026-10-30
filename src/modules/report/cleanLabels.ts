import type { Hints } from './parseHints';

const PERIOD_LABEL = /^\d{2}(?:,\d{2}-\d{2},\d{2}|-\d{2},\d{2}|,\d{2})$/;
const DATE_LABEL = /^\d{2},\d{2}$/;

function readLabel(source: object, key: string, pattern: RegExp): string | undefined {
  const value = key in source ? Reflect.get(source, key) : undefined;
  return typeof value === 'string' && pattern.test(value) ? value : undefined;
}

/** Keeps a period or a stock date only if it has the style of the sheet ("21-26,10", "21,10", "27,10"). */
export function cleanLabels(input: unknown): Hints {
  if (typeof input !== 'object' || input === null) return {};
  return { period: readLabel(input, 'period', PERIOD_LABEL), stockDate: readLabel(input, 'stockDate', DATE_LABEL) };
}
