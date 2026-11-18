/**
 * One product row of the sheet, ready to count.
 * group: "promo" for yellow and red rows, "main" for all other colors.
 * soldLast: items sold in the last sales column. soldTwo: items sold in the last two sales columns.
 * reels: the number of filled cells in the block of published content. lastReel: the text of the last one.
 */
export type AnalysisRow = {
  line: number;
  article: string;
  group: 'promo' | 'main';
  soldLast: number;
  soldTwo: number;
  stock: number;
  reels: number;
  lastReel: string;
};
