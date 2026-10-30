import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildContext } from './buildContext';

describe('buildContext', () => {
  it('shows the file name and the last report', () => {
    const text = buildContext('Facts.', { lastReport: 'Готово, проверь.', fileName: 'продажи.xlsx' });
    assert.match(text, /^Facts\./);
    assert.match(text, /«продажи\.xlsx»/);
    assert.match(text, /LAST REPORT[\s\S]*Готово, проверь\./);
  });

  it('says that there is no file and no report', () => {
    const text = buildContext('Facts.', {});
    assert.match(text, /no data file/);
    assert.match(text, /no report yet/);
  });
});
