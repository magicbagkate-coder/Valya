import type { ReminderRequest } from './reminderItem';

import { parseClock } from './zoneTime';

const MINUTE_MS = 60_000;
const MAX_AHEAD_MS = 366 * 24 * 60 * MINUTE_MS;

// "inMinutes" is a time from now. "at" is a Kyiv clock. The first one wins.
function dueTime(input: object, now: number): number | undefined {
  const minutes = Reflect.get(input, 'inMinutes');
  const clock = Reflect.get(input, 'at');
  if (typeof minutes === 'number' && minutes > 0) return now + Math.round(minutes) * MINUTE_MS;
  return typeof clock === 'string' ? parseClock(clock) : undefined;
}

function cleanText(input: object): string | undefined {
  const text = Reflect.get(input, 'text');
  return typeof text === 'string' && text.trim() !== '' ? text.trim() : undefined;
}

function isNearFuture(dueAt: number, now: number): boolean {
  return dueAt > now && dueAt <= now + MAX_AHEAD_MS;
}

/** Reads the input of the reminder tool. A missing text, an unclear time, a past time, or a time over a year away gives nothing. */
export function readReminder(input: unknown, now: number): ReminderRequest | undefined {
  if (typeof input !== 'object' || input === null) return undefined;
  const text = cleanText(input);
  const dueAt = dueTime(input, now);
  if (text === undefined || dueAt === undefined) return undefined;
  return isNearFuture(dueAt, now) ? { text, dueAt } : undefined;
}

/** Reads the number of the reminder to cancel from the input of the cancel tool. */
export function readCancelId(input: unknown): number | undefined {
  if (typeof input !== 'object' || input === null) return undefined;
  const id = Reflect.get(input, 'id');
  return typeof id === 'number' && Number.isInteger(id) ? id : undefined;
}
