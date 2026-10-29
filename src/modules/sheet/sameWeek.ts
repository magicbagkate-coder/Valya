function weekKey(text: string): string {
  const numbers = text.match(/\d+/g) ?? [];
  if (numbers.length < 3) return '';
  return `${Number(numbers[0])}.${Number(numbers[numbers.length - 1])}`;
}

/**
 * Tells if a header is the same week as the period. The first day and the month must be equal.
 * The last day can differ: the sheet has "21-27,10" when the user says "21-26,10".
 */
export function sameWeek(header: string, period: string): boolean {
  const key = weekKey(header);
  return key !== '' && key === weekKey(period);
}
