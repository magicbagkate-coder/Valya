import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildCells } from './buildCells';
import { columnLetter } from './columnLetter';
import { samePeriod } from './samePeriod';

describe('sheet helpers', () => {
  it('turns an index into column letters', () => {
    assert.deepEqual([0, 3, 25, 26, 46].map(columnLetter), ['A', 'D', 'Z', 'AA', 'AU']);
  });

  it('reuses a column only when the period text is equal', () => {
    assert.equal(samePeriod('21-27,10', '21-27.10'), true);
    assert.equal(samePeriod('21-27,10', '21-26,10'), false);
    assert.equal(samePeriod('01-07,10', '01-31,10'), false);
    assert.equal(samePeriod('Приход', '21,10'), false);
  });

  it('lists only the cells of the plan', () => {
    const plan = {
      salesWrites: new Map([[5, 10]]),
      stockWrites: new Map([[5, 1], [6, 0]]),
      untouched: [],
      zeroed: [],
      duplicates: [],
      salesMissing: 0,
      stockMissing: 0,
      salesTotal: 10,
      stockTotal: 1,
    };
    const cells = buildCells({ plan, salesColumn: 'H', stockColumn: 'I', newHeaders: { sales: '21-26,10', stock: 'остаток27,10' } });
    assert.deepEqual(
      cells.map((cell) => cell.range),
      ["'отчет'!H1", "'отчет'!I1", "'отчет'!H5", "'отчет'!I5", "'отчет'!I6"],
    );
  });
});
