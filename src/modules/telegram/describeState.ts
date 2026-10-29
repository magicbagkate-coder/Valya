import type { ChatState } from './chatState';

/** Lists what the chat has and what is missing, in Russian. */
export function describeState(state: ChatState): { have: string[]; missing: string[] } {
  const checks: [string, boolean][] = [
    ['файл продаж', state.sales !== undefined],
    ['файл остатков', state.stock !== undefined],
    ['период продаж (например 21-26.10)', state.period !== undefined],
    ['дата остатков (например 27,10)', state.stockDate !== undefined],
  ];
  return {
    have: checks.filter(([, present]) => present).map(([name]) => name),
    missing: checks.filter(([, present]) => !present).map(([name]) => name),
  };
}
