/**
 * Which sales columns the analysis counts, and how to say it.
 * indexes: the columns. hasSales: false when there are no sales to judge. weakMax: the most items that still count as weak sales.
 * periodText: the period for the header of the report. notes: lines that explain what was counted.
 */
export type SalesPick = { indexes: number[]; hasSales: boolean; weakMax: number; periodText: string; notes: string[] };
