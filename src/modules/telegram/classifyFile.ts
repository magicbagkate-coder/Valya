import { detectKind, loadRows } from '@/modules/report';

/** Tells if a file is a 1C file for the table (sales or stock) or any other data file ("other"). */
export async function classifyFile(name: string, buffer: Buffer): Promise<'sales' | 'stock' | 'other'> {
  if (!/\.xlsx$/i.test(name)) return 'other';
  try {
    const kind = detectKind(await loadRows(buffer));
    return kind === 'unknown' ? 'other' : kind;
  } catch {
    return 'other';
  }
}
