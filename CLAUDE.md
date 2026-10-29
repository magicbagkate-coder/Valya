# Project: NestJS agent

Stack: Node.js, NestJS, TypeScript. No database. Settings come from `.env` through `dotenv`.

## Rules
- Read `docs/rules/README.md` before you write code. Each rule has one file in `docs/rules/`.
- Use only the things that the rule lists as allowed.
- Import with the alias `@/` (it is `src/`). Do not use `../`.
- Read `process.env` in `src/config/appEnv.ts` only. Add each new variable to `.env.example`.
- Put each feature in `src/modules/<name>/`. Other modules import it only through its `index.ts`.
- Write code, comments, and commit messages in English (STE).

## Checks
- A hook runs ESLint with `--fix` after each edit of a `.ts` file. Fix each error that stays.
- Before you finish a task, run `npm run check`. It runs typecheck, lint, and the tool tests.
- Do not turn off a rule. If a rule is wrong for one line, use `eslint-disable-next-line <rule> -- <reason>`.
- Never commit `.env`.

## Commands
- `npm run start:dev` - Starts the server with reload.
- `npm run build` - Builds to `dist/`.
- `npm run lint:fix` - Fixes what the linter can fix and shows the rest.
- `npm run check` - Typecheck, lint, and tests of the lint tools.
