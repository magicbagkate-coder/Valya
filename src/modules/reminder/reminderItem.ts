/** What the user wants to be reminded of, and when. The time is in milliseconds since 1970. */
export type ReminderRequest = { text: string; dueAt: number };

/** A reminder that is ready to be saved for a chat. */
export type NewReminder = { chatId: number; text: string; dueAt: number };

/** A saved reminder. It belongs to one chat and has a number that the user can use to cancel it. */
export type ReminderItem = { id: number; chatId: number; text: string; dueAt: number };
