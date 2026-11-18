const CLOCK_FORMAT = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):\d{2}$/;
const WEDNESDAY_NUMBER = 3;
// The weekly report is sent on Wednesday at 09:00. If the bot was off at that time, it can still send until 12:00.
const REPORT_HOUR = 9;
const WINDOW_HOURS = 3;

/** Takes the Kyiv clock ("2026-11-18 09:05"). On Wednesday from 09:00 to 11:59 it gives the date "2026-11-18". At any other time it gives nothing. */
export function dueReportDate(clock: string): string | undefined {
  const found = CLOCK_FORMAT.exec(clock);
  if (!found) return undefined;
  const [, year, month, day, hour] = found;
  const weekday = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
  const inWindow = Number(hour) >= REPORT_HOUR && Number(hour) < REPORT_HOUR + WINDOW_HOURS;
  return weekday === WEDNESDAY_NUMBER && inWindow ? `${year}-${month}-${day}` : undefined;
}
