import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// Claude Code hook (PostToolUse). It runs after each Edit or Write.
// It fixes what ESLint can fix. If errors stay, it exits with code 2 and Claude sees the text.
const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path;
if (!file || !/\.ts$/.test(file)) process.exit(0);

const root = path.resolve(import.meta.dirname, '..');
const relative = path.relative(root, file);
if (relative.startsWith('..') || relative.startsWith('dist')) process.exit(0);

const run = spawnSync('npx', ['eslint', '-f', './tools/eslint-formatter.mjs', '--fix', relative], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
});
if (run.status === 0) process.exit(0);

console.error(`Linter errors in ${relative}. Fix them. Each message gives the rule file.\n${run.stdout}${run.stderr}`);
process.exit(2);
