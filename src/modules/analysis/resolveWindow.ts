import type { AnalysisPeriod } from './analysisPeriod';
import type { DayRange } from './dates';

import { MAX_PERIOD_DAYS } from './analysisRules';
import { parseIsoDay, rangeLength } from './dates';

/**
 * Turns the period that the user asked for into a range of days. No "from" means no frame (nothing is returned).
 * An end in the future is cut to today. A date that cannot be read, or an end before the start, is an error with a plain message.
 */
export function resolveWindow(job: { period: AnalysisPeriod; today: number }): DayRange | undefined {
  if (job.period.from.trim() === '') return undefined;
  const from = parseIsoDay(job.period.from);
  const to = job.period.to.trim() === '' ? job.today : parseIsoDay(job.period.to);
  if (from === undefined || to === undefined) throw new Error('Не поняла даты периода. Скажи период словами, например «за последние 7 дней».');
  const window = { from, to: Math.min(to, job.today) };
  if (window.from > window.to) throw new Error('Начало периода позже его конца или в будущем.');
  if (rangeLength(window) > MAX_PERIOD_DAYS) throw new Error(`Период длиннее ${MAX_PERIOD_DAYS} дней, это слишком много. Возьми короче.`);
  return window;
}
