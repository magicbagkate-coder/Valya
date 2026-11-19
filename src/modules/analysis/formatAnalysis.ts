import type { AnalysisResult } from './analysisResult';
import type { AnalysisRow } from './analysisRow';
import type { GroupReport } from './groupReport';
import type { PlanItem } from './planItem';

import { CANDIDATE_SIZE, ENOUGH_REELS, LIST_SIZE, PLAN_TOTAL, STOCK_ABOVE } from './analysisRules';

type ListJob = { title: string; rows: AnalysisRow[]; toLine: (row: AnalysisRow) => string; limit: number };
type Style = { hasSales: boolean; weakMax: number; windowed: boolean };

const soldLine = (row: AnalysisRow): string => `• ${row.article} (стр. ${row.line}): продано ${row.sold}, остаток ${row.stock}`;

// With a time frame the line tells the Reels of the frame and all Reels. Without it, only all Reels.
function reelsLineFor(style: Style): (row: AnalysisRow) => string {
  return (row) => {
    const last = row.lastReel ? `, последний ${row.lastReel}` : '';
    const reels = style.windowed ? `Reels за период ${row.periodReels}, всего ${row.reels}` : `Reels ${row.reels}`;
    const sold = style.hasSales ? `продано ${row.sold}, ` : '';
    return `• ${row.article} (стр. ${row.line}): ${sold}остаток ${row.stock}, ${reels}${last}`;
  };
}

const weakText = (weakMax: number): string => `продано 0–${weakMax} шт за период`;

// A title with the number of products, and the first ones. An empty list says "нет".
function listLines(job: ListJob): string[] {
  if (job.rows.length === 0) return [`${job.title}: нет.`];
  const shown = job.rows.length > job.limit ? `, первые ${job.limit}` : '';
  return [`${job.title}: ${job.rows.length}${shown}`, ...job.rows.slice(0, job.limit).map(job.toLine)];
}

const totalsLine = (group: GroupReport): string => `Продано за период: ${group.sold} шт. Остаток сейчас: ${group.stock} шт.`;

const NO_SALES_LINE = 'Продажи за этот период я не считаю, поэтому списков по продажам нет.';

function promoLines(job: { group: GroupReport; style: Style }): string[] {
  const { group, style } = job;
  const head = [`АКЦИОННЫЕ ТОВАРЫ (жёлтые и красные строки): ${group.items} позиций`];
  const tail = ['Для акционных товаров я не считаю Reels и не ставлю их в новый план.'];
  if (!style.hasSales) return [...head, `Остаток сейчас: ${group.stock} шт.`, NO_SALES_LINE, ...tail];
  return [
    ...head,
    totalsLine(group),
    ...listLines({ title: `Хорошо продаются (больше ${style.weakMax} шт за период)`, rows: group.best, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({ title: 'Вообще не продаются (0 шт за период, остаток есть), больше всего на складе', rows: group.unsold, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({ title: `Накапливаются на складе (остаток больше ${STOCK_ABOVE} шт, ${weakText(style.weakMax)})`, rows: group.piling, toLine: soldLine, limit: LIST_SIZE }),
    ...tail,
  ];
}

function reelsTotalLines(job: { group: GroupReport; style: Style }): string[] {
  const { group, style } = job;
  const average = group.items > 0 ? (group.reels / group.items).toFixed(1) : '0';
  if (!style.windowed) return [`Reels опубликовано: ${group.reels} (в среднем ${average} на позицию). Позиций без единого Reels: ${group.noReels}.`];
  return [
    `Reels за период: ${group.periodReels} (на ${group.published.length} позициях). За всё время: ${group.reels}. Позиций без единого Reels за всё время: ${group.noReels}.`,
    ...listLines({ title: 'Больше всего Reels за период', rows: group.published, toLine: reelsLineFor(style), limit: LIST_SIZE }),
  ];
}

function mainLines(job: { group: GroupReport; style: Style }): string[] {
  const { group, style } = job;
  const toLine = reelsLineFor(style);
  const head = [`ОСНОВНОЙ АССОРТИМЕНТ (все остальные цвета): ${group.items} позиций`];
  const note = 'Плана Reels в таблице нет, поэтому «запланировано» и «не опубликовано» я не считаю.';
  if (!style.hasSales) return [...head, `Остаток сейчас: ${group.stock} шт.`, ...reelsTotalLines(job), note, NO_SALES_LINE];
  return [
    ...head,
    totalsLine(group),
    ...reelsTotalLines(job),
    note,
    ...listLines({ title: `Хорошо продаются (больше ${style.weakMax} шт за период)`, rows: group.best, toLine, limit: LIST_SIZE }),
    ...listLines({ title: `Продаются плохо (${weakText(style.weakMax)}, остаток есть), больше всего на складе`, rows: group.weak, toLine, limit: LIST_SIZE }),
  ];
}

function candidateLines(result: AnalysisResult): string[] {
  if (!result.hasSales) return ['КАНДИДАТЫ НА СКИДКУ и НОВЫЙ КОНТЕНТ-ПЛАН: нужны продажи, а за этот период их нет. Попроси анализ за неделю и дольше.'];
  const title = `КАНДИДАТЫ НА НОВУЮ СКИДКУ (основной ассортимент, остаток больше ${STOCK_ABOVE} шт, ${weakText(result.weakMax)}, Reels за всё время не меньше ${ENOUGH_REELS})`;
  return listLines({ title, rows: result.candidates, toLine: reelsLineFor({ hasSales: result.hasSales, weakMax: result.weakMax, windowed: result.windowed }), limit: CANDIDATE_SIZE });
}

const planLine = (item: PlanItem, index: number): string =>
  `${index + 1}. ${item.article} (стр. ${item.line}): ${item.count} Reels. Продано ${item.sold}, остаток ${item.stock}, уже было Reels ${item.reels}`;

function planLines(result: AnalysisResult): string[] {
  if (!result.hasSales) return [];
  const total = result.plan.reduce((sum, item) => sum + item.count, 0);
  const short = total < PLAN_TOTAL ? ` Подходящих товаров на ${PLAN_TOTAL} Reels не хватило.` : '';
  return [`НОВЫЙ КОНТЕНТ-ПЛАН: ${total} Reels на неделю, только основной ассортимент.${short}`, ...result.plan.map(planLine)];
}

const RULES_LINES = [
  'КАК Я СЧИТАЮ',
  '• Цвет строки: жёлтый и красный это акция, все остальные цвета это основной ассортимент. Они считаются отдельно.',
  '• Продано беру из колонок продаж (они записаны по неделям), остаток из колонки «остаток», это остаток на дату последней записи.',
  '• Reels: каждая заполненная ячейка в блоке «ДАТА ВЫЛОЖЕННОГО КОНТЕНТА» это один опубликованный Reels. Колонки постов не считаю.',
  '• В план идут товары основного ассортимента, которые есть в наличии, кроме кандидатов на скидку. Сначала те, что лучше продаются, при равенстве те, где меньше Reels, потом где больше остаток. Не больше 3 Reels на товар.',
];

function headerLines(result: AnalysisResult): string[] {
  return [`Анализ таблицы «отчет». Период: ${result.periodText}. Остаток: ${result.stockLabel}.`, ...result.notes];
}

/** Writes the analysis as plain text for Telegram, section by section. */
export function formatAnalysis(result: AnalysisResult): string {
  const style = { hasSales: result.hasSales, weakMax: result.weakMax, windowed: result.windowed };
  return [
    headerLines(result),
    promoLines({ group: result.promo, style }),
    mainLines({ group: result.main, style }),
    candidateLines(result),
    planLines(result),
    RULES_LINES,
  ]
    .filter((section) => section.length > 0)
    .map((section) => section.join('\n'))
    .join('\n\n');
}
