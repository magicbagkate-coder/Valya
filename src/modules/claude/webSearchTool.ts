import type Anthropic from '@anthropic-ai/sdk';

/**
 * The web search of Anthropic. Claude uses it when an answer needs fresh facts from the internet (weather, news, prices).
 * It runs on the side of Anthropic, so the bot needs no search key. Each search has a small fee.
 * The API does not accept the country UA, so the location has only the time zone of Kyiv.
 */
export const WEB_SEARCH_TOOL: Anthropic.Messages.WebSearchTool20250305 = {
  name: 'web_search',
  type: 'web_search_20250305',
  max_uses: 5,
  user_location: { type: 'approximate', timezone: 'Europe/Kyiv' },
};
