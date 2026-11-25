import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SheetDump } from '@/modules/sheet';

import { buildCsvFiles } from './buildCsvFiles';
import { colorName } from './colorName';
import { describeFiles } from './describeFiles';

const WHITE_COLOR = { red: 1, green: 1, blue: 1 };
const YELLOW_COLOR = { red: 1, green: 1, blue: 0 };
const PURPLE_COLOR = { red: 0.6, green: 0, blue: 1 };

const mainSheet: SheetDump = {
  title: 'отчет',
  rows: [
    { cells: ['фото', '', '', '', 'Приход ', '11.11-17.11', 'остаток17,11'], ...WHITE_COLOR },
    { cells: ['', '', 'Сумка "Лето", чёрная', 'A1', '10', '2', '7'], ...PURPLE_COLOR },
    { cells: ['', '', '', '', '', '', ''], ...WHITE_COLOR },
    { cells: ['', '', 'Рюкзак', 'B2', '5', '0', '3'], ...YELLOW_COLOR },
  ],
};

const otherSheet: SheetDump = { title: 'Лист11', rows: [{ cells: ['Название', 'Кол'], ...WHITE_COLOR }, { cells: ['Ремень', '4'], ...WHITE_COLOR }] };

describe('colorName', () => {
  it('names the colors of the table', () => {
    assert.equal(colorName(WHITE_COLOR), 'white');
    assert.equal(colorName(YELLOW_COLOR), 'yellow');
    assert.equal(colorName({ red: 1, green: 0, blue: 0 }), 'red');
    assert.equal(colorName(PURPLE_COLOR), 'purple');
    assert.equal(colorName({ red: 0.27, green: 0.74, blue: 0.78 }), 'light-blue');
    assert.equal(colorName({ red: 0.31, green: 0.7, blue: 0.8 }), 'light-blue');
  });

  it('writes an unknown color as a hex code', () => {
    assert.equal(colorName({ red: 0.5, green: 0.5, blue: 0.5 }), '#808080');
  });
});

describe('buildCsvFiles', () => {
  const files = buildCsvFiles([mainSheet, otherSheet]);

  it('makes one file for each sheet and keeps the line numbers of the Google sheet', () => {
    assert.deepEqual(files.map((file) => [file.name, file.sheet, file.rows]), [['sheet_1.csv', 'отчет', 2], ['sheet_2.csv', 'Лист11', 1]]);
    const lines = files[0]?.text.split('\n') ?? [];
    assert.equal(lines[0], 'line,row_color,group,planned,A фото,B,C,D,E Приход,F 11.11-17.11,"G остаток17,11"');
    assert.equal(lines[1], '2,purple,main,yes,,,"Сумка ""Лето"", чёрная",A1,10,2,7');
    assert.equal(lines[2], '4,yellow,promo,no,,,Рюкзак,B2,5,0,3');
    assert.equal(lines.length, 3);
  });

  it('gives the group and the planned mark only to the sheet "отчет"', () => {
    assert.equal(files[1]?.text, 'line,row_color,A Название,B Кол\n2,white,Ремень,4');
  });

  it('skips a sheet without data rows', () => {
    assert.equal(buildCsvFiles([{ title: 'Пусто', rows: [{ cells: ['x'], ...WHITE_COLOR }] }]).length, 0);
  });
});

describe('describeFiles', () => {
  it('tells which file is which sheet and its columns', () => {
    const text = describeFiles(buildCsvFiles([mainSheet]));
    assert.match(text, /^- sheet_1\.csv = sheet «отчет», 2 rows\. Columns: line \| row_color \| group \| planned \| A фото/);
  });
});
