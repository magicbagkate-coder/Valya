const ZONE_NAME = 'Europe/Kyiv';
const MINUTE_MS = 60_000;
const CLOCK_FORMAT = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

const zoneFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE_NAME,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

type ClockParts = { year: string; month: string; day: string; hour: string; minute: string };

function clockParts(time: number): ClockParts {
  const parts = new Map(zoneFormat.formatToParts(time).map((part): [string, string] => [part.type, part.value]));
  return {
    year: parts.get('year') ?? '',
    month: parts.get('month') ?? '',
    day: parts.get('day') ?? '',
    hour: parts.get('hour') ?? '',
    minute: parts.get('minute') ?? '',
  };
}

// The gap between the zone clock and UTC at this moment, in milliseconds. It changes with the summer time.
function zoneOffset(time: number): number {
  const parts = clockParts(time);
  const zoneTime = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return zoneTime - Math.floor(time / MINUTE_MS) * MINUTE_MS;
}

/** Writes a moment as the Kyiv clock, for example "2026-10-30 15:00". */
export function clockText(time: number): string {
  const parts = clockParts(time);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/** Writes a moment for the user, for example "30.10 в 15:00" (Kyiv time). */
export function formatDue(time: number): string {
  const parts = clockParts(time);
  return `${parts.day}.${parts.month} в ${parts.hour}:${parts.minute}`;
}

/** Reads a Kyiv clock such as "2026-10-30 15:00". A date that does not exist (for example 31 February) gives nothing. */
export function parseClock(text: string): number | undefined {
  const found = CLOCK_FORMAT.exec(text.trim());
  if (!found) return undefined;
  const [, year, month, day, hour, minute] = found;
  const guess = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  const time = guess - zoneOffset(guess - zoneOffset(guess));
  return clockText(time) === `${year}-${month}-${day} ${hour}:${minute}` ? time : undefined;
}
