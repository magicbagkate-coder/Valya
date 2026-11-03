import type { Context } from 'grammy';
import type { ChatImage } from '@/modules/claude';

import { imageType } from './imageType';

/** If the message holds a picture sent as a file (for example a PNG), gives its Telegram file id and its type. */
export function documentImage(ctx: Context): { fileId: string; mediaType: ChatImage['mediaType'] } | undefined {
  const document = ctx.message?.document;
  const mediaType = imageType(document?.file_name ?? '');
  return document && mediaType ? { fileId: document.file_id, mediaType } : undefined;
}
