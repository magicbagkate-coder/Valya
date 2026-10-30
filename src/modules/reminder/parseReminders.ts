import type { ReminderItem } from './reminderItem';

function toItem(value: unknown): ReminderItem[] {
  if (typeof value !== 'object' || value === null) return [];
  const id = Reflect.get(value, 'id');
  const chatId = Reflect.get(value, 'chatId');
  const text = Reflect.get(value, 'text');
  const dueAt = Reflect.get(value, 'dueAt');
  const valid = Number.isInteger(id) && Number.isInteger(chatId) && typeof text === 'string' && Number.isFinite(dueAt);
  return valid ? [{ id: Number(id), chatId: Number(chatId), text: String(text), dueAt: Number(dueAt) }] : [];
}

/** Reads the saved reminders. It keeps only the items that have the right shape, so a broken file cannot crash the bot. */
export function parseReminders(input: unknown): ReminderItem[] {
  return Array.isArray(input) ? input.flatMap(toItem) : [];
}
