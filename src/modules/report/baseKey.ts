const MARKDOWN_PART = /[_\s-]*(?:УЦ[ІИ]НКА|УЦЕНКА)/g;

/** Returns an article key without the markdown mark. */
export function baseKey(key: string): string {
  return key.replace(MARKDOWN_PART, '').trim();
}
