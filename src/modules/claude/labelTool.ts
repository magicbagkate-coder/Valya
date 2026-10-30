/** The tool that lets Claude save the period and the stock date that the user told. */
export const LABEL_TOOL = {
  name: 'set_labels',
  description: 'Save the sales period and the stock date that the user told. Use it only when the user gives them.',
  input_schema: {
    type: 'object' as const,
    properties: {
      period: { type: 'string', description: 'Sales period in the style of the sheet, for example "21-26,10" or "21,10".' },
      stockDate: { type: 'string', description: 'Stock date in the style "29,10".' },
    },
  },
};
