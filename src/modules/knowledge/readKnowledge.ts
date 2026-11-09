import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const NOTE_FILE = /\.(md|txt)$/i;
// The notes go into every request, so their size has a limit.
const MAX_CHARS = 60_000;

function readNote(dir: string, name: string): string {
  try {
    return `### ${name}\n${readFileSync(path.join(dir, name), 'utf8').trim()}`;
  } catch {
    return '';
  }
}

/** Reads all notes (.md and .txt files) of a folder into one text, one block for each file. A missing folder gives an empty text. */
export function readKnowledge(dir: string): string {
  try {
    const names = readdirSync(dir)
      .filter((name) => NOTE_FILE.test(name))
      .sort();
    return names
      .map((name) => readNote(dir, name))
      .filter((note) => note !== '')
      .join('\n\n')
      .slice(0, MAX_CHARS);
  } catch {
    return '';
  }
}
