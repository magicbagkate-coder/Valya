import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contextReport, displayReport } from './fullReport';

describe('displayReport', () => {
  it('puts the conclusions after the report', () => {
    assert.equal(displayReport({ report: 'ЦИФРЫ', advice: 'ВЫВОДЫ' }), 'ЦИФРЫ\n\nВЫВОДЫ');
  });

  it('says that the conclusions failed and keeps the report', () => {
    const text = displayReport({ report: 'ЦИФРЫ', advice: '' });
    assert.ok(text.startsWith('ЦИФРЫ\n\n'));
    assert.match(text, /Выводы от ИИ сейчас не получились/);
  });
});

describe('contextReport', () => {
  it('puts the conclusions first, so that a cut does not lose them', () => {
    assert.equal(contextReport({ report: 'ЦИФРЫ', advice: 'ВЫВОДЫ' }), 'ВЫВОДЫ\n\nЦИФРЫ');
  });

  it('keeps only the report when there are no conclusions', () => {
    assert.equal(contextReport({ report: 'ЦИФРЫ', advice: '' }), 'ЦИФРЫ');
  });
});
