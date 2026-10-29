# doc-jsdoc-public-api

**Level:** Review. The linter cannot check this rule.

**Allowed:** A JSDoc comment on each public function, class, and type. It tells what the code does, what it returns, and when it throws an error. Do not use anything else for the public API.

**Reason:** The caller reads the contract, not the code. Without JSDoc, the caller must read the body.

**Good**
```ts
/**
 * Finds a user by id.
 * @returns The user, or `undefined` if no user has this id.
 */
export function findUser(users: User[], id: string): User | undefined { /* ... */ }
```

**Note:** Write the JSDoc text in STE. See [language-ste](language-ste.md).
