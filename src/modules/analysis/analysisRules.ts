// The limits of the analysis. They come from the rules of the team.
/** A stock above this number is big enough to think about a discount ("остаток больше 5 единиц"). */
export const STOCK_ABOVE = 5;
/** Weak sales: this number of items or less in the last 2 weeks. */
export const WEAK_SOLD_MAX = 1;
/** A product has enough published Reels for a discount when it has this number or more. */
export const ENOUGH_REELS = 3;
/** The size of the new content plan: Reels for one week. */
export const PLAN_TOTAL = 70;
/** One product gets at most this number of Reels in the plan. */
export const PLAN_ITEM_MAX = 3;
/** How many products one list of the report shows. */
export const LIST_SIZE = 10;
/** How many discount candidates the report shows. */
export const CANDIDATE_SIZE = 15;
