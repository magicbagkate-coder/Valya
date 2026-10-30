import type { Hints } from './parseHints';

import { cleanLabels } from './cleanLabels';

/** Reads the JSON that Claude returns in a text. It keeps a label only if it has the style of the sheet. */
export function parseHintsJson(text: string): Hints {
  const found = /\{[\s\S]*\}/.exec(text);
  if (!found) return {};
  try {
    return cleanLabels(JSON.parse(found[0]));
  } catch {
    return {};
  }
}
