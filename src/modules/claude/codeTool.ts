import type Anthropic from '@anthropic-ai/sdk';

/**
 * The code sandbox of Anthropic. Claude writes and runs Python there, so a sum, a top, or a comparison
 * over a big table is exact and not a guess. The sandbox has no access to our server.
 */
export const CODE_TOOL: Anthropic.Messages.CodeExecutionTool20250825 = {
  name: 'code_execution',
  type: 'code_execution_20250825',
};
