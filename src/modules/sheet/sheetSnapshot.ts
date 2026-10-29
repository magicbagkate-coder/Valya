import type { TableRow } from '@/modules/report';

/** The state of the sheet "отчет" before the agent writes: its id, the header row, and the table rows. */
export type SheetSnapshot = { sheetId: number; headers: string[]; stockIndex: number; table: TableRow[] };
