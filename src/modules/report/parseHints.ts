const PERIOD_PATTERN = /(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*[.,]\s*(\d{1,2})/;
const DATE_PATTERN = /(\d{1,2})\s*[.,]\s*(\d{1,2})/;

/** What the user wrote in the message: the sales period and the stock date, in the style of the sheet. */
export type Hints = { period?: string; stockDate?: string };

/** Finds the sales period ("21-26.10") and the stock date ("27,10") in a text. */
export function parseHints(text: string): Hints {
  const period = PERIOD_PATTERN.exec(text);
  const rest = period ? text.replace(PERIOD_PATTERN, ' ') : text;
  const date = DATE_PATTERN.exec(rest);
  return {
    period: period ? `${period[1]}-${period[2]},${period[3]}` : undefined,
    stockDate: date ? `${date[1]},${date[2]}` : undefined,
  };
}
