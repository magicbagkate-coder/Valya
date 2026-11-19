import type { DayRange } from './dates';
import type { SalesPick } from './salesPick';
import type { TableColumns } from './tableColumns';

import { MIN_SALES_DAYS, WEAK_PER_DAYS, WEAK_SOLD_MAX } from './analysisRules';
import { dayText, labelRange, overlapDays, rangeLength } from './dates';

type PickJob = { headers: string[]; columns: TableColumns; today: number; window?: DayRange };
type SalesColumn = { index: number; label: string; range: DayRange };

const labelAt = (headers: string[], index: number): string => (headers[index] ?? '').trim();

// No time frame: the last two sales columns.
function lastColumns(job: PickJob): SalesPick {
  const { columns, headers } = job;
  const indexes = columns.prevWeek >= 0 ? [columns.prevWeek, columns.lastWeek] : [columns.lastWeek];
  const labels = indexes.map((index) => labelAt(headers, index));
  const kind = indexes.length > 1 ? 'последние 2 недели' : 'последняя неделя';
  return { indexes, hasSales: true, weakMax: WEAK_SOLD_MAX, periodText: `${kind} (${labels.join(' и ')})`, notes: [] };
}

// Every sales column that has a readable period, with that period.
function salesColumns(job: PickJob): SalesColumn[] {
  const found: SalesColumn[] = [];
  for (let index = job.columns.salesFrom; index <= job.columns.lastWeek; index += 1) {
    const label = labelAt(job.headers, index);
    const range = labelRange(label, job.today);
    if (range) found.push({ index, label, range });
  }
  return found;
}

function coverageNote(all: SalesColumn[]): string {
  if (all.length === 0) return 'В таблице нет колонок продаж с понятным периодом.';
  const from = Math.min(...all.map((column) => column.range.from));
  const to = Math.max(...all.map((column) => column.range.to));
  return `Продажи в таблице записаны по неделям и есть только за ${dayText(from)}–${dayText(to)}.`;
}

function salesNote(job: { days: number; used: SalesColumn[] }): string {
  if (job.days < MIN_SALES_DAYS) return `Период короче ${MIN_SALES_DAYS} дней: продажи записаны по неделям, поэтому их за такой период не посчитать. Показываю Reels и остаток.`;
  if (job.used.length === 0) return 'В этом периоде нет колонок продаж.';
  return `Продажи за период: ${job.used.map((column) => column.label).join(' + ')} (неделя входит, если в период попадает не меньше половины её дней).`;
}

/**
 * Chooses the sales columns. Without a time frame these are the last two columns.
 * With a time frame, a weekly column counts when at least half of its days are inside the frame.
 * A frame shorter than a week has no sales. The limit of weak sales grows with the number of days of sales that are counted.
 */
export function pickSales(job: PickJob): SalesPick {
  if (!job.window) return lastColumns(job);
  const days = rangeLength(job.window);
  const all = salesColumns(job);
  const used = all.filter((column) => overlapDays(column.range, job.window ?? column.range) * 2 >= rangeLength(column.range));
  // The limit follows the days of sales that are really counted, not the length of the frame.
  const salesDays = days >= MIN_SALES_DAYS ? used.reduce((total, column) => total + rangeLength(column.range), 0) : 0;
  return {
    indexes: days >= MIN_SALES_DAYS ? used.map((column) => column.index) : [],
    hasSales: days >= MIN_SALES_DAYS && used.length > 0,
    weakMax: Math.max(WEAK_SOLD_MAX, Math.floor(salesDays / WEAK_PER_DAYS)),
    periodText: `с ${dayText(job.window.from)} по ${dayText(job.window.to)} (${days} дн.)`,
    notes: [coverageNote(all), salesNote({ days, used })],
  };
}
