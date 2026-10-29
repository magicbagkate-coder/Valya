import path from 'node:path';

// File names: 1 to 3 words. Only the part before the first dot counts.
// Role suffixes (.controller, .service, .test, .d) do not count.
const MAX_FILE_WORDS = 3;

export function countFileWords(filename) {
  const base = path.basename(filename).split('.')[0];
  return base.split(/[-_]|(?<=[a-z0-9])(?=[A-Z])/).filter(Boolean).length;
}

export const fileNames = {
  rules: {
    'file-name-words': {
      meta: { type: 'suggestion', schema: [] },
      create(context) {
        return {
          Program() {
            const words = countFileWords(context.filename);
            if (words <= MAX_FILE_WORDS) return;
            const base = path.basename(context.filename).split('.')[0];
            context.report({
              loc: { line: 1, column: 0 },
              message: `File name '${base}' has ${words} words. Allowed: 1 to 3 words. See docs/rules/file-names.md`,
            });
          },
        };
      },
    },
  },
};
