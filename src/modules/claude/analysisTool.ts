/** The tool that lets Claude start the analysis of the Google table. The code reads the table and counts; Claude gets no numbers from it. */
export const ANALYZE_TOOL = {
  name: 'analyze_table',
  description:
    'Run the analysis of the Google table: promo products (yellow and red rows) and the main assortment, sales, stock, published Reels, discount candidates, and the content plan for 70 Reels. Use it when the user asks to analyze the table, to make the content plan, or to find products for a discount. The code sends the full report to the chat itself.',
  input_schema: {
    type: 'object' as const,
    properties: {},
  },
};
