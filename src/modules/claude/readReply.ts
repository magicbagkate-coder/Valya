import type Anthropic from '@anthropic-ai/sdk';
import type { ChatReply } from './chatReply';

import { readCancelId, readReminder } from '@/modules/reminder';
import { cleanLabels } from '@/modules/report';
import { LABEL_TOOL } from './labelTool';
import { CANCEL_TOOL, REMINDER_TOOL } from './reminderTool';

function toolInputs(content: Anthropic.Messages.ContentBlock[], toolName: string): unknown[] {
  return content.flatMap((block) => (block.type === 'tool_use' && block.name === toolName ? [block.input] : []));
}

/** Takes the text, the saved labels, and the reminder requests out of the answer of Claude. */
export function readReply(content: Anthropic.Messages.ContentBlock[], now: number): ChatReply {
  const text = content
    .flatMap((block) => (block.type === 'text' ? [block.text] : []))
    .join('')
    .trim();
  const labels = toolInputs(content, LABEL_TOOL.name).map((input) => cleanLabels(input));
  const calls = toolInputs(content, REMINDER_TOOL.name).map((input) => readReminder(input, now));
  const reminders = calls.flatMap((call) => (call ? [call] : []));
  const cancels = toolInputs(content, CANCEL_TOOL.name).flatMap((input) => {
    const id = readCancelId(input);
    return id === undefined ? [] : [id];
  });
  return { text, labels: Object.assign({}, ...labels), reminders, cancels, skipped: calls.length - reminders.length };
}
