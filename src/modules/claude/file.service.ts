import { toFile } from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';

import { MemoryService } from '@/modules/memory';
import { createAnthropic } from './anthropicClient';
import { FILES_BETA } from './filesBeta';

/** Keeps the last data file of each chat in the Anthropic file storage, so Claude can analyze it in the code sandbox. */
@Injectable()
export class FileService {
  private readonly log = new Logger('Files');
  private readonly client = createAnthropic();

  constructor(private readonly memory: MemoryService) {}

  /** Uploads a data file and makes it the file of the chat. The old file is deleted. Returns false if it fails. */
  async storeFile(chatId: number, name: string, buffer: Buffer): Promise<boolean> {
    if (!this.client) return false;
    try {
      const uploaded = await this.client.beta.files.upload({ file: await toFile(buffer, name), betas: [FILES_BETA] });
      await this.dropFile(chatId);
      this.memory.saveFile(chatId, { id: uploaded.id, name });
      return true;
    } catch (error) {
      this.log.error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /** Deletes the data file of a chat from the storage and from the memory. */
  async dropFile(chatId: number): Promise<void> {
    const old = this.memory.loadFile(chatId);
    if (!old || !this.client) return;
    try {
      await this.client.beta.files.delete(old.id, { betas: [FILES_BETA] });
    } catch (error) {
      this.log.warn(`Old file was not deleted: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.memory.saveFile(chatId, undefined);
  }
}
