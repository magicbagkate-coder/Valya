// Two full dates: "23,10-29,10" or "с 23.10 по 29.10".
const FULL_RANGE = /(\d{1,2})\s*[.,]\s*(\d{1,2})\s*(?:[-–—]|по)\s*(\d{1,2})\s*[.,]\s*(\d{1,2})/i;
// A start with the month and an end day: "с 23,10 по 29".
const SHORT_RANGE = /(\d{1,2})\s*[.,]\s*(\d{1,2})\s*по\s*(\d{1,2})(?!\s*[.,]\s*\d)/i;
// Days, then the month: "21-26.10".
const DAYS_RANGE = /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[.,]\s*(\d{1,2})/;
const SALES_DAY = /продаж\D{0,15}?(\d{1,2})\s*[.,]\s*(\d{1,2})/i;
const STOCK_DATE = /остат\D{0,15}?(\d{1,2})\s*[.,]\s*(\d{1,2})/i;
const ANY_DATE = /(\d{1,2})\s*[.,]\s*(\d{1,2})/;

/** What the user wrote in the message: the sales period and the stock date, in the style of the sheet. */
export type Hints = { period?: string; stockDate?: string };

const padNumber = (value: string | undefined): string => (value ?? '').padStart(2, '0');

function fullRangeLabel(found: RegExpExecArray): string {
  const [, firstDay, firstMonth, lastDay, lastMonth] = found.map(padNumber);
  if (firstMonth === lastMonth) return `${firstDay}-${lastDay},${firstMonth}`;
  return `${firstDay},${firstMonth}-${lastDay},${lastMonth}`;
}

const PERIOD_RULES: [RegExp, (found: RegExpExecArray) => string][] = [
  [FULL_RANGE, fullRangeLabel],
  [SHORT_RANGE, (found) => `${padNumber(found[1])}-${padNumber(found[3])},${padNumber(found[2])}`],
  [DAYS_RANGE, (found) => `${padNumber(found[1])}-${padNumber(found[2])},${padNumber(found[3])}`],
  [SALES_DAY, (found) => `${padNumber(found[1])},${padNumber(found[2])}`],
];

function findPeriod(text: string): { period?: string; rest: string } {
  for (const [pattern, buildLabel] of PERIOD_RULES) {
    const found = pattern.exec(text);
    if (found) return { period: buildLabel(found), rest: text.replace(pattern, ' ') };
  }
  return { rest: text };
}

/**
 * Finds the sales period and the stock date in a text. The labels have the style of the sheet:
 * a range "21-26,10", a day "21,10", a stock date "27,10". Other words ("за октябрь") need Claude.
 */
export function parseHints(text: string): Hints {
  const { period, rest } = findPeriod(text);
  const stock = STOCK_DATE.exec(rest) ?? (period ? ANY_DATE.exec(rest) : null);
  return { period, stockDate: stock ? `${padNumber(stock[1])},${padNumber(stock[2])}` : undefined };
}
