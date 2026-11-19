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

// 2026-11-18, as the number of days since 1970-01-01.
const TEST_DAY = 20_410;

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
    assert.deepEqual(findColumns(HEADER_CELLS), { salesFrom: 5, lastWeek: 6, prevWeek: 5, stock: 7, reelsFrom: 8, reelsTo: 12 });
  });

  it('says what is missing in the header', () => {
    assert.throws(() => findColumns(['фото', '', '', '', 'Приход ', '11.11']), /остаток/);
    assert.throws(() => findColumns(['фото', '', '', '', 'Приход ', '11.11', 'остаток17,11']), /ВЫЛОЖЕННОГО КОНТЕНТА/);
  });
});

describe('readAnalysisRows without a time frame', () => {
  it('counts the last two sales columns, the stock, and the filled cells of the Reels block (not the posts)', () => {
    const grid = [headerRow, makeRow({ article: 'A1', color: WHITE_COLOR, sales: ['1', '2'], stock: '7', reels: ['02.10', '23.10 сборн'], post: '10.03' }), makeRow({ article: '', color: WHITE_COLOR, sales: ['', ''], stock: '', reels: [] })];
    const table = readAnalysisRows({ grid, today: TEST_DAY });
    assert.equal(table.rows.length, 1);
    assert.deepEqual(table.rows[0], { line: 2, article: 'A1', group: 'main', sold: 3, stock: 7, reels: 2, periodReels: 2, lastReel: '23.10 сборн' });
    assert.equal(table.periodText, 'последние 2 недели (04-10.11 и 11.11-17.11)');
    assert.equal(table.stockLabel, 'остаток17,11');
    assert.equal(table.windowed, false);
    assert.equal(table.weakMax, 1);
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
  const result = analyzeRows(readAnalysisRows({ grid, today: TEST_DAY }));

  it('counts the promo products and the main assortment apart', () => {
    assert.equal(result.promo.items, 2);
    assert.equal(result.main.items, 4);
    assert.equal(result.promo.sold, 5);
    assert.equal(result.main.sold, 12);
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
    assert.match(text, /Период: последние 2 недели \(04-10\.11 и 11\.11-17\.11\)/);
    assert.match(text, /АКЦИОННЫЕ ТОВАРЫ \(жёлтые и красные строки\): 2 позиций/);
    assert.match(text, /ОСНОВНОЙ АССОРТИМЕНТ/);
    assert.match(text, /КАНДИДАТЫ НА НОВУЮ СКИДКУ/);
    assert.match(text, /• MAIN-DISCOUNT \(стр\. 5\)/);
    assert.match(text, /НОВЫЙ КОНТЕНТ-ПЛАН: 6 Reels на неделю/);
    assert.match(text, /Для акционных товаров я не считаю Reels/);
  });
});

describe('readAnalysisRows with a time frame', () => {
  const grid = [
    headerRow,
    makeRow({ article: 'A1', color: WHITE_COLOR, sales: ['5', '2'], stock: '7', reels: ['02.10', '12.11', '15.11 сборн'] }),
    makeRow({ article: 'P1', color: YELLOW_COLOR, sales: ['1', '1'], stock: '3', reels: ['17.11'] }),
  ];

  it('counts the sales weeks that are mostly inside the frame, and the Reels of the frame', () => {
    const table = readAnalysisRows({ grid, today: TEST_DAY, window: { from: TEST_DAY - 6, to: TEST_DAY } });
    assert.equal(table.periodText, 'с 12.11 по 18.11 (7 дн.)');
    assert.equal(table.hasSales, true);
    assert.equal(table.windowed, true);
    assert.deepEqual(table.rows.map((row) => [row.article, row.sold, row.periodReels, row.reels]), [['A1', 2, 2, 3], ['P1', 1, 1, 1]]);
    assert.match(table.notes.join(' '), /есть только за 04\.11–17\.11/);
    assert.match(table.notes.join(' '), /Продажи за период: 11\.11-17\.11/);
  });

  it('counts both weeks for a longer frame, and the weak sales limit follows the counted days of sales', () => {
    const table = readAnalysisRows({ grid, today: TEST_DAY, window: { from: TEST_DAY - 59, to: TEST_DAY } });
    assert.equal(table.rows[0]?.sold, 7);
    assert.equal(table.weakMax, 1);
  });

  it('has no sales for a frame shorter than a week, but still counts Reels', () => {
    const table = readAnalysisRows({ grid, today: TEST_DAY, window: { from: TEST_DAY - 3, to: TEST_DAY - 3 } });
    assert.equal(table.hasSales, false);
    assert.deepEqual(table.rows.map((row) => [row.sold, row.periodReels]), [[0, 1], [0, 0]]);
    const result = analyzeRows(table);
    assert.deepEqual([result.candidates.length, result.plan.length], [0, 0]);
    const text = formatAnalysis(result);
    assert.match(text, /Период короче 7 дней/);
    assert.match(text, /Reels за период: 1 \(на 1 позициях\)/);
    assert.doesNotMatch(text, /НОВЫЙ КОНТЕНТ-ПЛАН: d+ Reels/);
  });
});

describe('buildReelsPlan', () => {
  const makeItem = (index: number): GridRow => makeRow({ article: `ITEM-${index}`, color: WHITE_COLOR, sales: ['0', String(index % 5)], stock: '3', reels: [] });

  it('gives one Reels to each of the 70 best products when there are enough', () => {
    const rows = readAnalysisRows({ grid: [headerRow, ...Array.from({ length: 100 }, (empty, index) => makeItem(index))], today: TEST_DAY }).rows;
    const plan = buildReelsPlan(rows);
    assert.equal(plan.length, 70);
    assert.equal(plan.reduce((sum, item) => sum + item.count, 0), 70);
    assert.ok(plan.every((item) => item.count === 1));
  });

  it('gives at most 3 Reels to a product and may stay under 70', () => {
    const rows = readAnalysisRows({ grid: [headerRow, ...Array.from({ length: 10 }, (empty, index) => makeItem(index))], today: TEST_DAY }).rows;
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
