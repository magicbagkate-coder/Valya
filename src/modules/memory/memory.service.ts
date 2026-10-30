import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';


import type { ChatMemory } from './chatMemory';
import type { ChatTurn } from './chatTurn';
import type { StoredFile } from './storedFile';

import { appEnv } from '@/config/appEnv';
import { parseMemory } from './parseMemory';

const MAX_TURNS = 2000;

/** Keeps the talk and the last report of each chat on disk, so a restart or an update does not erase them. */
@Injectable()
export class MemoryService {
  private readonly log = new Logger('Memory');
  private readonly file = path.join(appEnv.dataDir, 'memory.json');
  private readonly chats = this.readFile();

  private readFile(): Map<number, ChatMemory> {
    try {
      return parseMemory(JSON.parse(readFileSync(this.file, 'utf8')));
    } catch (error) {
      const missing = error instanceof Error && 'code' in error && error.code === 'ENOENT';
      if (!missing) this.log.warn(`Memory file is not readable, starting empty: ${error instanceof Error ? error.message : String(error)}`);
      return new Map();
    }
  }

  private writeFile(): void {
    try {
      mkdirSync(path.dirname(this.file), { recursive: true });
      const tempFile = `${this.file}.tmp`;
      writeFileSync(tempFile, JSON.stringify(Object.fromEntries(this.chats)));
      renameSync(tempFile, this.file);
    } catch (error) {
      this.log.error(`Memory file was not saved: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /** Returns the whole saved talk of a chat. */
  loadTurns(chatId: number): ChatTurn[] {
    return this.chats.get(chatId)?.turns ?? [];
  }

  /** Adds messages to the talk of a chat and saves them. The oldest messages leave after 2000. */
  addTurns(chatId: number, turns: ChatTurn[]): void {
    const old = this.chats.get(chatId);
    this.chats.set(chatId, { ...old, turns: [...(old?.turns ?? []), ...turns].slice(-MAX_TURNS) });
    this.writeFile();
  }

  /** Erases the talk of a chat. The last report stays. */
  clearTurns(chatId: number): void {
    this.chats.set(chatId, { ...this.chats.get(chatId), turns: [] });
    this.writeFile();
  }

  /** Returns the last report that the bot sent to a chat. */
  loadReport(chatId: number): string | undefined {
    return this.chats.get(chatId)?.lastReport;
  }

  /** Returns the last data file that the chat sent for analysis. */
  loadFile(chatId: number): StoredFile | undefined {
    return this.chats.get(chatId)?.file;
  }

  /** Saves the last data file of a chat. An empty value forgets the file. */
  saveFile(chatId: number, file: StoredFile | undefined): void {
    this.chats.set(chatId, { turns: [], ...this.chats.get(chatId), file });
    this.writeFile();
  }

  /** Saves the last report of a chat. */
  saveReport(chatId: number, report: string): void {
    this.chats.set(chatId, { turns: [], ...this.chats.get(chatId), lastReport: report });
    this.writeFile();
  }
}
