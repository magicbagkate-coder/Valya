const ARTICLE_START = /^[A-Z0-9][A-Z0-9._/-]*$/;

/** Tells if a table cell looks like an article. A text such as "РИЛС КАЖДЫЙ ДЕНЬ" does not. */
export function looksLikeArticle(key: string): boolean {
  const first = key.split(' ')[0] ?? '';
  return /\d/.test(key) && ARTICLE_START.test(first);
}
