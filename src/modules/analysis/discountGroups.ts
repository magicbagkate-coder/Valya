import type { AnalysisRow } from './analysisRow';

/**
 * The candidates for a new discount, in three groups by the age of their last Reels. Each list has the biggest stock first.
 * price: check the price and test a discount. refresh: the content is old or missing, show the product again before a discount.
 * wait: the last Reels is fresh, wait for its result.
 */
export type DiscountGroups = { price: AnalysisRow[]; refresh: AnalysisRow[]; wait: AnalysisRow[] };
