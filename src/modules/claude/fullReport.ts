/** The analysis of the table: the exact report of the code, and the conclusions that Claude wrote from it (empty if Claude could not). */
export type FullReport = { report: string; advice: string };

const ADVICE_FAILED = 'Выводы от ИИ сейчас не получились. Цифры выше точные, выводы можно запросить позже.';

/** The text for the chat: the report, then the conclusions. */
export function displayReport(full: FullReport): string {
  return `${full.report}\n\n${full.advice || ADVICE_FAILED}`;
}

/** The text that the bot remembers for the chat. The conclusions come first, because a long text is cut at the end. */
export function contextReport(full: FullReport): string {
  return full.advice ? `${full.advice}\n\n${full.report}` : full.report;
}
