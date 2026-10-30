import type { Hints } from '@/modules/report';
import type { ReminderRequest } from '@/modules/reminder';

/**
 * What Claude said and what it asked the code to do.
 * labels: the period and the date for the table. reminders: reminders to set. cancels: numbers of reminders to cancel.
 * skipped: how many reminders the code could not read, for example because the time was unclear.
 */
export type ChatReply = { text: string; labels: Hints; reminders: ReminderRequest[]; cancels: number[]; skipped: number };
