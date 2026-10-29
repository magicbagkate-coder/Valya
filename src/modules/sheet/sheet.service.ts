import { Injectable } from '@nestjs/common';

import type { PlanResult, ReportColumns, TableRow } from '@/modules/report';
import type { SheetSnapshot } from './sheetSnapshot';

import { appEnv } from '@/config/appEnv';
import { normalizeArticle } from '@/modules/report';
import { buildCells } from './buildCells';
import { columnLetter } from './columnLetter';
import { sameWeek } from './sameWeek';
import { SHEET_TITLE } from './sheetTitle';
import { createSheetClient } from './sheetClient';


const ARTICLE_COLUMN = 'D';
const FIRST_DATA_ROW = 2;

/** Reads and writes the sheet "отчет" of the Google table. */
@Injectable()
export class SheetService {
  private readonly client = createSheetClient(appEnv.googleKeyPath);

  private requireSheetId(): string {
    if (!appEnv.sheetId) throw new Error('SHEET_ID is not set in .env.');
    return appEnv.sheetId;
  }

  private async findSheetId(spreadsheetId: string): Promise<number> {
    const meta = await this.client.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties(sheetId,title)' });
    const sheet = meta.data.sheets?.find((one) => one.properties?.title === SHEET_TITLE);
    const sheetId = sheet?.properties?.sheetId;
    if (typeof sheetId !== 'number') throw new Error(`The sheet "${SHEET_TITLE}" is not in the table.`);
    return sheetId;
  }

  private async readHeaders(spreadsheetId: string): Promise<string[]> {
    const range = `'${SHEET_TITLE}'!1:1`;
    const response = await this.client.spreadsheets.values.get({ spreadsheetId, range });
    return (response.data.values?.[0] ?? []).map((cell: unknown) => String(cell ?? ''));
  }

  private async readTable(spreadsheetId: string, stockIndex: number): Promise<TableRow[]> {
    const stockLetter = columnLetter(stockIndex);
    const ranges = [`'${SHEET_TITLE}'!${ARTICLE_COLUMN}${FIRST_DATA_ROW}:${ARTICLE_COLUMN}`, `'${SHEET_TITLE}'!${stockLetter}${FIRST_DATA_ROW}:${stockLetter}`];
    const response = await this.client.spreadsheets.values.batchGet({ spreadsheetId, ranges });
    const articles = response.data.valueRanges?.[0]?.values ?? [];
    const stocks = response.data.valueRanges?.[1]?.values ?? [];
    return articles.map((cells: unknown[], index: number) => {
      const raw = String(cells[0] ?? '');
      return { row: index + FIRST_DATA_ROW, raw, key: normalizeArticle(raw), oldStock: String(stocks[index]?.[0] ?? '') };
    });
  }

  /** Reads the header row, the article column, and the old stock column. It changes nothing. */
  async readSnapshot(): Promise<SheetSnapshot> {
    const spreadsheetId = this.requireSheetId();
    const sheetId = await this.findSheetId(spreadsheetId);
    const headers = await this.readHeaders(spreadsheetId);
    const stockIndex = headers.findIndex((header) => normalizeArticle(header).startsWith('ОСТАТОК'));
    if (stockIndex < 1) throw new Error('The header row has no column that starts with "остаток".');
    const table = await this.readTable(spreadsheetId, stockIndex);
    return { sheetId, headers, stockIndex, table };
  }

  private async insertWeekColumn(spreadsheetId: string, snapshot: SheetSnapshot): Promise<void> {
    const range = { sheetId: snapshot.sheetId, dimension: 'COLUMNS', startIndex: snapshot.stockIndex, endIndex: snapshot.stockIndex + 1 };
    // inheritFromBefore copies the look of the week column on the left.
    await this.client.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ insertDimension: { range, inheritFromBefore: true } }] },
    });
  }

  /**
   * Writes the plan. It reuses the week column if its header is the same week. Otherwise it inserts a new column
   * before the stock column with the normal insert operation. Then it writes only the cells of the plan.
   */
  async writePlan(snapshot: SheetSnapshot, plan: PlanResult, labels: { period: string; stockDate: string }): Promise<ReportColumns> {
    const spreadsheetId = this.requireSheetId();
    const left = snapshot.headers[snapshot.stockIndex - 1] ?? '';
    const inserted = !sameWeek(left, labels.period);
    if (inserted) await this.insertWeekColumn(spreadsheetId, snapshot);
    const salesColumn = columnLetter(inserted ? snapshot.stockIndex : snapshot.stockIndex - 1);
    const stockColumn = columnLetter(inserted ? snapshot.stockIndex + 1 : snapshot.stockIndex);
    const stockHeader = `остаток${labels.stockDate}`;
    const salesHeader = inserted ? labels.period : left;
    const cells = buildCells({ plan, salesColumn, stockColumn, newHeaders: { sales: inserted ? labels.period : undefined, stock: stockHeader } });
    // eslint-disable-next-line id-denylist -- The Google Sheets API names this field data.
    await this.client.spreadsheets.values.batchUpdate({ spreadsheetId, requestBody: { valueInputOption: 'RAW', data: cells } });
    return { salesHeader, salesColumn, stockHeader, stockColumn, inserted };
  }
}
