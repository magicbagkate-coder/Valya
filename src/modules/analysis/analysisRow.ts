/**
 * One product row of the sheet, ready to count.
 * group: "promo" for yellow and red rows, "main" for all other colors.
 * sold: items sold in the counted sales columns. stock: the current stock.
 * reels: the number of filled cells in the block of published content (all time). lastReel: the text of the last one.
 * periodReels: the Reels published inside the time frame. Without a time frame it is the same as reels.
 */
export type AnalysisRow = {
  line: number;
  article: string;
  group: 'promo' | 'main';
  sold: number;
  stock: number;
  reels: number;
  periodReels: number;
  lastReel: string;
};
