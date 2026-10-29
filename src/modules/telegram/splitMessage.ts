const MAX_LENGTH = 3800;

/** Splits a long text by lines into parts that Telegram accepts (4096 characters at most). */
export function splitMessage(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (current !== '' && current.length + line.length + 1 > MAX_LENGTH) {
      parts.push(current);
      current = '';
    }
    current = current === '' ? line.slice(0, MAX_LENGTH) : `${current}\n${line.slice(0, MAX_LENGTH)}`;
  }
  if (current !== '') parts.push(current);
  return parts;
}
