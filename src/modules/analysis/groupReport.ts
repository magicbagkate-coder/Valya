import type { AnalysisRow } from './analysisRow';

/**
 * The numbers of one group of products (promo or main assortment) and its lists, each sorted from the most important.
 * best: sells well. weak: sells weakly and is in stock. unsold: sold nothing and is in stock. piling: big stock and weak sales.
 */
export type GroupReport = {
  items: number;
  soldLast: number;
  soldTwo: number;
  stock: number;
  reels: number;
  noReels: number;
  best: AnalysisRow[];
  weak: AnalysisRow[];
  unsold: AnalysisRow[];
  piling: AnalysisRow[];
};
