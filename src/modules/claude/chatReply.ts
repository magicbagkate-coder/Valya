import type { Hints } from '@/modules/report';

/** What Claude said, and the labels that it saved with the tool. */
export type ChatReply = { text: string; labels: Hints };
