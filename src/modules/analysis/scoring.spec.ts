import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AnalysisRow } from './analysisRow';

import { colorWords, splitArticle } from './modelKey';
import { scoreRow } from './scoreRow';
import { trendMark, trendValue, weeksText } from './trend';

const TEST_ARTICLES = [
  'M1266-BL COFFEE',
  'M1266-BL BLACK',
  'M1266-BL D.WINE',
  'A COFFEE',
  'B COFFEE',
  'C BLACK',
  'D BLACK',
  'E D.WINE',
  'F D.WINE',
  '9019B-1 D.WINE RED',
  'G RED',
  'H RED',
  'I RED',
  'M1323 F D GREY',
  'J GREY',
  'K GREY',
  'L GREY',
  'LTN 66-39 COFFEE',
];

describe('trend', () => {
  it('tells the trend of the last two weeks', () => {
    assert.equal(trendMark([2, 4]), '↑ +100%');
    assert.equal(trendMark([4, 2]), '↓ -50%');
    assert.equal(trendMark([3, 3]), '→');
    assert.equal(trendMark([0, 2]), '↑ новые продажи');
    assert.equal(trendMark([5]), '');
    assert.equal(weeksText([-1, 3]), '0 → 3 ↑ новые продажи');
  });

  it('gives a number from 0 to 1 and 0.5 when there is no clear trend', () => {
    assert.equal(trendValue([1, 2]), 1);
    assert.equal(trendValue([4, 2]), 0.25);
    assert.equal(trendValue([0, 1]), 0.5);
    assert.equal(trendValue([7]), 0.5);
  });
});

describe('model and color of an article', () => {
  const colors = colorWords(TEST_ARTICLES);

  it('finds the color words by how often they end an article', () => {
    assert.deepEqual([...colors].sort(), ['BLACK', 'COFFEE', 'D.WINE', 'GREY', 'RED']);
  });

  it('splits the model from the color, also for two-word colors and for a lone D', () => {
    assert.deepEqual(splitArticle({ article: 'M1266-BL D.WINE', colors }), { model: 'M1266-BL', color: 'D.WINE' });
    assert.deepEqual(splitArticle({ article: '9019B-1 D.WINE RED', colors }), { model: '9019B-1', color: 'D.WINE RED' });
    assert.deepEqual(splitArticle({ article: 'M1323 F D GREY', colors }), { model: 'M1323 F', color: 'D GREY' });
    assert.deepEqual(splitArticle({ article: 'LTN 66-39 COFFEE', colors }), { model: 'LTN 66-39', color: 'COFFEE' });
  });

  it('knows a marked down color, and keeps an article without a color as its own model', () => {
    assert.deepEqual(splitArticle({ article: 'Z9 COFFEE_УЦІНКА', colors }), { model: 'Z9', color: 'COFFEE_УЦІНКА' });
    assert.deepEqual(splitArticle({ article: 'LONELY', colors }), { model: 'LONELY', color: '' });
  });
});

describe('scoreRow', () => {
  const base: AnalysisRow = {
    line: 2,
    article: 'A',
    model: 'A',
    color: '',
    group: 'main',
    planned: false,
    weeks: [0, 0],
    sold: 0,
    returns: 0,
    stock: 0,
    daysLeft: undefined,
    reels: 0,
    periodReels: 0,
    shotReels: 0,
    lastReel: '',
    daysSinceReel: undefined,
  };

  it('gives the best score to a product that sells, has stock, and has no content', () => {
    const best = scoreRow({ row: { ...base, weeks: [4, 8], sold: 12, stock: 10 }, salesDays: 14 });
    assert.equal(best, 100);
  });

  it('gives less to a product with a small stock, much fresh content, or no sales', () => {
    const strong = { ...base, weeks: [4, 8], sold: 12, stock: 10 };
    const small = scoreRow({ row: { ...strong, stock: 1 }, salesDays: 14 });
    const covered = scoreRow({ row: { ...strong, reels: 10, daysSinceReel: 1 }, salesDays: 14 });
    const idle = scoreRow({ row: { ...strong, weeks: [0, 0], sold: 0 }, salesDays: 14 });
    assert.ok(small < 100 && covered < 100 && idle < 100);
    assert.ok(idle < covered && covered < 100);
  });

  it('does not give more points for a stock above the full level', () => {
    const six = scoreRow({ row: { ...base, weeks: [4, 8], sold: 12, stock: 6 }, salesDays: 14 });
    const forty = scoreRow({ row: { ...base, weeks: [4, 8], sold: 12, stock: 40 }, salesDays: 14 });
    assert.equal(six, forty);
  });
});
