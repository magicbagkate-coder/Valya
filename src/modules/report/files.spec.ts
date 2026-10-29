import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Workbook } from 'exceljs';

import { detectKind } from './detectKind';
import { loadRows } from './loadRows';
import { parseHints } from './parseHints';
import { readSales } from './readSales';
import { readStock } from './readStock';

async function makeFile(rows: (string | number)[][]): Promise<Buffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Sheet1');
  for (const row of rows) sheet.addRow(row);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

describe('xlsx files', () => {
  it('reads sales: the article is the text after the last comma and a return is negative', async () => {
    const buffer = await makeFile([
      ['BALINA бочонок, шкіра M1103-BL COFFEE, M1103-BL COFFEE', 12],
      ['BALINA бочонок, шкіра M1103-BL COFFEE, m1103-bl  coffee', -2],
      ['Итого', 99],
    ]);
    const rows = await loadRows(buffer);
    assert.equal(detectKind(rows), 'sales');
    assert.deepEqual([...readSales(rows)], [['M1103-BL COFFEE', 10]]);
  });

  it('reads stock: data from row 3, article in column B, quantity in column C', async () => {
    const buffer = await makeFile([
      ['Остатки', '', ''],
      ['Номенклатура', 'Характеристика', 'Итого'],
      ['Сумка', '18297 BLACK', 1],
      ['Сумка', '18297 black', 2],
    ]);
    const rows = await loadRows(buffer);
    assert.equal(detectKind(rows), 'stock');
    assert.deepEqual([...readStock(rows)], [['18297 BLACK', 3]]);
  });
});

describe('parseHints', () => {
  it('finds the period and the date in the style of the sheet', () => {
    assert.deepEqual(parseHints('продажи 21 - 26.10, остатки 27,10'), { period: '21-26,10', stockDate: '27,10' });
  });

  it('finds nothing in a free text', () => {
    assert.deepEqual(parseHints('привет'), { period: undefined, stockDate: undefined });
  });
});
