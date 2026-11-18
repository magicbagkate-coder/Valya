/**
 * The places of the columns of the sheet (0 is column A).
 * lastWeek and prevWeek: the last two sales columns (prevWeek is -1 if there is only one).
 * stock: the stock column. reelsFrom and reelsTo: the block of published content (reelsTo is not included).
 */
export type TableColumns = { lastWeek: number; prevWeek: number; stock: number; reelsFrom: number; reelsTo: number };
