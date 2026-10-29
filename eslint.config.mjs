import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import comments from '@eslint-community/eslint-plugin-eslint-comments';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';

import { fileNames } from './tools/fileNames.mjs';
import { moduleBoundary } from './tools/moduleBoundary.mjs';

// The project is new and has no old debt. Each rule is an error. See docs/rules/README.md.
const ERROR = 'error';

// Modules: a module imports another module only through its index file. See docs/rules/module-boundaries.md.
const MODULES_DIR = 'src/modules';
// Aliases: `@/` is `src/`. Keep it equal to `paths` in tsconfig.json. See docs/rules/alias-imports.md.
const PATH_ALIASES = { '@/': `${import.meta.dirname}/src/` };

// Every custom message tells what is allowed and points to its rule file.
const see = (file) => `See docs/rules/${file}.md`;
const UTILITY = '/^(Partial|Required|Readonly|Pick|Omit)$/';
// All built-in utility types of TypeScript except the five allowed ones.
const OTHER_UTILITY =
  '/^(Awaited|Capitalize|ConstructorParameters|Exclude|Extract|InstanceType|Lowercase|NonNullable|NoInfer|OmitThisParameter|Parameters|Record|ReturnType|ThisParameterType|ThisType|Uncapitalize|Uppercase)$/';

// Names. camelCase: 2 or 3 words (1 to 3 for a local variable). PascalCase component: 1 to 3 words.
const SHORT_NAMES = ['id', 'url', 'index', 'error'];
const WORD = '(?:[A-Z]+(?![a-z])|[A-Z][a-z0-9]*)';
const CAMEL_STRICT = `[a-z][a-z0-9]*(?:${WORD}){1,2}`;
const CAMEL_LOCAL = `[a-z][a-z0-9]*(?:${WORD}){0,2}`;
const PASCAL = '[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*){0,2}';
const UPPER_CONST = '[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,2}';
const STRICT_NAME = `^(?:${SHORT_NAMES.join('|')}|${CAMEL_STRICT}|${PASCAL}|${UPPER_CONST})$`;
const LOCAL_NAME = `^(?:${SHORT_NAMES.join('|')}|${CAMEL_LOCAL}|${PASCAL}|${UPPER_CONST})$`;
const nameRule = (regex) => ({ format: null, leadingUnderscore: 'allow', custom: { regex, match: true } });

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'tools/**'] },
  {
    // Exceptions: a disable comment that disables nothing is debt.
    linterOptions: { reportUnusedDisableDirectives: ERROR },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    plugins: {
      local: fileNames,
      boundary: moduleBoundary,
      'import-x': importX,
      '@eslint-community/eslint-comments': comments,
    },
    settings: {
      // Without the TypeScript extensions and parser, import-x cannot follow .ts files. Then it finds no cycles.
      'import-x/extensions': importX.flatConfigs.typescript.settings['import-x/extensions'],
      'import-x/parsers': importX.flatConfigs.typescript.settings['import-x/parsers'],
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    // Type-aware rules need the tsconfig.json of the project.
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Type-aware rules. They find async bugs.
      '@typescript-eslint/no-floating-promises': ERROR,
      '@typescript-eslint/no-misused-promises': ERROR,
      '@typescript-eslint/await-thenable': ERROR,
      '@typescript-eslint/switch-exhaustiveness-check': [ERROR, { considerDefaultExhaustiveForUnions: true }],

      // Architecture.
      'import-x/no-cycle': [ERROR, { ignoreExternal: true }],
      'boundary/module-boundary': [ERROR, { modulesDir: MODULES_DIR, aliases: PATH_ALIASES }],
      'import-x/order': [
        ERROR,
        {
          groups: [['builtin', 'external'], 'type', ['internal', 'parent', 'sibling', 'index']],
          'newlines-between': 'always',
        },
      ],
      'no-restricted-imports': [
        ERROR,
        {
          patterns: [
            { group: ['..', '../**'], message: `Allowed: '@/' for other folders, './' for the same folder. ${see('alias-imports')}` },
          ],
        },
      ],
      'no-restricted-properties': [
        ERROR,
        {
          object: 'process',
          property: 'env',
          message: `Allowed: import appEnv from '@/config/appEnv'. ${see('env-config')}`,
        },
      ],

      // Exceptions need a rule name and a reason.
      '@eslint-community/eslint-comments/require-description': [ERROR, { ignore: [] }],
      '@eslint-community/eslint-comments/no-unlimited-disable': ERROR,
      '@eslint-community/eslint-comments/disable-enable-pair': ERROR,
      '@typescript-eslint/ban-ts-comment': [
        ERROR,
        { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true, 'ts-nocheck': true, minimumDescriptionLength: 10 },
      ],

      // Security defects.
      'no-eval': ERROR,
      'no-implied-eval': ERROR,
      'no-new-func': ERROR,

      // Style rules. tools/eslint-formatter.mjs adds the hint and the link.
      'max-lines': [ERROR, { max: 250, skipBlankLines: true, skipComments: true }],
      'max-params': [ERROR, 3],
      complexity: [ERROR, 7],
      'id-denylist': [ERROR, 'handler', 'handle', 'process', 'data', 'temp'],
      '@typescript-eslint/naming-convention': [
        ERROR,
        { selector: 'variable', modifiers: ['destructured'], format: null },
        { selector: ['function', 'method'], ...nameRule(STRICT_NAME) },
        { selector: 'variable', modifiers: ['global'], ...nameRule(STRICT_NAME) },
        { selector: ['variable', 'parameter'], ...nameRule(LOCAL_NAME) },
      ],
      '@typescript-eslint/no-explicit-any': ERROR,
      '@typescript-eslint/no-non-null-assertion': ERROR,
      '@typescript-eslint/consistent-type-definitions': [ERROR, 'type'],
      '@typescript-eslint/explicit-module-boundary-types': ERROR,
      'no-empty': [ERROR, { allowEmptyCatch: false }],
      'no-console': ERROR,
      'local/file-name-words': ERROR,

      // Custom message with the hint and the link.
      'no-restricted-syntax': [
        ERROR,
        {
          selector: 'IfStatement[alternate]',
          message: `Allowed: if without else, switch, ternary. Use an early return. ${see('early-return')}`,
        },
        {
          selector: 'SwitchStatement[cases.length>10]',
          message: `Allowed: switch with 10 cases or fewer. Use a Map for more. ${see('map-for-many-cases')}`,
        },
        {
          selector: 'CallExpression[callee.property.name=/^(then|catch|finally)$/]',
          message: `Allowed: async, await, try, catch. ${see('async-await')}`,
        },
        {
          selector: 'ExportDefaultDeclaration',
          message: `Allowed: export function, export const, export type. ${see('named-exports')}`,
        },
        {
          selector: `TSTypeReference[typeName.name=${OTHER_UTILITY}]`,
          message: `Allowed: Partial, Required, Readonly, Pick, Omit. Write the type by hand. ${see('allowed-utility-types')}`,
        },
        {
          selector: `TSTypeReference[typeName.name=${UTILITY}] TSTypeReference[typeName.name=${UTILITY}]`,
          message: `Allowed: one utility type layer. Write the shape by hand. ${see('single-utility-layer')}`,
        },
        {
          selector: 'TSConditionalType, TSMappedType, TSTemplateLiteralType',
          message: `Allowed: object types, primitives, arrays, literal unions. ${see('plain-types')}`,
        },
        {
          selector: 'TSEnumDeclaration',
          message: `Allowed: a union of string literals. ${see('plain-types')}`,
        },
        {
          selector: "TSAsExpression:not([typeAnnotation.typeName.name='const'])",
          message: `Allowed: unknown with a check, as const. ${see('unknown-type')}`,
        },
        {
          selector: 'ExportAllDeclaration',
          message: `Allowed: export { name } from './file'. ${see('module-boundaries')}`,
        },
        {
          selector: 'TSIntersectionType',
          message: `Allowed: one type with all fields. ${see('single-object-type')}`,
        },
      ],
    },
  },
  {
    // The only file that reads process.env. See docs/rules/env-config.md
    files: ['src/config/appEnv.ts'],
    // `process` is on the id-denylist, but this file must read process.env.
    rules: { 'no-restricted-properties': 'off', 'id-denylist': 'off' },
  },
  {
    // Tests: allow long files and console
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines': 'off',
      'no-console': 'off',
    },
  },
  {
    // Tool config files: Node.js globals, default export is fine
    files: ['*.config.js', '*.config.mjs', '*.config.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
