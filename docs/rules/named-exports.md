# named-exports

**Level:** Error. The build stops.

**Allowed:** `export function`, `export const`, and `export type`. One public entity in a file. If the name of the main export has 2 words or fewer, the file name is the same name. Do not use anything else.

**Reason:** A named export has the same name in each file. Rename and search tools work correctly. For the length of a file name, see [file-names](file-names.md).

**Good**
```ts
export function findUser(id: string): User | undefined { /* ... */ }
```

**Exception:** Tool config files (`*.config.js`).
