const RANGE_PATTERN = /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[.,]\s*(\d{1,2})/;
const SALES_DAY_PATTERN = /продаж\D{0,15}?(\d{1,2})\s*[.,]\s*(\d{1,2})/i;
const STOCK_PATTERN = /остат\D{0,15}?(\d{1,2})\s*[.,]\s*(\d{1,2})/i;
const DATE_PATTERN = /(\d{1,2})\s*[.,]\s*(\d{1,2})/;

/** What the user wrote in the message: the sales period and the stock date, in the style of the sheet. */
export type Hints = { period?: string; stockDate?: string };

const padNumber = (value: string | undefined): string => (value ?? '').padStart(2, '0');

function findPeriod(text: string): string | undefined {
  const range = RANGE_PATTERN.exec(text);
  if (range) return `${padNumber(range[1])}-${padNumber(range[2])},${padNumber(range[3])}`;
  const day = SALES_DAY_PATTERN.exec(text);
  return day ? `${padNumber(day[1])},${padNumber(day[2])}` : undefined;
}

function findStockDate(text: string, hasRange: boolean): string | undefined {
  const rest = text.replace(RANGE_PATTERN, ' ');
  const stock = STOCK_PATTERN.exec(rest) ?? (hasRange ? DATE_PATTERN.exec(rest) : null);
  return stock ? `${padNumber(stock[1])},${padNumber(stock[2])}` : undefined;
}

/**
 * Finds the sales period and the stock date in a text. The labels have the style of the sheet:
 * a range "21-26,10", a day "21,10", a stock date "27,10". Other words ("за октябрь") need Claude.
 */
export function parseHints(text: string): Hints {
  return { period: findPeriod(text), stockDate: findStockDate(text, RANGE_PATTERN.test(text)) };
}
