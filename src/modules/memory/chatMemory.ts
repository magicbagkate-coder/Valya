import type { ChatTurn } from './chatTurn';
import type { StoredFile } from './storedFile';

/** Everything that the bot keeps for one chat: the talk, the last report, and the last data file. */
export type ChatMemory = { turns: ChatTurn[]; lastReport?: string; file?: StoredFile };
