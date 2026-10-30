import Anthropic from '@anthropic-ai/sdk';

import { appEnv } from '@/config/appEnv';

/** Creates the Anthropic client. Returns nothing if there is no API key, then the bot works without the AI. */
export function createAnthropic(): Anthropic | undefined {
  return appEnv.anthropicKey ? new Anthropic({ apiKey: appEnv.anthropicKey }) : undefined;
}
