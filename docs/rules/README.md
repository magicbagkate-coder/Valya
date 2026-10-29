# Code style rules

Each rule has one file. Each linter error ends with the path of its file.

Each rule lists the allowed things. Do not use anything else.

## Levels
- **Error:** Each hit stops the build. The project is new and has no old debt, so all rules are errors. See [strict-errors](strict-errors.md) for the defect rules.
- **Review:** The linter cannot check the rule. The reviewer checks it.

Run `npm run lint:fix` after each change. The linter fixes what it can and shows the rest.

Main goal: KISS. A person can keep 3 or 4 branches in mind. The limits prevent overload. If two solutions are equal, choose the simpler one. Exception: security and authentication code.

The rules for types and security are stronger than KISS.

Write all rule files in Simplified Technical English. See [language-ste](language-ste.md).

## Defects and process
- [strict-errors](strict-errors.md)
- [rule-exceptions](rule-exceptions.md)

## Branches and size
- [early-return](early-return.md)
- [map-for-many-cases](map-for-many-cases.md)
- [one-object-parameter](one-object-parameter.md)
- [simple-functions](simple-functions.md)
- [short-files](short-files.md)

## Async and errors
- [promise-handling](promise-handling.md)
- [async-await](async-await.md)
- [handle-errors](handle-errors.md)
- [project-logger](project-logger.md)

## Architecture
- [alias-imports](alias-imports.md)
- [env-config](env-config.md)
- [module-boundaries](module-boundaries.md)
- [acyclic-imports](acyclic-imports.md)
- [import-order](import-order.md)
- [named-exports](named-exports.md)

## TypeScript
- [unknown-type](unknown-type.md)
- [type-aliases](type-aliases.md)
- [explicit-return-types](explicit-return-types.md)
- [allowed-utility-types](allowed-utility-types.md)
- [single-utility-layer](single-utility-layer.md)
- [plain-types](plain-types.md)
- [single-object-type](single-object-type.md)
- [exhaustive-switch](exhaustive-switch.md)

## Names
- [purpose-names](purpose-names.md)
- [file-names](file-names.md)
- [naming-vocabulary](naming-vocabulary.md)

## Language
- [language-english](language-english.md)
- [language-ste](language-ste.md)

## Documentation
- [doc-jsdoc-public-api](doc-jsdoc-public-api.md)
- [doc-comment-why](doc-comment-why.md)
- [doc-readme-scripts](doc-readme-scripts.md)
- [doc-existing-files](doc-existing-files.md)
- [doc-decision-reason](doc-decision-reason.md)

## Old code
When you change old code, keep the diff small. Follow the style of the nearby code. Do not change an existing `else` or `interface`. New code in the same file follows these rules.

## Add a rule
1. Create `docs/rules/<rule-name>.md`. Write the allowed things, the reason, and an example.
2. Add the rule to `eslint.config.js`. For `no-restricted-syntax`, put `See docs/rules/<rule-name>.md` in the `message`. For other built-in rules, add the rule id to `RULE_DOCS` in `tools/eslint-formatter.js`.
3. Add a link to this index.
