// The only file that reads process.env. See docs/rules/env-config.md
const DEFAULT_PORT = 14000;

function readText(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readPort(): number {
  const raw = readText('PORT');
  if (!raw) return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT must be a positive integer. Got '${raw}'.`);
  return port;
}

function readIds(): number[] {
  const list = readText('TELEGRAM_ALLOWED_IDS') ?? '';
  return list
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export const appEnv = {
  port: readPort(),
  telegramToken: readText('TELEGRAM_BOT_TOKEN'),
  anthropicKey: readText('ANTHROPIC_API_KEY'),
  googleKeyPath: readText('GOOGLE_KEY_PATH') ?? './google-key.json',
  sheetId: readText('SHEET_ID'),
  dataDir: readText('DATA_DIR') ?? './data',
  allowedIds: readIds(),
};
