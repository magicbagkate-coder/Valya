const positivePart = (value: number): number => Math.max(0, value);

// The two last weeks, the earlier one first. A trend needs at least two weeks.
function lastTwo(weeks: number[]): [number, number] | undefined {
  return weeks.length < 2 ? undefined : [positivePart(weeks.at(-2) ?? 0), positivePart(weeks.at(-1) ?? 0)];
}

/** The mark of the trend of the last two weeks: "↑ +50%", "↓ -33%", "→", or nothing if there is only one week. */
export function trendMark(weeks: number[]): string {
  const pair = lastTwo(weeks);
  if (!pair) return '';
  const [before, last] = pair;
  if (last === before) return '→';
  if (before === 0) return '↑ новые продажи';
  const percent = Math.round(((last - before) / before) * 100);
  return `${last > before ? '↑' : '↓'} ${percent > 0 ? '+' : ''}${percent}%`;
}

/** The sales of each week with the trend, for example "2 → 4 ↑ +100%". Returns are not counted as sales. */
export function weeksText(weeks: number[]): string {
  const mark = trendMark(weeks);
  return `${weeks.map(positivePart).join(' → ')}${mark ? ` ${mark}` : ''}`;
}

/**
 * The trend as a number from 0 (falling) to 1 (growing). 0.5 means no clear trend: one week only, or less than 2 items in two weeks.
 */
export function trendValue(weeks: number[]): number {
  const pair = lastTwo(weeks);
  if (!pair || pair[0] + pair[1] < 2) return 0.5;
  const ratio = Math.max(-1, Math.min(1, (pair[1] - pair[0]) / Math.max(pair[0], 1)));
  return (ratio + 1) / 2;
}
