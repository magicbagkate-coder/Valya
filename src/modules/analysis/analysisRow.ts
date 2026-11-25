/**
 * One product row of the sheet, ready to count.
 * group: "promo" for yellow and red rows, "main" for all other colors.
 * planned: the row is colored (not white, not yellow, not red), which marks it as planned for the content.
 * sold: items sold in the counted sales columns. stock: the current stock.
 * reels: the number of filled cells in the block of published content (all time). lastReel: the text of the last one.
 * periodReels: the Reels published inside the time frame. Without a time frame it is the same as reels.
 * shotReels: the Reels published in the shooting period (the time frame, or the last 7 days if there is none).
 */
export type AnalysisRow = {
  line: number;
  article: string;
  group: 'promo' | 'main';
  planned: boolean;
  sold: number;
  stock: number;
  reels: number;
  periodReels: number;
  shotReels: number;
  lastReel: string;
};
