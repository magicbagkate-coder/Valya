// "COFFEE_УЦІНКА" is the color "COFFEE" of a marked down item.
const MARKDOWN_MARK = /_?(УЦІНКА|УЦЕНКА)$/i;
// A word that ends this many articles (and has no digit) is a color word.
const MIN_COLOR_COUNT = 3;

/** An article split into its model and its color, for example "M1266-BL D.WINE" into "M1266-BL" and "D.WINE". */
export type ArticleParts = { model: string; color: string };

const tokensOf = (article: string): string[] => article.trim().split(/\s+/).filter((token) => token !== '');
const wordOf = (token: string): string => token.replace(MARKDOWN_MARK, '').toUpperCase();

/** Finds the color words: the words that stand at the end of at least 3 articles and have no digit ("COFFEE", "BLACK", "D.WINE"). */
export function colorWords(articles: string[]): Set<string> {
  const counts = new Map<string, number>();
  for (const article of articles) {
    const word = wordOf(tokensOf(article).at(-1) ?? '');
    if (word !== '' && !/\d/.test(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, count]) => count >= MIN_COLOR_COUNT).map(([word]) => word));
}

const isDark = (token: string | undefined): boolean => wordOf(token ?? '') === 'D';

// Where the color of an article starts: the color words at the end, and a lone "D" (dark) before them.
function colorStart(job: { tokens: string[]; colors: Set<string> }): number {
  let cut = job.tokens.length;
  while (cut > 1 && job.colors.has(wordOf(job.tokens[cut - 1] ?? ''))) cut -= 1;
  const hasColor = cut < job.tokens.length;
  return hasColor && cut > 1 && isDark(job.tokens[cut - 1]) ? cut - 1 : cut;
}

/**
 * Splits an article into the model and the color. The color is the color words at the end ("D.WINE RED"), and a lone "D" (dark) before them.
 * An article with no color word at the end is its own model with an empty color.
 */
export function splitArticle(job: { article: string; colors: Set<string> }): ArticleParts {
  const tokens = tokensOf(job.article);
  const cut = colorStart({ tokens, colors: job.colors });
  return { model: tokens.slice(0, cut).join(' '), color: tokens.slice(cut).join(' ') };
}
