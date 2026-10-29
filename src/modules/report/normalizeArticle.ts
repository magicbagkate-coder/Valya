/** Trims an article, collapses repeated spaces, and writes it in upper case. */
export function normalizeArticle(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toUpperCase();
}
