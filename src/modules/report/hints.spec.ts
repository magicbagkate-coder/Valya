import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseHints } from './parseHints';
import { parseHintsJson } from './parseHintsJson';

describe('parseHints periods', () => {
  it('reads a week with spaces', () => {
    assert.deepEqual(parseHints('продажи 21 - 26.10, остатки 27,10'), { period: '21-26,10', stockDate: '27,10' });
  });

  it('reads a single day with the word продажи', () => {
    assert.deepEqual(parseHints('продажи за 5.10, остатки на 6.10'), { period: '05,10', stockDate: '06,10' });
  });

  it('does not take the sales day for the stock date', () => {
    assert.deepEqual(parseHints('продажи 21.10'), { period: '21,10', stockDate: undefined });
  });

  it('leaves words such as a month to Claude', () => {
    assert.deepEqual(parseHints('продажи за октябрь, остатки 31.10'), { period: undefined, stockDate: '31,10' });
  });
});

describe('parseHintsJson', () => {
  it('keeps labels in the style of the sheet', () => {
    const text = 'Here: {"period": "01-31,10", "stockDate": "31,10"}';
    assert.deepEqual(parseHintsJson(text), { period: '01-31,10', stockDate: '31,10' });
  });

  it('accepts a range over two months and a day', () => {
    assert.equal(parseHintsJson('{"period": "28,09-04,10", "stockDate": null}').period, '28,09-04,10');
    assert.equal(parseHintsJson('{"period": "21,10"}').period, '21,10');
  });

  it('drops a wrong label and a text without JSON', () => {
    assert.deepEqual(parseHintsJson('{"period": "октябрь", "stockDate": "31.10.2026"}'), { period: undefined, stockDate: undefined });
    assert.deepEqual(parseHintsJson('нет'), {});
  });
});
