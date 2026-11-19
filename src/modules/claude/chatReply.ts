import type { AnalysisPeriod } from '@/modules/analysis';
import type { ReminderRequest } from '@/modules/reminder';
import type { Hints } from '@/modules/report';

/**
 * What Claude said and what it asked the code to do.
 * labels: the period and the date for the table. reminders: reminders to set. cancels: numbers of reminders to cancel.
 * skipped: how many reminders the code could not read, for example because the time was unclear.
 * analyze: Claude asked for the analysis of the table, with its time frame (empty "from" means no frame). report: the text of that analysis, filled in by the code.
 */
export type ChatReply = {
  text: string;
  labels: Hints;
  reminders: ReminderRequest[];
  cancels: number[];
  skipped: number;
  analyze: AnalysisPeriod | undefined;
  report: string;
};
