/** One color of a model: its name, the items sold, and its stock. */
export type ModelPart = { color: string; sold: number; stock: number };

/** A model with several colors: its totals, and its colors. The sold items are positive sales only. */
export type ModelSummary = { model: string; sold: number; stock: number; reels: number; parts: ModelPart[] };
