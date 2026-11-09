import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { readKnowledge } from './readKnowledge';

describe('readKnowledge', () => {
  it('reads the notes in the order of their names and skips other files', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'knowledge-'));
    writeFileSync(path.join(dir, 'b-second.txt'), 'Второй текст\n');
    writeFileSync(path.join(dir, 'a-first.md'), 'Первый текст');
    writeFileSync(path.join(dir, 'photo.jpg'), 'not a note');
    mkdirSync(path.join(dir, 'folder.md'));
    assert.equal(readKnowledge(dir), '### a-first.md\nПервый текст\n\n### b-second.txt\nВторой текст');
  });

  it('gives an empty text for a missing folder', () => {
    assert.equal(readKnowledge(path.join(tmpdir(), 'no-such-knowledge-folder')), '');
  });
});
