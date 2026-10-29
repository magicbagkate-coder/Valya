/** What the agent will write to the sheet, and what it leaves alone. */
export type PlanResult = {
  salesWrites: Map<number, number>;
  stockWrites: Map<number, number>;
  untouched: { kind: 'sales' | 'stock'; row: number; text: string; reason: string; old: string }[];
  zeroed: { row: number; text: string; old: number }[];
  duplicates: string[];
  salesMissing: number;
  stockMissing: number;
  salesTotal: number;
  stockTotal: number;
};
