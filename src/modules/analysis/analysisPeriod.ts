/** The time frame of an analysis, as days written "2026-11-18". An empty "from" means no frame: the last two sales columns. An empty "to" means today. */
export type AnalysisPeriod = { from: string; to: string };
