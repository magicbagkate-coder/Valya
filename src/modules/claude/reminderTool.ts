/** The tool that lets Claude set a reminder. The bot sends the reminder to the chat at the time. */
export const REMINDER_TOOL = {
  name: 'set_reminder',
  description:
    'Set a reminder. The bot will write to the chat at that time. Use it when the user asks to remind about something. Give the time with inMinutes (from now) or with at (a clock time). If the time is unclear, ask the user and do not call the tool.',
  input_schema: {
    type: 'object' as const,
    properties: {
      text: { type: 'string', description: 'What to remind about, short, for example "Встреча".' },
      inMinutes: { type: 'number', description: 'Minutes from now, for example 60 for "через час".' },
      at: { type: 'string', description: 'Kyiv time in the style "YYYY-MM-DD HH:mm", for example "2026-10-31 09:00". Use it when the user names a clock time or a day.' },
    },
    required: ['text'],
  },
};

/** The tool that lets Claude cancel a pending reminder by its number. */
export const CANCEL_TOOL = {
  name: 'cancel_reminder',
  description: 'Cancel a pending reminder by its number from the context. Use it only when the user asks to cancel or remove a reminder.',
  input_schema: {
    type: 'object' as const,
    properties: {
      id: { type: 'number', description: 'The number of the reminder.' },
    },
    required: ['id'],
  },
};
