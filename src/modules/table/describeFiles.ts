import type { CsvFile } from './csvFile';

// A very wide sheet must not fill the whole context with column names.
const MAX_COLUMNS_TEXT = 900;

/** Tells which file is which sheet, how many rows it has, and its column names. This text goes to the AI with the files. */
export function describeFiles(files: CsvFile[]): string {
  return files
    .map((file) => {
      const columns = file.columns.join(' | ');
      const shown = columns.length > MAX_COLUMNS_TEXT ? `${columns.slice(0, MAX_COLUMNS_TEXT)}…` : columns;
      return `- ${file.name} = sheet «${file.sheet}», ${file.rows} rows. Columns: ${shown}`;
    })
    .join('\n');
}
