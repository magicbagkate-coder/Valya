import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseMemory } from './parseMemory';

describe('parseMemory', () => {
  it('reads a saved file', () => {
    const saved = { '342356105': { turns: [{ role: 'user', content: 'привет' }, { role: 'assistant', content: 'Привет!' }], lastReport: 'Готово' } };
    const memory = parseMemory(saved);
    assert.equal(memory.get(342356105)?.turns.length, 2);
    assert.equal(memory.get(342356105)?.lastReport, 'Готово');
  });

  it('drops broken parts and does not crash', () => {
    const broken = { abc: { turns: [] }, '5': { turns: [{ role: 'robot', content: 'x' }, { role: 'user' }, 7, { role: 'user', content: 'ok' }], lastReport: 3 } };
    const memory = parseMemory(broken);
    assert.deepEqual([...memory.keys()], [5]);
    assert.deepEqual(memory.get(5), { turns: [{ role: 'user', content: 'ok' }], lastReport: undefined, file: undefined });
  });

  it('reads the saved data file and drops a wrong one', () => {
    const memory = parseMemory({ '1': { turns: [], file: { id: 'file_1', name: 'продажи.xlsx' } }, '2': { turns: [], file: { id: 5 } } });
    assert.deepEqual(memory.get(1)?.file, { id: 'file_1', name: 'продажи.xlsx' });
    assert.equal(memory.get(2)?.file, undefined);
  });

  it('gives an empty memory for a value that is not an object', () => {
    assert.equal(parseMemory(null).size, 0);
    assert.equal(parseMemory('text').size, 0);
  });
});
