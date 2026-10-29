# explicit-return-types

**Level:** Error. The build stops.

**Allowed:** An exported function with the return type written in the code. Do not use anything else.

**Reason:** The return type is part of the public contract. An inferred type changes silently when the body changes.

**Good**
```ts
export function findUser(id: string): User | undefined { /* ... */ }
```
