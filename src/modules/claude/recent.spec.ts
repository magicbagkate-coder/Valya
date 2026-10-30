import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ChatTurn } from '@/modules/memory';

import { pickRecent } from './pickRecent';

const turnsOf = (count: number): ChatTurn[] =>
  Array.from({ length: count }, (_item, index) => ({ role: index % 2 === 0 ? 'user' : 'assistant', content: `m${index}` }));

describe('pickRecent', () => {
  it('keeps a short talk as it is', () => {
    assert.equal(pickRecent(turnsOf(6)).length, 6);
  });

  it('keeps the newest 100 messages of a long talk and starts with the user', () => {
    const picked = pickRecent(turnsOf(250));
    assert.ok(picked.length <= 100);
    assert.equal(picked[0]?.role, 'user');
    assert.equal(picked[picked.length - 1]?.content, 'm249');
  });

  it('keeps fewer messages when they are very long', () => {
    const long: ChatTurn[] = [
      { role: 'user', content: 'a'.repeat(40000) },
      { role: 'assistant', content: 'b'.repeat(40000) },
      { role: 'user', content: 'c'.repeat(100) },
    ];
    assert.deepEqual(pickRecent(long).map((turn) => turn.role), ['user']);
  });
});
