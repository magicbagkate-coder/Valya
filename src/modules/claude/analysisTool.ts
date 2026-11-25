/**
 * The tool that lets Claude start the analysis of the Google table. The code reads the table and counts; Claude gets no numbers from it.
 * The time frame is optional: "from" and "to" are days written "YYYY-MM-DD" (Kyiv dates, both included).
 */
export const ANALYZE_TOOL = {
  name: 'analyze_table',
  description:
    'Run the analysis of the Google table: promo products (yellow and red rows) and the main assortment, sales, stock, published Reels, discount candidates, and the content plan for 70 Reels. Use it when the user asks to analyze the table, to make the content plan, or to find products for a discount. If the user names a time frame ("за последние 7 дней", "за вчера", "за месяц", "за полгода", "с 1 по 15 ноября"), give it in from and to, counted from today. Without a time frame leave from and to empty. Put the question of the user in question, in the words of the user, when the user asks something about the table (for example how many products are planned or shot, what sells, what is in stock); the code reads the table again each time and the answer comes from the exact numbers. The code sends the full report to the chat itself.',
  input_schema: {
    type: 'object' as const,
    properties: {
      from: { type: 'string', description: 'First day of the time frame, "YYYY-MM-DD". Leave out when the user names no time frame.' },
      to: { type: 'string', description: 'Last day of the time frame, "YYYY-MM-DD", included. Leave out for "until today".' },
      question: { type: 'string', description: 'The question of the user about the table, in the words of the user. Leave out for a plain request to analyze.' },
    },
  },
};
