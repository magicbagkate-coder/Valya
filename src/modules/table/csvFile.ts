/** One sheet of the Google table as a CSV file: its name, its text, the title of the sheet, the number of data rows, and the column names. */
export type CsvFile = { name: string; text: string; sheet: string; rows: number; columns: string[] };
