const REPORT_LIMIT = 4000;

/** What else the bot knows about a chat: its last report and the name of its data file. */
type ContextExtras = { lastReport?: string; fileName?: string };

/** Builds the facts that Claude gets with each message: the state for the table, the data file, and the last report. */
export function buildContext(facts: string, extras: ContextExtras): string {
  return [
    facts,
    extras.fileName ? `Data file available for analysis in the code sandbox: «${extras.fileName}».` : 'There is no data file for analysis.',
    extras.lastReport ? `LAST REPORT that the code sent to the chat:\n${extras.lastReport.slice(0, REPORT_LIMIT)}` : 'There is no report yet.',
  ].join('\n');
}
