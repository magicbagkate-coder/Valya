import type { ChatImage } from '@/modules/claude';

const IMAGE_TYPES = new Map<string, ChatImage['mediaType']>([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
]);

/** Gives the picture type of a file name, or nothing if the file is not a picture that Claude can see. */
export function imageType(name: string): ChatImage['mediaType'] | undefined {
  return IMAGE_TYPES.get(name.split('.').pop()?.toLowerCase() ?? '');
}
