/** Turns a column index (0 is A) into its letters, for example 5 into "F" and 26 into "AA". */
export function columnLetter(index: number): string {
  let letters = '';
  let rest = index + 1;
  while (rest > 0) {
    const part = (rest - 1) % 26;
    letters = String.fromCharCode(65 + part) + letters;
    rest = Math.floor((rest - 1) / 26);
  }
  return letters;
}
