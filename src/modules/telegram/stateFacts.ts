import type { ChatState } from './chatState';

import { describeState } from './describeState';

/** Tells in short lines what the chat already gave for the table and what is still missing. */
export function stateFacts(state: ChatState): string {
  const { have, missing } = describeState(state);
  const lines = [
    `Already received for the table: ${have.join('; ') || 'nothing'}.`,
    `Still missing for the table: ${missing.join('; ') || 'nothing, the code can run now'}.`,
    state.period ? `Sales period: ${state.period}.` : '',
    state.stockDate ? `Stock date: ${state.stockDate}.` : '',
  ];
  return lines.filter((line) => line !== '').join('\n');
}
