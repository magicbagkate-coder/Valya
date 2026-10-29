import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { TableRow } from './tableRow';

import { buildPlan } from './buildPlan';
import { normalizeArticle } from './normalizeArticle';

const rowOf = (row: number, raw: string, oldStock = ''): TableRow => ({ row, raw, key: normalizeArticle(raw), oldStock });
const mapOf = (entries: [string, number][]): Map<string, number> => new Map(entries);

describe('buildPlan sales', () => {
  it('writes sales to a row with a note after the article', () => {
    const table = [rowOf(2, 'M1103-BL COFFEE (2 РИЛСА )')];
    const plan = buildPlan({ table, sales: mapOf([['M1103-BL COFFEE', 10]]), stock: mapOf([]) });
    assert.equal(plan.salesWrites.get(2), 10);
  });

  it('does not match two different articles', () => {
    const table = [rowOf(2, 'M1103-1P COFFEE')];
    const plan = buildPlan({ table, sales: mapOf([['M1103 COFFEE', 5]]), stock: mapOf([]) });
    assert.equal(plan.salesWrites.size, 0);
    assert.equal(plan.salesMissing, 1);
  });

  it('writes sales only to the first row of a duplicate and stock to each row', () => {
    const table = [rowOf(2, 'HYS-16535 BLACK'), rowOf(7, 'HYS-16535 BLACK')];
    const plan = buildPlan({ table, sales: mapOf([['HYS-16535 BLACK', 3]]), stock: mapOf([['HYS-16535 BLACK', 4]]) });
    assert.deepEqual([...plan.salesWrites], [[2, 3]]);
    assert.deepEqual([...plan.stockWrites], [[2, 4], [7, 4]]);
    assert.equal(plan.duplicates.length, 2);
  });

  it('subtracts a return', () => {
    const table = [rowOf(2, 'A100 BLACK')];
    const plan = buildPlan({ table, sales: mapOf([['A100 BLACK', 2]]), stock: mapOf([]) });
    assert.equal(plan.salesTotal, 2);
  });

  it('leaves a markdown row alone when the article has no mark', () => {
    const table = [rowOf(2, 'X1 BLACK_УЦІНКА', '3')];
    const plan = buildPlan({ table, sales: mapOf([['X1 BLACK', 1]]), stock: mapOf([]) });
    assert.equal(plan.salesWrites.size, 0);
    assert.ok(plan.untouched.some((cell) => cell.row === 2 && cell.kind === 'sales'));
  });
});

describe('buildPlan stock', () => {
  it('replaces the old stock', () => {
    const plan = buildPlan({ table: [rowOf(2, '18297 BLACK', '2')], sales: mapOf([]), stock: mapOf([['18297 BLACK', 1]]) });
    assert.equal(plan.stockWrites.get(2), 1);
  });

  it('writes 0 for a sure case and lists it when the old stock was above zero', () => {
    const table = [rowOf(2, 'M1240 BLACK 20% ТЕЛЕГРАМ', '1'), rowOf(3, '18297 BLACK', '2')];
    const plan = buildPlan({ table, sales: mapOf([]), stock: mapOf([['18297 BLACK', 1]]) });
    assert.equal(plan.stockWrites.get(2), 0);
    assert.deepEqual(plan.zeroed.map((one) => [one.row, one.old]), [[2, 1]]);
  });

  it('leaves a row that is not an article', () => {
    const plan = buildPlan({ table: [rowOf(2, 'РИЛС КАЖДЫЙ ДЕНЬ', '5')], sales: mapOf([]), stock: mapOf([['A100 BLACK', 1]]) });
    assert.equal(plan.stockWrites.size, 0);
    assert.equal(plan.untouched[0]?.old, '5');
  });

  it('leaves a markdown row that has no stock line', () => {
    const plan = buildPlan({ table: [rowOf(2, 'B200 BLACK_УЦІНКА', '1')], sales: mapOf([]), stock: mapOf([['A100 BLACK', 1]]) });
    assert.equal(plan.stockWrites.size, 0);
    assert.equal(plan.zeroed.length, 0);
  });

  it('leaves a row with a possible typo in the stock article', () => {
    const plan = buildPlan({ table: [rowOf(2, 'C0944H--F COFFE', '2')], sales: mapOf([]), stock: mapOf([['C0944-F COFFE', 1]]) });
    assert.equal(plan.stockWrites.size, 0);
    assert.match(plan.untouched[0]?.reason ?? '', /похожий/);
  });

  it('does not call a neighbor article a typo if it has its own row', () => {
    const table = [rowOf(2, '18297 BLACK', '1'), rowOf(3, '18298 BLACK', '1')];
    const plan = buildPlan({ table, sales: mapOf([]), stock: mapOf([['18298 BLACK', 4]]) });
    assert.equal(plan.stockWrites.get(3), 4);
    assert.equal(plan.stockWrites.get(2), 0);
  });
});
