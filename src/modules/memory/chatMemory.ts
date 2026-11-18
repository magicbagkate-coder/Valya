import type { ChatTurn } from './chatTurn';
import type { StoredFile } from './storedFile';

/**
 * Everything that the bot keeps for one chat: the talk, the last report, and the last data file.
 * analysis: the last analysis of the table. analysisDate: the day when the weekly analysis was sent to this chat ("2026-11-18").
 */
export type ChatMemory = { turns: ChatTurn[]; lastReport?: string; file?: StoredFile; analysis?: string; analysisDate?: string };
