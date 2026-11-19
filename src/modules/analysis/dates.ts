const DAY_MS = 86_400_000;
const FULL_RANGE = /^(\d{1,2})[.,](\d{1,2})\s*-\s*(\d{1,2})[.,](\d{1,2})$/;
const SHORT_RANGE = /^(\d{1,2})\s*-\s*(\d{1,2})[.,](\d{1,2})$/;
const SINGLE_DAY = /^(\d{1,2})[.,](\d{1,2})$/;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
// A Reels cell starts with its day and month: "27.04", "27.04 сборн", "11 03".
const REEL_DAY = /^(\d{1,2})[.,\s](\d{1,2})(?!\d)/;

/** A range of days. A day is the number of days since 1970-01-01. Both ends are included. */
export type DayRange = { from: number; to: number };

type DateParts = { year: number; month: number; day: number };
type LabelParts = { startDay: number; startMonth: number; endDay: number; endMonth: number };

const yearOf = (day: number): number => new Date(day * DAY_MS).getUTCFullYear();

/** The number of a day, or nothing if the date does not exist (for example 31 February). */
export function toDay(date: DateParts): number | undefined {
  const time = Date.UTC(date.year, date.month - 1, date.day);
  const check = new Date(time);
  const same = check.getUTCFullYear() === date.year && check.getUTCMonth() === date.month - 1 && check.getUTCDate() === date.day;
  return same ? Math.floor(time / DAY_MS) : undefined;
}

/** Reads a day written as "2026-11-18". */
export function parseIsoDay(text: string): number | undefined {
  const found = ISO_DAY.exec(text.trim());
  return found ? toDay({ year: Number(found[1]), month: Number(found[2]), day: Number(found[3]) }) : undefined;
}

/** Takes the day out of a clock text such as "2026-11-18 09:05". */
export function clockDay(clock: string): number | undefined {
  return parseIsoDay(clock.slice(0, 10));
}

/** Writes a day for the user, for example "18.11". */
export function dayText(day: number): string {
  const date = new Date(day * DAY_MS);
  return `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** How many days the range has. */
export const rangeLength = (range: DayRange): number => range.to - range.from + 1;

/** How many days two ranges have in common. */
export function overlapDays(first: DayRange, second: DayRange): number {
  return Math.max(0, Math.min(first.to, second.to) - Math.max(first.from, second.from) + 1);
}

// A date without a year is the latest such date that is not in the future.
function inferDay(job: { day: number; month: number; today: number }): number | undefined {
  const year = yearOf(job.today);
  const thisYear = toDay({ year, month: job.month, day: job.day });
  if (thisYear !== undefined && thisYear <= job.today) return thisYear;
  return toDay({ year: year - 1, month: job.month, day: job.day });
}

function labelParts(label: string): LabelParts | undefined {
  const text = label.trim();
  const full = FULL_RANGE.exec(text);
  if (full) return { startDay: Number(full[1]), startMonth: Number(full[2]), endDay: Number(full[3]), endMonth: Number(full[4]) };
  const short = SHORT_RANGE.exec(text);
  if (short) return { startDay: Number(short[1]), startMonth: Number(short[3]), endDay: Number(short[2]), endMonth: Number(short[3]) };
  const single = SINGLE_DAY.exec(text);
  return single ? { startDay: Number(single[1]), startMonth: Number(single[2]), endDay: Number(single[1]), endMonth: Number(single[2]) } : undefined;
}

// The start of a range is in the year of its end, or in the year before if that would put it after the end (28.12-03.01).
function startDayOf(parts: LabelParts, end: number): number | undefined {
  const sameYear = toDay({ year: yearOf(end), month: parts.startMonth, day: parts.startDay });
  if (sameYear !== undefined && sameYear <= end) return sameYear;
  return toDay({ year: yearOf(end) - 1, month: parts.startMonth, day: parts.startDay });
}

/** Reads the header of a sales column ("04-10.11", "11.11-17.11", "28,09-04,10", "21,10") as a range of days. */
export function labelRange(label: string, today: number): DayRange | undefined {
  const parts = labelParts(label);
  if (!parts) return undefined;
  const to = inferDay({ day: parts.endDay, month: parts.endMonth, today });
  const from = to === undefined ? undefined : startDayOf(parts, to);
  return from !== undefined && to !== undefined ? { from, to } : undefined;
}

/** Reads the day of a Reels cell ("27.04 сборн" is 27 April). A cell without a date gives nothing. */
export function reelDay(text: string, today: number): number | undefined {
  const found = REEL_DAY.exec(text.trim());
  return found ? inferDay({ day: Number(found[1]), month: Number(found[2]), today }) : undefined;
}
