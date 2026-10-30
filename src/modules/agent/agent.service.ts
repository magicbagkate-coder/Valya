import { Injectable } from '@nestjs/common';

import { MemoryService } from '@/modules/memory';
import { buildPlan, formatReport, loadRows, readSales, readStock } from '@/modules/report';
import { SheetService } from '@/modules/sheet';

/** The two 1C files and the labels that the user gave. */
export type RunInput = { chatId: number; sales: Buffer; stock: Buffer; period: string; stockDate: string };

const BUSY_TEXT = 'Сейчас идёт другая запись в таблицу. Пришли файлы ещё раз через минуту.';
const EMPTY_TEXT = 'Не нашёл строк с артикулами в файле {name}. Проверь, что это нужный файл. Ничего не записал.';
const WRONG_TEXT = 'Ни один артикул из файлов не нашёлся в таблице. Возможно, загружен не тот файл. Ничего не записал.';

/** Runs the whole job: read the files, read the sheet, build the plan, write it, and return the report text. */
@Injectable()
export class AgentService {
  private busy = false;

  constructor(
    private readonly sheet: SheetService,
    private readonly memory: MemoryService,
  ) {}

  /** Writes the sales and the stock to the sheet. One run at a time. */
  async runReport(input: RunInput): Promise<string> {
    if (this.busy) return BUSY_TEXT;
    this.busy = true;
    try {
      return await this.runOnce(input);
    } finally {
      this.busy = false;
    }
  }

  private async runOnce(input: RunInput): Promise<string> {
    const sales = readSales(await loadRows(input.sales));
    const stock = readStock(await loadRows(input.stock));
    if (sales.size === 0) return EMPTY_TEXT.replace('{name}', 'продаж');
    if (stock.size === 0) return EMPTY_TEXT.replace('{name}', 'остатков');
    const snapshot = await this.sheet.readSnapshot();
    const plan = buildPlan({ table: snapshot.table, sales, stock });
    if (plan.salesMissing === sales.size && plan.stockMissing === stock.size) return WRONG_TEXT;
    const columns = await this.sheet.writePlan(snapshot, plan, { period: input.period, stockDate: input.stockDate });
    const report = formatReport(plan, columns);
    // Only a real report is kept for the chat, not a refusal.
    this.memory.saveReport(input.chatId, report);
    return report;
  }
}
