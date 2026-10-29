function textOfObject(value: object): string {
  if ('text' in value && typeof value.text === 'string') return value.text;
  if ('result' in value) return cellText(value.result);
  if (!('richText' in value) || !Array.isArray(value.richText)) return '';
  return value.richText.map((part: unknown) => cellText(part)).join('');
}

/** Reads the text of a spreadsheet cell. Returns an empty text for an empty cell. */
export function cellText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return textOfObject(value);
  return '';
}

/** Reads the number of a spreadsheet cell. Returns undefined if the cell has no number. */
export function cellNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const text = cellText(value).replace(',', '.').trim();
  if (text === '') return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}
