# Changelog

## 2026-10-26
- Add the rule `naming-vocabulary`: verbs by the direction of the data, nouns of the product, the prefix `smart`, and folders by direction.
- Count a group of capital letters in a row as one word in a name. `getAIAds` now has 3 words. See `docs/rules/purpose-names.md`.
- Allow 1 to 3 words in a file name. The rule was 1 or 2 words. See `docs/rules/file-names.md`.
- Add a debt baseline. `npm run lint:ci` stops the build on new hits only. See `docs/rules/debt-baseline.md`.
- Add type-aware rules for promises and for `switch` on a union.
- Add a policy for exceptions. A disable comment needs a rule name and a reason.
- Add architecture rules: layers, module boundaries, no import cycles, import order.
- Split the rules into two levels: defects (always errors) and style (technical debt).
- Fix false hits: PascalCase components, role suffixes in file names, Vale passive voice and "May".

## 2026-10-25
- First version: rule files in `docs/rules/`, ESLint config, formatter with links, Vale style for STE.
