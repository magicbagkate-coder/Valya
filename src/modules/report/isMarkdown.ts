const MARKDOWN_MARK = /УЦ[ІИ]НКА|УЦЕНКА/;

/** Tells if an article key has the markdown mark (_УЦІНКА or УЦЕНКА). */
export function isMarkdown(key: string): boolean {
  return MARKDOWN_MARK.test(key);
}
