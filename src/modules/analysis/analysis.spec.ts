import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { GridRow } from '@/modules/sheet';

import { analyzeRows } from './analyzeRows';
import { buildReelsPlan } from './buildReelsPlan';
import { findColumns } from './findColumns';
import { formatAnalysis } from './formatAnalysis';
import { readAnalysisRows } from './readAnalysisRows';
import { dueReportDate } from './reportTime';
import { rowGroup } from './rowGroup';

const HEADER_CELLS = ['фото', 'дата прих', '', '', 'Приход ', '04-10.11', '11.11-17.11', 'остаток17,11', 'ДАТА ВЫЛОЖЕННОГО КОНТЕНТА ', '', '', '', 'ДАТА выложеных постов '];

const YELLOW_COLOR = { red: 1, green: 1, blue: 0 };
const RED_COLOR = { red: 1, green: 0, blue: 0 };
const WHITE_COLOR = { red: 1, green: 1, blue: 1 };
const PURPLE_COLOR = { red: 0.6, green: 0, blue: 1 };

type RowJob = { article: string; color: { red: number; green: number; blue: number }; sales: [string, string]; stock: string; reels: string[]; post?: string };

function makeRow(job: RowJob): GridRow {
  const cells = ['', '', '', job.article, '10', job.sales[0], job.sales[1], job.stock, ...job.reels, ...Array<string>(4 - job.reels.length).fill(''), job.post ?? ''];
  return { cells, ...job.color };
}

const headerRow: GridRow = { cells: HEADER_CELLS, ...WHITE_COLOR };

describe('rowGroup', () => {
  it('takes yellow and red rows as promo and all other colors as main', () => {
    assert.equal(rowGroup(YELLOW_COLOR), 'promo');
    assert.equal(rowGroup(RED_COLOR), 'promo');
    assert.equal(rowGroup(WHITE_COLOR), 'main');
    assert.equal(rowGroup(PURPLE_COLOR), 'main');
    assert.equal(rowGroup({ red: 0, green: 1, blue: 0 }), 'main');
    assert.equal(rowGroup({ red: 0.98, green: 0.8, blue: 0.61 }), 'main');
  });
});

describe('findColumns', () => {
  it('finds the sales, the stock, and the block of Reels by the headers', () => {
    assert.deepEqual(findColumns(HEADER_CELLS), { lastWeek: 6, prevWeek: 5, stock: 7, reelsFrom: 8, reelsTo: 12 });
  });

  it('says what is missing in the header', () => {
    assert.throws(() => findColumns(['фото', '', '', '', 'Приход ', '11.11']), /остаток/);
    assert.throws(() => findColumns(['фото', '', '', '', 'Приход ', '11.11', 'остаток17,11']), /ВЫЛОЖЕННОГО КОНТЕНТА/);
  });
});

describe('readAnalysisRows', () => {
  it('counts sales, stock, and the filled cells of the Reels block (not the posts)', () => {
    const grid = [headerRow, makeRow({ article: 'A1', color: WHITE_COLOR, sales: ['1', '2'], stock: '7', reels: ['02.10', '23.10 сборн'], post: '10.03' }), makeRow({ article: '', color: WHITE_COLOR, sales: ['', ''], stock: '', reels: [] })];
    const table = readAnalysisRows(grid);
    assert.equal(table.rows.length, 1);
    assert.deepEqual(table.rows[0], { line: 2, article: 'A1', group: 'main', soldLast: 2, soldTwo: 3, stock: 7, reels: 2, lastReel: '23.10 сборн' });
    assert.deepEqual([table.prevWeekLabel, table.lastWeekLabel, table.stockLabel], ['04-10.11', '11.11-17.11', 'остаток17,11']);
  });
});

describe('analyzeRows', () => {
  const grid = [
    headerRow,
    makeRow({ article: 'PROMO-SELLS', color: YELLOW_COLOR, sales: ['2', '3'], stock: '4', reels: ['01.10'] }),
    makeRow({ article: 'PROMO-PILE', color: RED_COLOR, sales: ['0', '0'], stock: '9', reels: ['01.10', '02.10', '03.10', '04.10'] }),
    makeRow({ article: 'MAIN-SELLS', color: WHITE_COLOR, sales: ['1', '4'], stock: '6', reels: ['05.10'] }),
    makeRow({ article: 'MAIN-DISCOUNT', color: PURPLE_COLOR, sales: ['0', '1'], stock: '8', reels: ['01.10', '02.10', '03.10'] }),
    makeRow({ article: 'MAIN-FEW-REELS', color: WHITE_COLOR, sales: ['0', '0'], stock: '9', reels: ['01.10'] }),
    makeRow({ article: 'MAIN-NO-STOCK', color: WHITE_COLOR, sales: ['3', '3'], stock: '0', reels: [] }),
  ];
  const result = analyzeRows(readAnalysisRows(grid));

  it('counts the promo products and the main assortment apart', () => {
    assert.equal(result.promo.items, 2);
    assert.equal(result.main.items, 4);
    assert.equal(result.promo.soldTwo, 5);
    assert.equal(result.main.soldTwo, 12);
    assert.deepEqual(result.promo.best.map((row) => row.article), ['PROMO-SELLS']);
    assert.deepEqual(result.promo.unsold.map((row) => row.article), ['PROMO-PILE']);
    assert.deepEqual(result.promo.piling.map((row) => row.article), ['PROMO-PILE']);
    assert.equal(result.main.reels, 5);
    assert.equal(result.main.noReels, 1);
  });

  it('finds discount candidates only in the main assortment', () => {
    assert.deepEqual(result.candidates.map((row) => row.article), ['MAIN-DISCOUNT']);
  });

  it('keeps promo products and discount candidates out of the content plan', () => {
    const names = result.plan.map((item) => item.article);
    assert.ok(!names.includes('PROMO-SELLS') && !names.includes('PROMO-PILE'));
    assert.ok(!names.includes('MAIN-DISCOUNT') && !names.includes('MAIN-NO-STOCK'));
    assert.deepEqual(names, ['MAIN-SELLS', 'MAIN-FEW-REELS']);
  });

  it('writes a report with the sections and the rules', () => {
    const text = formatAnalysis(result);
    assert.match(text, /АКЦИОННЫЕ ТОВАРЫ \(жёлтые и красные строки\): 2 позиций/);
    assert.match(text, /ОСНОВНОЙ АССОРТИМЕНТ/);
    assert.match(text, /КАНДИДАТЫ НА НОВУЮ СКИДКУ/);
    assert.match(text, /• MAIN-DISCOUNT \(стр\. 5\)/);
    assert.match(text, /НОВЫЙ КОНТЕНТ-ПЛАН: 6 Reels на неделю/);
    assert.match(text, /Для акционных товаров я не считаю Reels/);
  });
});

describe('buildReelsPlan', () => {
  const makeItem = (index: number): GridRow => makeRow({ article: `ITEM-${index}`, color: WHITE_COLOR, sales: ['0', String(index % 5)], stock: '3', reels: [] });

  it('gives one Reels to each of the 70 best products when there are enough', () => {
    const rows = readAnalysisRows([headerRow, ...Array.from({ length: 100 }, (empty, index) => makeItem(index))]).rows;
    const plan = buildReelsPlan(rows);
    assert.equal(plan.length, 70);
    assert.equal(plan.reduce((sum, item) => sum + item.count, 0), 70);
    assert.ok(plan.every((item) => item.count === 1));
  });

  it('gives at most 3 Reels to a product and may stay under 70', () => {
    const rows = readAnalysisRows([headerRow, ...Array.from({ length: 10 }, (empty, index) => makeItem(index))]).rows;
    const plan = buildReelsPlan(rows);
    assert.equal(plan.reduce((sum, item) => sum + item.count, 0), 30);
    assert.ok(plan.every((item) => item.count === 3));
  });
});

describe('dueReportDate', () => {
  it('is due on Wednesday from 09:00 to 11:59', () => {
    assert.equal(dueReportDate('2026-11-18 09:00'), '2026-11-18');
    assert.equal(dueReportDate('2026-11-18 11:59'), '2026-11-18');
  });

  it('is not due at another time', () => {
    assert.equal(dueReportDate('2026-11-18 08:59'), undefined);
    assert.equal(dueReportDate('2026-11-18 12:00'), undefined);
    assert.equal(dueReportDate('2026-11-19 09:30'), undefined);
    assert.equal(dueReportDate('not a clock'), undefined);
  });
});
