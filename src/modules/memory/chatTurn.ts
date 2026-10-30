/** One message of a talk: from the user or from the assistant. */
export type ChatTurn = { role: 'user' | 'assistant'; content: string };
