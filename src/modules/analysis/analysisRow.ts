/**
 * One product row of the sheet, ready to count.
 * group: "promo" for yellow and red rows, "main" for all other colors.
 * planned: the row is colored (not white, not yellow, not red), which marks it as planned for the content.
 * model and color: the article split into the model and its color ("M1266-BL" and "D.WINE").
 * weeks: the sales of each counted week column (a negative number is a return). sold: the sum of the positive weeks. returns: the sum of the negative weeks, as a positive number.
 * stock: the current stock. daysLeft: for how many days the stock lasts at the pace of the counted sales (nothing if nothing was sold).
 * reels: the number of filled cells in the block of published content (all time). lastReel: the text of the last one. daysSinceReel: days since the latest Reels with a readable date.
 * periodReels: the Reels published inside the time frame. Without a time frame it is the same as reels.
 * shotReels: the Reels published in the shooting period (the time frame, or the last 7 days if there is none).
 */
export type AnalysisRow = {
  line: number;
  article: string;
  model: string;
  color: string;
  group: 'promo' | 'main';
  planned: boolean;
  weeks: number[];
  sold: number;
  returns: number;
  stock: number;
  daysLeft: number | undefined;
  reels: number;
  periodReels: number;
  shotReels: number;
  lastReel: string;
  daysSinceReel: number | undefined;
};
