import type { PlanResult } from './planResult';

const MAX_LINES = 40;

/** The column names and letters that the report shows. */
export type ReportColumns = {
  salesHeader: string;
  salesColumn: string;
  stockHeader: string;
  stockColumn: string;
  inserted: boolean;
};

function buildSection(title: string, lines: string[]): string {
  if (lines.length === 0) return `${title}: нет.`;
  const shown = lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES), `…и ещё ${lines.length - MAX_LINES}`] : lines;
  return [`${title} (${lines.length}):`, ...shown].join('\n');
}

function untouchedLines(plan: PlanResult, columns: ReportColumns): string[] {
  return plan.untouched.map((cell) => {
    const column = cell.kind === 'sales' ? columns.salesColumn : columns.stockColumn;
    const old = cell.old === '' ? '' : ` — было: ${cell.old}`;
    return `• ${column}${cell.row} — ${cell.text} — ${cell.reason}${old}`;
  });
}

/** Writes the final message for the user. The tone is short and the lists are by point. */
export function formatReport(plan: PlanResult, columns: ReportColumns): string {
  const head = [
    'Готово, проверь.',
    `Продажи, колонка «${columns.salesHeader}» (${columns.salesColumn}): ${plan.salesWrites.size} строк, всего ${plan.salesTotal} шт.`,
    `Остатки, колонка «${columns.stockHeader}» (${columns.stockColumn}): ${plan.stockWrites.size} строк, сумма ${plan.stockTotal}.`,
  ];
  if (columns.inserted) head.push('Колонку новой недели вставил перед остатками.');
  const zeroed = plan.zeroed.map((one) => `• строка ${one.row} — ${one.text} — было ${one.old}`);
  return [
    head.join('\n'),
    buildSection('Не внёс, нужно проверить', untouchedLines(plan, columns)),
    buildSection('Остаток стал 0, хотя был больше нуля', zeroed),
    buildSection('Дубли артикулов', plan.duplicates.map((line) => `• ${line}`)),
    `Нет в таблице, не внесено: продажи ${plan.salesMissing} арт., остатки ${plan.stockMissing} арт.`,
  ].join('\n\n');
}
