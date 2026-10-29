# type-aliases

**Level:** Error. The build stops.

**Allowed:** `type Name = { ... }` for an object shape. Do not use anything else.

**Reason:** The project has one way to declare a shape. Declaration merging gives no surprises.

**Good**
```ts
type User = { id: string };
```

**Exception:** Keep an existing `interface` in old code. Do not change it.
