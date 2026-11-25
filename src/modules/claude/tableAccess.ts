import type { StoredFile } from '@/modules/memory';

/** What Claude gets of the Google table for one message: the files for its code sandbox, and a note that says what they are (or why there are none). */
export type TableAccess = { files: StoredFile[]; note: string };
