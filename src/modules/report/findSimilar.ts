import { baseKey } from './baseKey';
import { editDistance } from './editDistance';
import { isMarkdown } from './isMarkdown';

const MIN_LENGTH = 6;
const MAX_EDITS = 2;

// The table text can have a note after the article. Compare the start of the text, with a few different lengths,
// because a typo can add or remove characters.
function closeToStart(key: string, other: string): boolean {
  for (let shift = -MAX_EDITS; shift <= MAX_EDITS; shift += 1) {
    if (editDistance(key.slice(0, other.length + shift), other) <= MAX_EDITS) return true;
  }
  return false;
}

/**
 * Finds an article of the stock file that can be the same item as the table text.
 * The cause is a typo, a missing separator, or a markdown mark on one side only.
 */
export function findSimilar(key: string, candidates: string[]): string | undefined {
  return candidates.find((other) => {
    if (baseKey(key) === baseKey(other) && isMarkdown(key) !== isMarkdown(other)) return true;
    return other.length >= MIN_LENGTH && closeToStart(key, other);
  });
}
