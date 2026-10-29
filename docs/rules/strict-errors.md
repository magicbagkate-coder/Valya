# strict-errors

**Level:** Error. The build stops.

**Allowed in the error level:** Rules where each hit is a real defect. Each rule has no style opinion. Each rule gives no false positives in new code and in old code. Do not add other rules to this level.

**Reason:** An error must always mean a bug. If an error can be wrong, people turn the linter off. Then the linter finds nothing.

## Rules in the error level
- Code that never runs: `no-unreachable`, `no-unsafe-finally`, `for-direction`.
- Duplicates that hide a value: `no-dupe-keys`, `no-duplicate-case`, `no-dupe-else-if`, `no-dupe-class-members`, `no-dupe-args`, `@typescript-eslint/no-duplicate-enum-values`.
- Wrong comparisons: `use-isnan`, `valid-typeof`, `no-compare-neg-zero`, `no-constant-binary-expression`, `no-unsafe-negation`.
- Writes to values that cannot change: `no-const-assign`, `no-import-assign`, `no-func-assign`, `no-class-assign`, `no-global-assign`, `no-self-assign`, `no-ex-assign`.
- Wrong regular expressions: `no-invalid-regexp`, `no-empty-character-class`, `no-misleading-character-class`, `no-useless-backreference`.
- Wrong class and function structure: `constructor-super`, `no-this-before-super`, `getter-return`, `no-setter-return`, `require-yield`, `no-async-promise-executor`, `no-obj-calls`, `no-new-native-nonconstructor`, `@typescript-eslint/no-misused-new`, `@typescript-eslint/no-unsafe-declaration-merging`.
- Other defects: `no-cond-assign`, `no-sparse-arrays`, `no-unexpected-multiline`, `no-unsafe-optional-chaining`, `no-loss-of-precision`, `no-debugger`, `@typescript-eslint/no-extra-non-null-assertion`, `@typescript-eslint/no-non-null-asserted-optional-chain`.
- Security: `no-eval`, `no-implied-eval`, `no-new-func`.

## Defects that TypeScript finds
In `.ts` files, the TypeScript compiler finds some defects in place of ESLint. Examples are duplicate keys and code that never runs. The TypeScript preset turns these ESLint rules off.

Run `npm run typecheck` with the linter. Set `"allowUnreachableCode": false` in `tsconfig.json`. Then code that never runs is an error.

## Add a rule to this level
Add a rule only if each hit is a bug. Run the rule on a real project first. If one hit is not a bug, keep the rule in the warning level.
