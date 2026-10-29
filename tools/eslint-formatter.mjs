import { ESLint } from 'eslint';
import { STRICT_RULES } from './strictRules.mjs';

// Built-in rules cannot carry a custom message.
// This formatter adds the allowed thing and the rule file to their messages.
const RULE_DOCS = {
  'max-lines': { file: 'short-files', hint: 'Allowed: 250 lines or fewer. Split by task.' },
  'max-params': { file: 'one-object-parameter', hint: 'Allowed: 3 parameters or fewer. Use one object.' },
  complexity: { file: 'simple-functions', hint: 'Allowed: 4 branch points. Use a named function.' },
  'id-denylist': { file: 'purpose-names', hint: 'Allowed: 2 or 3 words that tell the purpose.' },
  '@typescript-eslint/naming-convention': {
    file: 'purpose-names',
    hint: 'Allowed: camelCase of 2 or 3 words, PascalCase component of 1 to 3 words, id, url, index, error.',
    rewrite: (text) => `Name '${(text.match(/`([^`]+)`/) ?? [])[1] ?? ''}' is not allowed.`,
  },
  'no-empty': { file: 'handle-errors', hint: 'Allowed: handle, log, or throw the error.' },
  'no-console': { file: 'project-logger', hint: 'Allowed: the project logger.' },
  '@typescript-eslint/no-explicit-any': { file: 'unknown-type', hint: 'Allowed: concrete types and unknown.' },
  '@typescript-eslint/no-non-null-assertion': { file: 'unknown-type', hint: 'Allowed: a check for null.' },
  '@typescript-eslint/consistent-type-definitions': { file: 'type-aliases', hint: 'Allowed: type.' },
  '@typescript-eslint/explicit-module-boundary-types': { file: 'explicit-return-types', hint: 'Allowed: a written return type.' },
  '@typescript-eslint/no-floating-promises': { file: 'promise-handling', hint: 'Allowed: await, return, or void with a reason.' },
  '@typescript-eslint/no-misused-promises': { file: 'promise-handling', hint: 'Allowed: await the promise before you use the result.' },
  '@typescript-eslint/await-thenable': { file: 'promise-handling', hint: 'Allowed: await a promise only.' },
  '@typescript-eslint/switch-exhaustiveness-check': { file: 'exhaustive-switch', hint: 'Allowed: a case for each union member, or default.' },
  'import-x/no-cycle': { file: 'acyclic-imports', hint: 'Allowed: imports in one direction. Move the shared part to a third file.' },
  'import-x/order': { file: 'import-order', hint: 'Allowed: packages, types, local files. A blank line between groups.' },
  '@eslint-community/eslint-comments/require-description': { file: 'rule-exceptions', hint: 'Allowed: a disable comment with -- and a reason.' },
  '@eslint-community/eslint-comments/no-unlimited-disable': { file: 'rule-exceptions', hint: 'Allowed: a disable comment with a rule name.' },
  '@eslint-community/eslint-comments/disable-enable-pair': { file: 'rule-exceptions', hint: 'Allowed: eslint-disable-next-line.' },
  '@typescript-eslint/ban-ts-comment': { file: 'rule-exceptions', hint: 'Allowed: @ts-expect-error with a reason.' },
};
// An unused disable comment has no rule id.
const UNUSED_DIRECTIVE = { file: 'rule-exceptions', hint: 'Allowed: a disable comment for a real hit. Delete this one.' };

const docFor = (message) => {
  if (message.ruleId) return RULE_DOCS[message.ruleId];
  if (message.message.startsWith('Unused eslint-disable')) return UNUSED_DIRECTIVE;
  return undefined;
};

export default async function format(results, context) {
  for (const result of results) {
    for (const message of result.messages) {
      if (message.message.includes('See docs/rules/')) continue;
      if (STRICT_RULES.has(message.ruleId)) {
        message.message += ' Defect. See docs/rules/strict-errors.md';
        continue;
      }
      const doc = docFor(message);
      if (!doc) continue;
      const text = doc.rewrite ? doc.rewrite(message.message) : message.message;
      message.message = `${text} ${doc.hint} See docs/rules/${doc.file}.md`;
    }
  }
  const stylish = await new ESLint().loadFormatter('stylish');
  return stylish.format(results, context);
}
