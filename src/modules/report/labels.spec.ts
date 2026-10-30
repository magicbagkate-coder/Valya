import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cleanLabels } from './cleanLabels';

describe('cleanLabels', () => {
  it('keeps labels in the style of the sheet', () => {
    assert.deepEqual(cleanLabels({ period: '21-26,10', stockDate: '29,10' }), { period: '21-26,10', stockDate: '29,10' });
  });

  it('drops a wrong label, a wrong type, and a value that is not an object', () => {
    assert.deepEqual(cleanLabels({ period: 'вчера', stockDate: 5 }), { period: undefined, stockDate: undefined });
    assert.deepEqual(cleanLabels(null), {});
    assert.deepEqual(cleanLabels('text'), {});
  });
});
