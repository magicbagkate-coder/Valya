/** What Claude asked for with the analysis tool: the time frame (empty "from" means none) and the question of the user (empty if there is none). */
export type AnalyzeRequest = { from: string; to: string; question: string };
