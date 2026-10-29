import { Workbook } from 'exceljs';

/** Reads the first sheet of an xlsx file. Returns the cell values of each row, from column A. */
export async function loadRows(buffer: Buffer): Promise<unknown[][]> {
  const workbook = new Workbook();
  await workbook.xlsx.load(Uint8Array.from(buffer).buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The file has no sheets.');
  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row) => {
    const values = row.values;
    rows.push(Array.isArray(values) ? values.slice(1) : []);
  });
  return rows;
}
