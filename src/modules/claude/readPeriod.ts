import type { AnalysisPeriod } from '@/modules/analysis';

const textOf = (input: object, name: string): string => {
  const value = Reflect.get(input, name);
  return typeof value === 'string' ? value.trim() : '';
};

/** Reads the time frame from the input of the analysis tool. Missing parts are empty texts. */
export function readPeriod(input: unknown): AnalysisPeriod {
  if (typeof input !== 'object' || input === null) return { from: '', to: '' };
  return { from: textOf(input, 'from'), to: textOf(input, 'to') };
}
