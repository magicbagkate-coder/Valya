import type { AnalysisResult } from './analysisResult';

import { colorPlanLines, discountLines, lowStockLines, mainLines, modelLines, planLines, promoLines, returnsLines, runningOutLines } from './formatSections';

const RULES_LINES = [
  'КАК Я СЧИТАЮ',
  '• Цвет строки: жёлтый и красный это акция, все остальные цвета это основной ассортимент. Они считаются отдельно.',
  '• Продано беру из колонок продаж (они записаны по неделям) и показываю каждую неделю и динамику. Отрицательные числа это возвраты, в продажи их не считаю. Остаток из колонки «остаток», это остаток на дату последней записи. Запас в днях это остаток, делённый на продажи за день.',
  '• «Запланировано в контент» это цветные строки основного ассортимента (любой цвет, кроме белого, жёлтого и красного). «Снято» значит, что в блоке дат у строки есть Reels с датой в периоде съёмки. Если период не назван, это последние 7 дней.',
  '• Reels: каждая заполненная ячейка в блоке «ДАТА ВЫЛОЖЕННОГО КОНТЕНТА» это один опубликованный Reels. Колонки постов не считаю.',
  '• Модель: артикул без цвета в конце («M1266-BL COFFEE» и «M1266-BL BLACK» это одна модель).',
  '• В план идут товары основного ассортимента с остатком. Не идут: кандидаты на проверку цены и на ожидание свежих Reels, и товары с остатком 1–2 шт, если в других цветах модели меньше 6 шт. Остальные получают оценку от 0 до 100 (спрос 35, остаток 20, мало контента 25, динамика 15; маржа 5 не считается без цены и себестоимости). Больше оценка, выше в плане. Не больше 3 Reels на товар. Веса стартовые, их надо проверять на результатах.',
];

function headerLines(result: AnalysisResult): string[] {
  return [`Анализ таблицы «отчет». Период: ${result.periodText}. Остаток: ${result.stockLabel}.`, ...result.notes];
}

/** Writes the analysis as plain text for Telegram, section by section. */
export function formatAnalysis(result: AnalysisResult): string {
  const style = { hasSales: result.hasSales, weakMax: result.weakMax, windowed: result.windowed };
  return [
    headerLines(result),
    colorPlanLines(result.colorPlan),
    promoLines({ group: result.promo, style }),
    mainLines({ group: result.main, style }),
    runningOutLines({ rows: result.main.runningOut, style }),
    returnsLines(result.returns),
    discountLines(result),
    lowStockLines({ rows: result.lowStock, style }),
    modelLines({ models: result.models, style }),
    planLines(result),
    RULES_LINES,
  ]
    .filter((section) => section.length > 0)
    .map((section) => section.join('\n'))
    .join('\n\n');
}
