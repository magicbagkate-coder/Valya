import type { AnalysisResult } from './analysisResult';
import type { AnalysisRow } from './analysisRow';
import type { GroupReport } from './groupReport';
import type { PlanItem } from './planItem';

import { CANDIDATE_SIZE, ENOUGH_REELS, LIST_SIZE, PLAN_TOTAL, STOCK_ABOVE, WEAK_SOLD_MAX } from './analysisRules';

const WEAK_TEXT = `продано ${0}–${WEAK_SOLD_MAX} шт за 2 недели`;

const soldLine = (row: AnalysisRow): string => `• ${row.article} (стр. ${row.line}): продано ${row.soldTwo}, остаток ${row.stock}`;
const reelsLine = (row: AnalysisRow): string => `${soldLine(row)}, Reels ${row.reels}${row.lastReel ? `, последний ${row.lastReel}` : ''}`;

type ListJob = { title: string; rows: AnalysisRow[]; toLine: (row: AnalysisRow) => string; limit: number };

// A title with the number of products, and the first ones. An empty list says "нет".
function listLines(job: ListJob): string[] {
  if (job.rows.length === 0) return [`${job.title}: нет.`];
  const shown = job.rows.length > job.limit ? `, первые ${job.limit}` : '';
  return [`${job.title}: ${job.rows.length}${shown}`, ...job.rows.slice(0, job.limit).map(job.toLine)];
}

const totalsLine = (group: GroupReport): string =>
  `Продано: ${group.soldLast} за последнюю неделю, ${group.soldTwo} за 2 недели. Остаток: ${group.stock} шт.`;

function promoLines(group: GroupReport): string[] {
  return [
    `АКЦИОННЫЕ ТОВАРЫ (жёлтые и красные строки): ${group.items} позиций`,
    totalsLine(group),
    ...listLines({ title: 'Хорошо продаются (больше 1 шт за 2 недели)', rows: group.best, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({ title: 'Вообще не продаются (0 шт за 2 недели, остаток есть), больше всего на складе', rows: group.unsold, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({ title: `Накапливаются на складе (остаток больше ${STOCK_ABOVE} шт, ${WEAK_TEXT})`, rows: group.piling, toLine: soldLine, limit: LIST_SIZE }),
    'Для акционных товаров я не считаю Reels и не ставлю их в новый план.',
  ];
}

function mainLines(group: GroupReport): string[] {
  const average = group.items > 0 ? (group.reels / group.items).toFixed(1) : '0';
  return [
    `ОСНОВНОЙ АССОРТИМЕНТ (все остальные цвета): ${group.items} позиций`,
    totalsLine(group),
    `Reels опубликовано: ${group.reels} (в среднем ${average} на позицию). Позиций без единого Reels: ${group.noReels}.`,
    'Плана Reels в таблице нет, поэтому «запланировано» и «не опубликовано» я не считаю.',
    ...listLines({ title: 'Хорошо продаются (больше 1 шт за 2 недели)', rows: group.best, toLine: reelsLine, limit: LIST_SIZE }),
    ...listLines({ title: `Продаются плохо (${WEAK_TEXT}, остаток есть), больше всего на складе`, rows: group.weak, toLine: reelsLine, limit: LIST_SIZE }),
  ];
}

function candidateLines(rows: AnalysisRow[]): string[] {
  const title = `КАНДИДАТЫ НА НОВУЮ СКИДКУ (основной ассортимент, остаток больше ${STOCK_ABOVE} шт, ${WEAK_TEXT}, Reels не меньше ${ENOUGH_REELS})`;
  return listLines({ title, rows, toLine: reelsLine, limit: CANDIDATE_SIZE });
}

const planLine = (item: PlanItem, index: number): string =>
  `${index + 1}. ${item.article} (стр. ${item.line}): ${item.count} Reels. Продано ${item.soldTwo}, остаток ${item.stock}, уже было Reels ${item.reels}`;

function planLines(plan: PlanItem[]): string[] {
  const total = plan.reduce((sum, item) => sum + item.count, 0);
  const short = total < PLAN_TOTAL ? ` Подходящих товаров на ${PLAN_TOTAL} Reels не хватило.` : '';
  return [`НОВЫЙ КОНТЕНТ-ПЛАН: ${total} Reels на неделю, только основной ассортимент.${short}`, ...plan.map(planLine)];
}

const RULES_LINES = [
  'КАК Я СЧИТАЮ',
  '• Цвет строки: жёлтый и красный это акция, все остальные цвета это основной ассортимент. Они считаются отдельно.',
  '• Продано и остаток беру из колонок продаж и колонки «остаток».',
  '• Reels: каждая заполненная ячейка в блоке «ДАТА ВЫЛОЖЕННОГО КОНТЕНТА» это один опубликованный Reels. Колонки постов не считаю.',
  '• В план идут товары основного ассортимента, которые есть в наличии, кроме кандидатов на скидку. Сначала те, что лучше продаются, при равенстве те, где меньше Reels, потом где больше остаток. Не больше 3 Reels на товар.',
];

function headerLine(result: AnalysisResult): string {
  const weeks = result.prevWeekLabel ? `${result.prevWeekLabel} и ${result.lastWeekLabel}` : result.lastWeekLabel;
  return `Анализ таблицы «отчет». Продажи: ${weeks}. Остаток: ${result.stockLabel}.`;
}

/** Writes the analysis as plain text for Telegram, section by section. */
export function formatAnalysis(result: AnalysisResult): string {
  return [
    [headerLine(result)],
    promoLines(result.promo),
    mainLines(result.main),
    candidateLines(result.candidates),
    planLines(result.plan),
    RULES_LINES,
  ]
    .map((section) => section.join('\n'))
    .join('\n\n');
}
