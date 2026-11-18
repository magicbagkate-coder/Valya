/** Reads a number from the text of a cell. An empty cell or a text gives 0. A comma works as a decimal point. */
export function toNumber(text: string): number {
  const value = Number(text.replace(',', '.').trim());
  return Number.isFinite(value) ? value : 0;
}
