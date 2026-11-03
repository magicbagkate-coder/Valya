/** A picture that the user sent: its type and its content in base64. */
export type ChatImage = { mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; base64: string };
