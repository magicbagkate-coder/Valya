/**
 * The analysis of the table: the exact report of the code, the conclusions that Claude wrote from it (empty if Claude could not),
 * and the question of the user that the conclusions answer (empty for a plain analysis).
 */
export type FullReport = { report: string; advice: string; question: string };

const ADVICE_FAILED = 'Выводы от ИИ сейчас не получились. Цифры выше точные, выводы можно запросить позже.';
const ADVICE_FAILED_FIRST = 'Выводы от ИИ сейчас не получились. Цифры ниже точные.';

/**
 * The text for the chat. A plain analysis is the report, then the conclusions.
 * If the user asked a question, the conclusions come first, because they start with the answer.
 */
export function displayReport(full: FullReport): string {
  if (full.question === '') return `${full.report}\n\n${full.advice || ADVICE_FAILED}`;
  return `${full.advice || ADVICE_FAILED_FIRST}\n\n${full.report}`;
}

/** The text that the bot remembers for the chat. The conclusions come first, because a long text is cut at the end. */
export function contextReport(full: FullReport): string {
  return full.advice ? `${full.advice}\n\n${full.report}` : full.report;
}
