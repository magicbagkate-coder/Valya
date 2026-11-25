import type { AnalysisRow } from './analysisRow';
import type { ModelSummary } from './modelSummary';

const sumOf = (rows: AnalysisRow[], pick: (row: AnalysisRow) => number): number => rows.reduce((total, row) => total + pick(row), 0);

/**
 * Gathers the colors of each model. Only models with two or more colors and some sales are given, the best-selling model first.
 * One Reels can show several colors of a model, so the plan can be made for the model as a whole.
 */
export function summarizeModels(rows: AnalysisRow[]): ModelSummary[] {
  const byModel = new Map<string, AnalysisRow[]>();
  for (const row of rows) byModel.set(row.model, [...(byModel.get(row.model) ?? []), row]);
  return [...byModel.entries()]
    .filter(([, colors]) => colors.length >= 2)
    .map(([model, colors]) => ({
      model,
      sold: sumOf(colors, (row) => row.sold),
      stock: sumOf(colors, (row) => row.stock),
      reels: sumOf(colors, (row) => row.reels),
      parts: [...colors].sort((first, second) => second.sold - first.sold).map((row) => ({ color: row.color || row.article, sold: row.sold, stock: row.stock })),
    }))
    .filter((summary) => summary.sold > 0)
    .sort((first, second) => second.sold - first.sold || first.model.localeCompare(second.model));
}
