import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { toFile } from '@anthropic-ai/sdk';
import { Injectable, Logger } from '@nestjs/common';

import type Anthropic from '@anthropic-ai/sdk';
import type { StoredFile } from '@/modules/memory';
import type { CsvFile } from '@/modules/table';
import type { TableAccess } from './tableAccess';

import { appEnv } from '@/config/appEnv';
import { clockText } from '@/modules/reminder';
import { SheetService } from '@/modules/sheet';
import { buildCsvFiles, describeFiles } from '@/modules/table';
import { createAnthropic } from './anthropicClient';
import { FILES_BETA } from './filesBeta';

// A copy of the table is used for this long. The next question after that reads the real table again.
const TABLE_TTL_MS = 5 * 60_000;

type Snapshot = { takenAt: number; access: TableAccess };

/**
 * Gives Claude a fresh copy of the whole Google table (every sheet, with the color of each row) as files for its code sandbox.
 * The code reads the real table at most every 5 minutes, uploads it to the Anthropic file storage, and deletes the older copy.
 */
@Injectable()
export class TableFilesService {
  private readonly log = new Logger('TableFiles');
  private readonly client = createAnthropic();
  private readonly idsFile = path.join(appEnv.dataDir, 'table-files.json');
  private snapshot?: Snapshot;
  private refreshing?: Promise<TableAccess>;

  constructor(private readonly sheet: SheetService) {}

  // The ids of the files of the last copy are kept on disk, so a restart does not leave old copies in the storage.
  private readIds(): string[] {
    try {
      const saved: unknown = JSON.parse(readFileSync(this.idsFile, 'utf8'));
      return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  private writeIds(ids: string[]): void {
    try {
      mkdirSync(path.dirname(this.idsFile), { recursive: true });
      const tempFile = `${this.idsFile}.tmp`;
      writeFileSync(tempFile, JSON.stringify(ids));
      renameSync(tempFile, this.idsFile);
    } catch (error) {
      this.log.warn(`The list of table files was not saved: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async dropOld(client: Anthropic): Promise<void> {
    for (const id of this.readIds()) {
      try {
        await client.beta.files.delete(id, { betas: [FILES_BETA] });
      } catch (error) {
        this.log.warn(`An old table file was not deleted: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async uploadCsv(job: { client: Anthropic; csv: CsvFile }): Promise<StoredFile> {
    const file = await toFile(Buffer.from(job.csv.text, 'utf8'), job.csv.name, { type: 'text/csv' });
    const uploaded = await job.client.beta.files.upload({ file, betas: [FILES_BETA] });
    return { id: uploaded.id, name: job.csv.name };
  }

  private async readAndUpload(client: Anthropic): Promise<Snapshot> {
    const csvs = buildCsvFiles(await this.sheet.readDumps());
    if (csvs.length === 0) throw new Error('the table has no data');
    const files = await Promise.all(csvs.map((csv) => this.uploadCsv({ client, csv })));
    await this.dropOld(client);
    this.writeIds(files.map((file) => file.id));
    const takenAt = Date.now();
    const note = `GOOGLE TABLE of the team (the whole table, every sheet), read from the real table at ${clockText(takenAt)} Kyiv time. Files in the code sandbox:\n${describeFiles(csvs)}`;
    return { takenAt, access: { files, note } };
  }

  // If the table cannot be read now, the older copy is used when there is one, and the note says so.
  private async refreshTable(client: Anthropic): Promise<TableAccess> {
    try {
      this.snapshot = await this.readAndUpload(client);
      return this.snapshot.access;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.log.error(`The table was not read: ${reason}`);
      const old = this.snapshot;
      if (old) return { files: old.access.files, note: `${old.access.note}\nWARNING: this is an OLDER copy (of ${clockText(old.takenAt)}); the real table could not be read now (${reason}). Say so if the answer depends on fresh data.` };
      return { files: [], note: `The Google table could not be read now (${reason}). Tell the user plainly that the table is not available at the moment and offer to try again; do not guess any numbers of the table.` };
    }
  }

  // The shared read is forgotten when it ends, so the next question can start a new one.
  private async refreshOnce(client: Anthropic): Promise<TableAccess> {
    try {
      return await this.refreshTable(client);
    } finally {
      this.refreshing = undefined;
    }
  }

  /** The files of the Google table, fresh enough for an answer. Two questions at the same time share one read. */
  async freshTable(): Promise<TableAccess> {
    const { client } = this;
    if (!client) return { files: [], note: 'The Google table is not available: there is no AI key.' };
    if (this.snapshot && Date.now() - this.snapshot.takenAt < TABLE_TTL_MS) return this.snapshot.access;
    this.refreshing ??= this.refreshOnce(client);
    return this.refreshing;
  }
}
