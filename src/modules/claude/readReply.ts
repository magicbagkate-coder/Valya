import type Anthropic from '@anthropic-ai/sdk';
import type { ChatReply } from './chatReply';

import { cleanLabels } from '@/modules/report';
import { LABEL_TOOL } from './labelTool';

/** Takes the text and the saved labels out of the answer of Claude. */
export function readReply(content: Anthropic.Messages.ContentBlock[]): ChatReply {
  const text = content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim();
  const labels = content.flatMap((block) => (block.type === 'tool_use' && block.name === LABEL_TOOL.name ? [cleanLabels(block.input)] : []));
  return { text, labels: Object.assign({}, ...labels) };
}
