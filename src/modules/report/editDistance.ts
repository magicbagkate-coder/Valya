function nextRow(previous: number[], char: string, second: string): number[] {
  const current = [(previous[0] ?? 0) + 1];
  for (let column = 1; column <= second.length; column += 1) {
    const cost = char === second[column - 1] ? 0 : 1;
    current.push(Math.min((previous[column] ?? 0) + 1, (current[column - 1] ?? 0) + 1, (previous[column - 1] ?? 0) + cost));
  }
  return current;
}

/** Counts the edits (insert, delete, replace) that turn one text into the other. */
export function editDistance(first: string, second: string): number {
  let row = Array.from(second, (_char, index) => index + 1);
  row = [0, ...row];
  for (const char of first) row = nextRow(row, char, second);
  return row[second.length] ?? 0;
}
