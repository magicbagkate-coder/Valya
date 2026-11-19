// The limits of the analysis. They come from the rules of the team.
/** A stock above this number is big enough to think about a discount ("остаток больше 5 единиц"). */
export const STOCK_ABOVE = 5;
/** Weak sales without a time frame: this number of items or less in the last 2 weeks. With a time frame, the limit grows with the days of sales that are counted. */
export const WEAK_SOLD_MAX = 1;
/** A product has enough published Reels for a discount when it has this number or more (all time). */
export const ENOUGH_REELS = 3;
/** The size of the new content plan: Reels for one week. */
export const PLAN_TOTAL = 70;
/** One product gets at most this number of Reels in the plan. */
export const PLAN_ITEM_MAX = 3;
/** How many products one list of the report shows. */
export const LIST_SIZE = 10;
/** How many discount candidates the report shows. */
export const CANDIDATE_SIZE = 15;
/** The sales are written by weeks, so a time frame shorter than this has no sales. */
export const MIN_SALES_DAYS = 7;
/** With a time frame, the weak sales limit is one item for each this number of counted days of sales (at least 1). The first rule is 0–1 items in 14 days. */
export const WEAK_PER_DAYS = 14;
/** The longest time frame that the analysis accepts. */
export const MAX_PERIOD_DAYS = 800;
