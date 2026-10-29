import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { detectKind } from './detectKind';
import { parseHints } from './parseHints';
import { previewRows } from './previewRows';

describe('parseHints full ranges', () => {
  it('reads two full dates with the same month', () => {
    assert.deepEqual(parseHints('23,10-29,10'), { period: '23-29,10', stockDate: undefined });
    assert.deepEqual(parseHints('с 23.10 по 29.10'), { period: '23-29,10', stockDate: undefined });
  });

  it('reads two full dates over two months', () => {
    assert.equal(parseHints('продажи 28.09-04.10').period, '28,09-04,10');
  });

  it('reads a start date with an end day', () => {
    assert.equal(parseHints('продажи с 23,10 по 29').period, '23-29,10');
  });

  it('reads the days range and keeps the stock date apart', () => {
    assert.deepEqual(parseHints('продажи 27-29,10, остатки на 29,10'), { period: '27-29,10', stockDate: '29,10' });
    assert.deepEqual(parseHints('23,10-29,10 остатки 29,10'), { period: '23-29,10', stockDate: '29,10' });
  });
});

describe('detectKind', () => {
  const salesRow = ['ALEX MIA бочонок CD9689 WINE, CD9689 WINE', 1];

  it('finds a sales file with a header row above', () => {
    assert.equal(detectKind([['Номенклатура', 'Количество'], salesRow]), 'sales');
  });

  it('finds a sales file after empty rows', () => {
    assert.equal(detectKind([[], [], salesRow]), 'sales');
  });

  it('does not take an orders file for sales', () => {
    assert.equal(detectKind([['Повне Імя', 'Телефон'], ['Іванова Олена', '+380000000000']]), 'unknown');
  });
});

describe('previewRows', () => {
  it('shows the first non-empty rows', () => {
    assert.equal(previewRows([[], ['a', 'b'], ['c']]), '1) a | b\n2) c');
  });
});
