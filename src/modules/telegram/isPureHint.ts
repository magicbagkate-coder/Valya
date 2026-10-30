const HINT_WORDS = /продажи|продаж|остатки|остаток|остатков|период|дата|на|за|с|по|и|до|числа/gi;

/** Tells if a message is only a period or a date ("продажи 27-29,10"). Then the code reads it without Claude. */
export function isPureHint(text: string): boolean {
  const rest = text.replace(HINT_WORDS, '').replace(/[\d\s.,:;\-–—/]/g, '');
  return rest.length <= 2;
}
