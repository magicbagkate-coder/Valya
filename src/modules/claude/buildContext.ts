const REPORT_LIMIT = 4000;

/** What else the bot knows about a chat: its last report, the name of its data file, and its pending reminders (one line each). */
type ContextExtras = { lastReport?: string; fileName?: string; reminders?: string[] };

/** Builds the facts that Claude gets with each message: the state for the table, the data file, the pending reminders, and the last report. */
export function buildContext(facts: string, extras: ContextExtras): string {
  const reminders = extras.reminders ?? [];
  return [
    facts,
    extras.fileName ? `Data file available for analysis in the code sandbox: «${extras.fileName}».` : 'There is no data file for analysis.',
    reminders.length > 0 ? `PENDING REMINDERS (number, time in Kyiv, text):\n${reminders.join('\n')}` : 'There are no pending reminders.',
    extras.lastReport ? `LAST REPORT that the code sent to the chat:\n${extras.lastReport.slice(0, REPORT_LIMIT)}` : 'There is no report yet.',
  ].join('\n');
}
