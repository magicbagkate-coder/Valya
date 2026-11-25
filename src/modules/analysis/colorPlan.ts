import type { AnalysisRow } from './analysisRow';

/**
 * The plan that the colors of the sheet mark: the colored rows of the main assortment are planned for the content.
 * planned: how many such rows. shot: how many of them have a Reels in the shooting period. shotReels: the Reels of those rows in that period.
 * unshot: the planned rows that have no Reels in the period, the biggest stock first. shotText: the shooting period as text.
 */
export type ColorPlan = { planned: number; shot: number; shotReels: number; unshot: AnalysisRow[]; shotText: string };
