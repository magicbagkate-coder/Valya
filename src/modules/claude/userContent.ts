import type Anthropic from '@anthropic-ai/sdk';
import type { StoredFile } from '@/modules/memory';
import type { ChatImage } from './chatImage';

/**
 * Builds the content of the user message. The files (the data file of the chat and the files of the Google table) go into the code sandbox,
 * a picture goes to the eyes of Claude, all of them with the text.
 */
export function userContent(job: { text: string; files: StoredFile[]; image?: ChatImage }): Anthropic.Messages.MessageParam['content'] {
  if (job.files.length === 0 && !job.image) return job.text;
  const blocks: Anthropic.Messages.ContentBlockParam[] = job.files.map((file) => ({ type: 'container_upload', file_id: file.id }));
  // eslint-disable-next-line id-denylist -- "data" is the field name that the Anthropic API requires
  if (job.image) blocks.push({ type: 'image', source: { type: 'base64', media_type: job.image.mediaType, data: job.image.base64 } });
  blocks.push({ type: 'text', text: job.text });
  return blocks;
}
