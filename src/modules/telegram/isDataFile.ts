/** Tells if a file name is a data file that the bot can open: Excel, CSV, text, or JSON. */
export function isDataFile(name: string): boolean {
  return /\.(xlsx|xls|csv|tsv|txt|json)$/i.test(name);
}
