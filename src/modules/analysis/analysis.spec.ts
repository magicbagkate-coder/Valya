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
    assert.deepEqual(table.rows[0], {
      line: 2,
      article: 'A1',
      model: 'A1',
      color: '',
      group: 'main',
      planned: false,
      weeks: [1, 2],
      sold: 3,
      returns: 0,
      stock: 7,
      daysLeft: 32.7,
      reels: 2,
      periodReels: 2,
      shotReels: 0,
      lastReel: '23.10 сборн',
      daysSinceReel: 26,
    });
    assert.deepEqual(table.weekLabels, ['04-10.11', '11.11-17.11']);
    assert.equal(table.salesDays, 14);
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

  it('finds discount candidates only in the main assortment, and sends a product with an old last Reels to a content refresh', () => {
    assert.deepEqual(result.discount.refresh.map((row) => row.article), ['MAIN-DISCOUNT']);
    assert.deepEqual([result.discount.price.length, result.discount.wait.length], [0, 0]);
  });

  it('keeps promo products and products without stock out of the content plan, and keeps a content refresh in it', () => {
    const names = result.plan.map((item) => item.article).sort();
    assert.deepEqual(names, ['MAIN-DISCOUNT', 'MAIN-FEW-REELS', 'MAIN-SELLS']);
  });

  it('writes a report with the sections and the rules', () => {
    const text = formatAnalysis(result);
    assert.match(text, /Период: последние 2 недели \(04-10\.11 и 11\.11-17\.11\)/);
    assert.match(text, /АКЦИОННЫЕ ТОВАРЫ \(жёлтые и красные строки\): 2 позиций/);
    assert.match(text, /ОСНОВНОЙ АССОРТИМЕНТ/);
    assert.match(text, /КАНДИДАТЫ НА НОВУЮ СКИДКУ/);
    assert.match(text, /• MAIN-DISCOUNT \(стр\. 5\)/);
    assert.match(text, /НОВЫЙ КОНТЕНТ-ПЛАН: 9 Reels на неделю/);
    assert.match(text, /Б\. Сначала обновить контент/);
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
    const groups = result.discount;
    assert.deepEqual([groups.price.length + groups.refresh.length + groups.wait.length, result.plan.length, result.lowStock.length], [0, 0, 0]);
    const text = formatAnalysis(result);
    assert.match(text, /Период короче 7 дней/);
    assert.match(text, /Reels за период: 1 \(на 1 позициях\)/);
    assert.doesNotMatch(text, /НОВЫЙ КОНТЕНТ-ПЛАН: \d+ Reels/);
  });
});

describe('the plan that the colors mark', () => {
  const grid = [
    headerRow,
    makeRow({ article: 'PLANNED-SHOT', color: PURPLE_COLOR, sales: ['0', '1'], stock: '4', reels: ['01.10', '16.11'] }),
    makeRow({ article: 'PLANNED-OLD', color: PURPLE_COLOR, sales: ['0', '0'], stock: '9', reels: ['01.10'] }),
    makeRow({ article: 'PLANNED-GREEN', color: { red: 0, green: 1, blue: 0 }, sales: ['0', '0'], stock: '2', reels: [] }),
    makeRow({ article: 'WHITE-SHOT', color: WHITE_COLOR, sales: ['2', '2'], stock: '5', reels: ['17.11'] }),
    makeRow({ article: 'YELLOW-SHOT', color: YELLOW_COLOR, sales: ['2', '2'], stock: '5', reels: ['17.11'] }),
  ];

  it('counts only colored rows of the main assortment as planned, and the Reels of the last 7 days as shot', () => {
    const result = analyzeRows(readAnalysisRows({ grid, today: TEST_DAY }));
    assert.deepEqual([result.colorPlan.planned, result.colorPlan.shot, result.colorPlan.shotReels], [3, 1, 1]);
    assert.deepEqual(result.colorPlan.unshot.map((row) => row.article), ['PLANNED-OLD', 'PLANNED-GREEN']);
    assert.equal(result.colorPlan.shotText, 'с 12.11 по 18.11 (7 дн.)');
  });

  it('uses the time frame of the user as the shooting period', () => {
    const window = { from: TEST_DAY - 50, to: TEST_DAY };
    const result = analyzeRows(readAnalysisRows({ grid, today: TEST_DAY, window }));
    assert.deepEqual([result.colorPlan.planned, result.colorPlan.shot, result.colorPlan.shotReels], [3, 2, 3]);
    assert.match(result.colorPlan.shotText, /^с 29\.09 по 18\.11/);
  });

  it('writes the block with the numbers and the rule', () => {
    const text = formatAnalysis(analyzeRows(readAnalysisRows({ grid, today: TEST_DAY })));
    assert.match(text, /ЗАПЛАНИРОВАНО В КОНТЕНТ \(цветные строки основного ассортимента, без жёлтых и красных\): 3 позиций/);
    assert.match(text, /Снято \(есть Reels с датой в этом периоде\): 1 позиций, всего Reels 1\./);
    assert.match(text, /Осталось не снято: 2 позиций\./);
    assert.match(text, /• PLANNED-OLD \(стр\. 3\): остаток 9/);
    assert.doesNotMatch(text, /Плана Reels в таблице нет/);
  });

  it('says so when there are no colored rows', () => {
    const plain = [headerRow, makeRow({ article: 'W1', color: WHITE_COLOR, sales: ['1', '1'], stock: '3', reels: [] })];
    const text = formatAnalysis(analyzeRows(readAnalysisRows({ grid: plain, today: TEST_DAY })));
    assert.match(text, /цветных строк нет, плана по цветам в таблице не вижу/);
  });
});

describe('buildReelsPlan', () => {
  const makeItem = (index: number): GridRow => makeRow({ article: `ITEM-${index}`, color: WHITE_COLOR, sales: ['0', String(index % 5)], stock: '3', reels: [] });

  it('gives one Reels to each of the 70 best products when there are enough', () => {
    const rows = readAnalysisRows({ grid: [headerRow, ...Array.from({ length: 100 }, (empty, index) => makeItem(index))], today: TEST_DAY }).rows;
    const plan = buildReelsPlan({ rows, salesDays: 14 });
    assert.equal(plan.length, 70);
    assert.equal(plan.reduce((sum, item) => sum + item.count, 0), 70);
    assert.ok(plan.every((item) => item.count === 1));
  });

  it('gives at most 3 Reels to a product and may stay under 70', () => {
    const rows = readAnalysisRows({ grid: [headerRow, ...Array.from({ length: 10 }, (empty, index) => makeItem(index))], today: TEST_DAY }).rows;
    const plan = buildReelsPlan({ rows, salesDays: 14 });
    assert.equal(plan.reduce((sum, item) => sum + item.count, 0), 30);
    assert.ok(plan.every((item) => item.count === 3));
  });
});

describe('weeks, trend, days of stock, and returns', () => {
  const grid = [
    headerRow,
    makeRow({ article: 'RUN-OUT', color: WHITE_COLOR, sales: ['4', '4'], stock: '2', reels: ['16.11'] }),
    makeRow({ article: 'GROWING', color: WHITE_COLOR, sales: ['2', '6'], stock: '40', reels: ['16.11'] }),
    makeRow({ article: 'RETURNED', color: WHITE_COLOR, sales: ['-1', '3'], stock: '9', reels: ['16.11'] }),
    makeRow({ article: 'GONE', color: YELLOW_COLOR, sales: ['3', '3'], stock: '0', reels: [] }),
  ];
  const result = analyzeRows(readAnalysisRows({ grid, today: TEST_DAY }));

  it('shows the sales of each week and the trend, and the days that the stock lasts', () => {
    const text = formatAnalysis(result);
    assert.match(text, /• GROWING \(стр\. 3\): продано 8 \(2 → 6 ↑ \+200%\), остаток 40/);
    assert.match(text, /• RUN-OUT \(стр\. 2\): продано 8 \(4 → 4 →\), остаток 2, хватит на ~3\.5 дн\./);
  });

  it('lists the popular products that run out, and the promo products that are gone, with a caution', () => {
    assert.deepEqual(result.main.runningOut.map((row) => row.article), ['RUN-OUT']);
    assert.deepEqual(result.promo.runningOut.map((row) => row.article), ['GONE']);
    const text = formatAnalysis(result);
    assert.match(text, /ХОДОВЫЕ ТОВАРЫ, КОТОРЫХ СКОРО НЕ ХВАТИТ/);
    assert.match(text, /• GONE \(стр\. 5\): продано 6 \(3 → 3 →\), остаток 0 \(товара нет\)/);
    assert.match(text, /повторную закупку по скидочной цене автоматически не советую/);
  });

  it('does not count a return as a sale and lists it apart', () => {
    const row = result.returns[0];
    assert.deepEqual([result.returns.length, row?.article, row?.returns, row?.sold], [1, 'RETURNED', 1, 3]);
    assert.match(formatAnalysis(result), /ВОЗВРАТЫ И КОРРЕКТИРОВКИ \(отрицательные продажи, в продажи не считаю\): 1 позиций, всего 1 шт/);
  });
});

describe('discount groups and the low stock rule', () => {
  const later = (sales: [string, string], stock: string, reels: string[]): Omit<RowJob, 'article' | 'color'> => ({ sales, stock, reels });
  const grid = [
    headerRow,
    makeRow({ article: 'PRICE-ITEM', color: WHITE_COLOR, ...later(['0', '1'], '8', ['01.10', '02.10', '05.11']) }),
    makeRow({ article: 'WAIT-ITEM', color: WHITE_COLOR, ...later(['0', '1'], '8', ['01.10', '02.10', '16.11']) }),
    makeRow({ article: 'REFRESH-ITEM', color: WHITE_COLOR, ...later(['0', '1'], '8', ['01.09', '02.09', '03.09']) }),
    makeRow({ article: 'M1 BLACK', color: WHITE_COLOR, ...later(['2', '3'], '2', []) }),
    makeRow({ article: 'M2 BLACK', color: WHITE_COLOR, ...later(['0', '0'], '4', []) }),
    makeRow({ article: 'X1 BLACK', color: WHITE_COLOR, ...later(['2', '2'], '2', []) }),
    makeRow({ article: 'X1 WINE', color: WHITE_COLOR, ...later(['0', '0'], '10', []) }),
    makeRow({ article: 'X2 WINE', color: WHITE_COLOR, ...later(['0', '0'], '1', []) }),
    makeRow({ article: 'X3 WINE', color: WHITE_COLOR, ...later(['0', '0'], '1', []) }),
  ];
  const result = analyzeRows(readAnalysisRows({ grid, today: TEST_DAY }));

  it('splits the candidates by the age of the last Reels', () => {
    assert.deepEqual(result.discount.price.map((row) => row.article), ['PRICE-ITEM']);
    assert.deepEqual(result.discount.wait.map((row) => row.article), ['WAIT-ITEM']);
    assert.deepEqual(result.discount.refresh.map((row) => row.article), ['REFRESH-ITEM']);
  });

  it('keeps a price check and a wait out of the plan, and a content refresh in it', () => {
    const names = result.plan.map((item) => item.article);
    assert.ok(!names.includes('PRICE-ITEM') && !names.includes('WAIT-ITEM'));
    assert.ok(names.includes('REFRESH-ITEM'));
  });

  it('keeps a stock of 1–2 out of the plan unless another color of the model has enough stock', () => {
    const names = result.plan.map((item) => item.article);
    assert.ok(!names.includes('M1 BLACK'));
    assert.ok(names.includes('X1 BLACK'));
    assert.deepEqual(result.lowStock.map((row) => row.article), ['M1 BLACK']);
    assert.match(formatAnalysis(result), /ИСКЛЮЧЕНЫ ИЗ ОТДЕЛЬНЫХ REELS \(остаток 1–2 шт, а в других цветах модели меньше 6 шт\): 1\n• M1 BLACK/);
  });

  it('gathers the colors of a model with their sales and stock', () => {
    const model = result.models.find((summary) => summary.model === 'X1');
    assert.deepEqual(model, { model: 'X1', sold: 4, stock: 12, reels: 0, parts: [{ color: 'BLACK', sold: 4, stock: 2 }, { color: 'WINE', sold: 0, stock: 10 }] });
  });

  it('gives each planned product a score, orders the plan by it, and warns about a stock of 3', () => {
    const scores = result.plan.map((one) => one.score);
    assert.ok(scores.every((score) => score >= 0 && score <= 100));
    assert.deepEqual([...scores].sort((first, second) => second - first), scores);
    const three = analyzeRows(readAnalysisRows({ grid: [headerRow, makeRow({ article: 'STOCK-THREE', color: WHITE_COLOR, ...later(['2', '2'], '3', []) })], today: TEST_DAY }));
    assert.equal(three.plan[0]?.note, 'остаток всего 3, проверьте запас перед съёмкой');
    assert.equal(result.plan.find((one) => one.article === 'M2 BLACK')?.note, '');
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
