import type { AnalysisRow } from './analysisRow';

/**
 * The numbers of one group of products (promo or main assortment) and its lists, each sorted from the most important.
 * reels: all time. periodReels: inside the time frame.
 * best: sells well. weak: sells weakly and is in stock. unsold: sold nothing and is in stock. piling: big stock and weak sales.
 * runningOut: sold well and the stock lasts a week or less, or is gone. published: products that got Reels inside the time frame.
 */
export type GroupReport = {
  items: number;
  sold: number;
  stock: number;
  reels: number;
  periodReels: number;
  noReels: number;
  best: AnalysisRow[];
  weak: AnalysisRow[];
  unsold: AnalysisRow[];
  piling: AnalysisRow[];
  runningOut: AnalysisRow[];
  published: AnalysisRow[];
};
