import type { ChatTurn } from '@/modules/memory';

const MAX_TURNS = 100;
const MAX_CHARS = 60000;

/**
 * Picks the newest messages of a talk that fit the limit, for each request to Claude.
 * The whole talk stays on disk. The limit keeps the answers fast and the cost low.
 */
export function pickRecent(turns: ChatTurn[]): ChatTurn[] {
  const picked: ChatTurn[] = [];
  let size = 0;
  for (const turn of turns.slice(-MAX_TURNS).reverse()) {
    size += turn.content.length;
    if (size > MAX_CHARS) break;
    picked.unshift(turn);
  }
  // The first message must be from the user.
  return picked[0]?.role === 'assistant' ? picked.slice(1) : picked;
}
