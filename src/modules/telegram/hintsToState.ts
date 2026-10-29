import type { Hints } from '@/modules/report';
import type { ChatState } from './chatState';

/** Keeps only the labels that the user really gave. An empty label must not erase an old one. */
export function hintsToState(hints: Hints): ChatState {
  return { ...(hints.period ? { period: hints.period } : {}), ...(hints.stockDate ? { stockDate: hints.stockDate } : {}) };
}
