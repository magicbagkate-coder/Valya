// The only file that reads process.env. See docs/rules/env-config.md
const DEFAULT_PORT = 14000;

function readPort(): number {
  const raw = process.env.PORT;
  if (!raw) return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port <= 0) throw new Error(`PORT must be a positive integer. Got '${raw}'.`);
  return port;
}

export const appEnv = { port: readPort() };
