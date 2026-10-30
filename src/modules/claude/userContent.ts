import type Anthropic from '@anthropic-ai/sdk';
import type { StoredFile } from '@/modules/memory';

/** Builds the content of the user message. If the chat has a data file, it goes into the code sandbox with the message. */
export function userContent(text: string, file: StoredFile | undefined): Anthropic.Messages.MessageParam['content'] {
  if (!file) return text;
  return [
    { type: 'container_upload', file_id: file.id },
    { type: 'text', text },
  ];
}
