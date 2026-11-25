import type { AnalyzeRequest } from './analyzeRequest';

const textOf = (input: object, name: string): string => {
  const value = Reflect.get(input, name);
  return typeof value === 'string' ? value.trim() : '';
};

/** Reads the time frame and the question from the input of the analysis tool. Missing parts are empty texts. */
export function readAnalyzeRequest(input: unknown): AnalyzeRequest {
  if (typeof input !== 'object' || input === null) return { from: '', to: '', question: '' };
  return { from: textOf(input, 'from'), to: textOf(input, 'to'), question: textOf(input, 'question') };
}
