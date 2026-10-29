import type { Hints } from './parseHints';

const PERIOD_LABEL = /^\d{2}(?:,\d{2}-\d{2},\d{2}|-\d{2},\d{2}|,\d{2})$/;
const DATE_LABEL = /^\d{2},\d{2}$/;

function readLabel(source: object, key: string, pattern: RegExp): string | undefined {
  const value = key in source ? Reflect.get(source, key) : undefined;
  return typeof value === 'string' && pattern.test(value) ? value : undefined;
}

/** Reads the JSON that Claude returns. It keeps a label only if it has the style of the sheet. */
export function parseHintsJson(text: string): Hints {
  const found = /\{[\s\S]*\}/.exec(text);
  if (!found) return {};
  try {
    const parsed: unknown = JSON.parse(found[0]);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return { period: readLabel(parsed, 'period', PERIOD_LABEL), stockDate: readLabel(parsed, 'stockDate', DATE_LABEL) };
  } catch {
    return {};
  }
}
