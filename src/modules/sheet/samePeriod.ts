const normalizeLabel = (text: string): string => text.toLowerCase().replace(/\s+/g, '').replace(/\./g, ',');

/**
 * Tells if a header is the same period as the label. The text must be equal, ignoring spaces and "." or ",".
 * The user can write a day, a week, or a month, so a part match is not safe.
 */
export function samePeriod(header: string, period: string): boolean {
  return header.trim() !== '' && normalizeLabel(header) === normalizeLabel(period);
}
