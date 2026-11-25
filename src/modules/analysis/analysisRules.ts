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

// The score of a product for the content plan, 100 points at most. The weights are a starting guess and must be checked on real results.
/** Confirmed demand. */
export const WEIGHT_DEMAND = 35;
/** Enough stock to sell what the content brings. */
export const WEIGHT_STOCK = 20;
/** Lack of content: few Reels, and a long time since the last one. */
export const WEIGHT_CONTENT = 25;
/** The trend of the sales of the last two weeks. */
export const WEIGHT_TREND = 15;
/** The margin. The table has no price or cost, so it cannot be counted; the score is scaled to 100 without it. */
export const WEIGHT_MARGIN = 5;
/** Items sold in 14 days that give the full demand points. */
export const DEMAND_FULL = 8;
/** A stock of this size gives the full stock points. A bigger stock gives no more. */
export const STOCK_FULL = 6;
/** This number of Reels (or more) gives no content points. */
export const REELS_FULL = 8;
/** This number of days (or more) since the last Reels gives the full content points for the age. */
export const STALE_DAYS_FULL = 30;

/** A product with this stock or less is kept out of the separate Reels, if no other color of its model has enough stock. */
export const LOW_STOCK = 2;
/** The stock of the other colors of a model that counts as a real alternative. */
export const ALT_STOCK_MIN = 6;
/** A popular product is "running out" when its stock lasts this number of days or less. */
export const RUN_OUT_DAYS = 7;
/** A product is popular for the list of running out when it sold this number of items or more. */
export const RUN_OUT_SOLD = 3;
/** A last Reels this young (in days) means: wait for its result before a discount. */
export const FRESH_REEL_DAYS = 7;
/** A last Reels older than this (in days) means: refresh the content before a discount. */
export const STALE_REEL_DAYS = 30;
/** The days of stock that a line of the report tells. A longer stock is not worth telling. */
export const DAYS_SHOWN = 30;
/** A sales column whose period cannot be read counts as one week. */
export const DEFAULT_WEEK_DAYS = 7;
