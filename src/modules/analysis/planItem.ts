/**
 * One line of the new content plan: a product and how many Reels it gets, with the score and the facts that explain the choice.
 * trend: the trend of the last two weeks ("↑ +50%") or empty. note: a warning, for example a small stock, or empty.
 */
export type PlanItem = {
  line: number;
  article: string;
  count: number;
  score: number;
  sold: number;
  trend: string;
  stock: number;
  reels: number;
  lastReel: string;
  note: string;
};
