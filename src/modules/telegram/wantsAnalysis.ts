const ANALYSIS_WORDS = /анализ|проанализ|посчита|подсчит|рекоменд|разбер[иь]|оцени|сравни|что скажешь|вывод|статистик|динамик|тренд|топ[- ]?\d/i;

/** Tells if the caption of a file asks to analyze it. Then a 1C file is analyzed and not written to the table. */
export function wantsAnalysis(caption: string): boolean {
  return ANALYSIS_WORDS.test(caption);
}
