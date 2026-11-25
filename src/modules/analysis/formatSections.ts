import type { AnalysisResult } from './analysisResult';
import type { AnalysisRow } from './analysisRow';
import type { ColorPlan } from './colorPlan';
import type { GroupReport } from './groupReport';
import type { ModelSummary } from './modelSummary';
import type { PlanItem } from './planItem';
import type { Style } from './formatLines';

import { ALT_STOCK_MIN, ENOUGH_REELS, FRESH_REEL_DAYS, LIST_SIZE, LOW_STOCK, PLAN_TOTAL, RUN_OUT_DAYS, RUN_OUT_SOLD, STALE_REEL_DAYS, STOCK_ABOVE } from './analysisRules';
import { listLines, NO_SALES_LINE, reelsLineFor, soldLine, totalsLine, weakText } from './formatLines';

// How many lines the shorter lists of the report show.
const SHORT_LIST = 6;

export function promoLines(job: { group: GroupReport; style: Style }): string[] {
  const { group, style } = job;
  const head = [`АКЦИОННЫЕ ТОВАРЫ (жёлтые и красные строки): ${group.items} позиций`];
  const tail = ['Для акционных товаров я не считаю Reels и не ставлю их в новый план.'];
  if (!style.hasSales) return [...head, `Остаток сейчас: ${group.stock} шт.`, NO_SALES_LINE, ...tail];
  return [
    ...head,
    totalsLine(group),
    ...listLines({ title: `Хорошо продаются (больше ${style.weakMax} шт за период)`, rows: group.best, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({ title: 'Вообще не продаются (0 шт за период, остаток есть), больше всего на складе', rows: group.unsold, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({ title: `Копятся на складе (остаток больше ${STOCK_ABOVE} шт, ${weakText(style.weakMax)})`, rows: group.piling, toLine: soldLine, limit: LIST_SIZE }),
    ...listLines({
      title: 'Продавались, но товар закончился или скоро закончится (повторную закупку по скидочной цене автоматически не советую, сначала проверьте выгоду)',
      rows: group.runningOut,
      toLine: soldLine,
      limit: SHORT_LIST,
    }),
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

export function mainLines(job: { group: GroupReport; style: Style }): string[] {
  const { group, style } = job;
  const toLine = reelsLineFor(style);
  const head = [`ОСНОВНОЙ АССОРТИМЕНТ (все остальные цвета): ${group.items} позиций`];
  if (!style.hasSales) return [...head, `Остаток сейчас: ${group.stock} шт.`, ...reelsTotalLines(job), NO_SALES_LINE];
  return [
    ...head,
    totalsLine(group),
    ...reelsTotalLines(job),
    ...listLines({ title: `Хорошо продаются (больше ${style.weakMax} шт за период)`, rows: group.best, toLine, limit: LIST_SIZE }),
    ...listLines({ title: `Продаются плохо (${weakText(style.weakMax)}, остаток есть), больше всего на складе`, rows: group.weak, toLine, limit: LIST_SIZE }),
  ];
}

const unshotLine = (row: AnalysisRow): string =>
  `• ${row.article} (стр. ${row.line}): остаток ${row.stock}, Reels всего ${row.reels}${row.lastReel ? `, последний ${row.lastReel}` : ''}`;

// What the colors mark as planned for the content, and how much of it was shot in the period.
export function colorPlanLines(plan: ColorPlan): string[] {
  const title = 'ЗАПЛАНИРОВАНО В КОНТЕНТ (цветные строки основного ассортимента, без жёлтых и красных)';
  if (plan.planned === 0) return [`${title}: цветных строк нет, плана по цветам в таблице не вижу.`];
  return [
    `${title}: ${plan.planned} позиций`,
    `Период съёмки: ${plan.shotText}.`,
    `Снято (есть Reels с датой в этом периоде): ${plan.shot} позиций, всего Reels ${plan.shotReels}.`,
    `Осталось не снято: ${plan.unshot.length} позиций.`,
    ...listLines({ title: 'Не снято, больше всего на складе', rows: plan.unshot, toLine: unshotLine, limit: LIST_SIZE }),
  ];
}

// The popular products that will soon be gone: a list for the buyer.
export function runningOutLines(job: { rows: AnalysisRow[]; style: Style }): string[] {
  if (!job.style.hasSales) return [];
  const title = `ХОДОВЫЕ ТОВАРЫ, КОТОРЫХ СКОРО НЕ ХВАТИТ (основной ассортимент, продано от ${RUN_OUT_SOLD} шт, запаса на ${RUN_OUT_DAYS} дней или меньше), список для закупщика`;
  return listLines({ title, rows: job.rows, toLine: soldLine, limit: LIST_SIZE + SHORT_LIST });
}

// Negative sales are returns or corrections. They are not counted as sales.
export function returnsLines(rows: AnalysisRow[]): string[] {
  if (rows.length === 0) return [];
  const total = rows.reduce((sum, row) => sum + row.returns, 0);
  const lines = rows.slice(0, SHORT_LIST).map((row) => `• ${row.article} (стр. ${row.line}): возврат или корректировка ${row.returns} шт`);
  return [`ВОЗВРАТЫ И КОРРЕКТИРОВКИ (отрицательные продажи, в продажи не считаю): ${rows.length} позиций, всего ${total} шт`, ...lines];
}

export function discountLines(result: AnalysisResult): string[] {
  if (!result.hasSales) return ['КАНДИДАТЫ НА СКИДКУ и НОВЫЙ КОНТЕНТ-ПЛАН: нужны продажи, а за этот период их нет. Попроси анализ за неделю и дольше.'];
  const style = { hasSales: result.hasSales, weakMax: result.weakMax, windowed: result.windowed };
  const toLine = reelsLineFor(style);
  const { price, refresh, wait } = result.discount;
  const total = price.length + refresh.length + wait.length;
  return [
    `КАНДИДАТЫ НА НОВУЮ СКИДКУ (основной ассортимент, остаток больше ${STOCK_ABOVE} шт, ${weakText(result.weakMax)}, Reels за всё время не меньше ${ENOUGH_REELS}): ${total}`,
    ...listLines({ title: `А. Проверить цену и протестировать скидку (последний Reels ${FRESH_REEL_DAYS + 1}–${STALE_REEL_DAYS} дней назад)`, rows: price, toLine, limit: SHORT_LIST }),
    ...listLines({ title: `Б. Сначала обновить контент (последний Reels старше ${STALE_REEL_DAYS} дней или без даты); эти товары я ставлю в план Reels`, rows: refresh, toLine, limit: SHORT_LIST }),
    ...listLines({ title: `В. Подождать результата свежих Reels (последний не старше ${FRESH_REEL_DAYS} дней)`, rows: wait, toLine, limit: SHORT_LIST }),
    'Размер скидки не называю: в таблице нет цены и себестоимости. Предлагаю проверить скидку на 2 позициях и сравнить продажи через 1–2 недели.',
  ];
}

// The products that sold but have a stock of 1–2 and no other color with enough stock.
export function lowStockLines(job: { rows: AnalysisRow[]; style: Style }): string[] {
  if (!job.style.hasSales || job.rows.length === 0) return [];
  const title = `ИСКЛЮЧЕНЫ ИЗ ОТДЕЛЬНЫХ REELS (остаток 1–${LOW_STOCK} шт, а в других цветах модели меньше ${ALT_STOCK_MIN} шт)`;
  return [
    ...listLines({ title, rows: job.rows, toLine: soldLine, limit: LIST_SIZE + SHORT_LIST }),
    'Пополнение по таблице я не отслеживаю: лист «ТОП Заказ» это свободный текст, и надёжно связать его с артикулами нельзя. Если эти товары скоро приедут, поставьте их в съёмку вручную.',
  ];
}

const modelLine = (summary: ModelSummary): string => {
  const colors = summary.parts.slice(0, SHORT_LIST).map((part) => `${part.color} ${part.sold}/${part.stock}`);
  return `• ${summary.model}: ${summary.parts.length} цв., продано ${summary.sold}, остаток ${summary.stock}, Reels ${summary.reels} (${colors.join(', ')})`;
};

// The models with several colors. One Reels can show several colors.
export function modelLines(job: { models: ModelSummary[]; style: Style }): string[] {
  if (!job.style.hasSales || job.models.length === 0) return [];
  const shown = job.models.slice(0, LIST_SIZE);
  return [`МОДЕЛИ ЦЕЛИКОМ (несколько цветов, цвет: продано/остаток; один Reels может показывать несколько цветов): ${job.models.length}, первые ${shown.length}`, ...shown.map(modelLine)];
}

const planLine = (item: PlanItem, index: number): string => {
  const trend = item.trend ? ` ${item.trend}` : '';
  const last = item.lastReel ? `, последний ${item.lastReel}` : '';
  const note = item.note ? `. ${item.note}` : '';
  return `${index + 1}. ${item.article} (стр. ${item.line}): ${item.count} Reels, оценка ${item.score}. Продано ${item.sold}${trend}, остаток ${item.stock}, Reels было ${item.reels}${last}${note}`;
};

export function planLines(result: AnalysisResult): string[] {
  if (!result.hasSales) return [];
  const total = result.plan.reduce((sum, item) => sum + item.count, 0);
  const short = total < PLAN_TOTAL ? ` Подходящих товаров на ${PLAN_TOTAL} Reels не хватило.` : '';
  const title = `НОВЫЙ КОНТЕНТ-ПЛАН: ${total} Reels на неделю, только основной ассортимент.${short} Оценка от 0 до 100: спрос, достаточный остаток, мало контента, динамика. Маржа не считается: в таблице нет цены и себестоимости.`;
  return [title, ...result.plan.map(planLine)];
}
