import type Anthropic from '@anthropic-ai/sdk';
import type { StoredFile } from '@/modules/memory';
import type { ChatImage } from './chatImage';

/** Builds the content of the user message. A data file goes into the code sandbox, a picture goes to the eyes of Claude, both with the text. */
export function userContent(text: string, file: StoredFile | undefined, image: ChatImage | undefined): Anthropic.Messages.MessageParam['content'] {
  if (!file && !image) return text;
  const blocks: Anthropic.Messages.ContentBlockParam[] = [];
  if (file) blocks.push({ type: 'container_upload', file_id: file.id });
  // eslint-disable-next-line id-denylist -- "data" is the field name that the Anthropic API requires
  if (image) blocks.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
  blocks.push({ type: 'text', text });
  return blocks;
}
