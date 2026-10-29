# allowed-utility-types

**Level:** Error. The build stops.

**Allowed:** The utility types `Partial`, `Required`, `Readonly`, `Pick`, and `Omit`. Unions of primitives or string literals. Index signatures. Do not use anything else. Write each other type by hand.

**Reason:** The reader knows these five types at once. Other utility types need decoding. A hand-written type is clearer and easier to change.

**Good**
```ts
type Dictionary = { [key: string]: string };
type Color = 'red' | 'green';
```

**Check:** The linter blocks each other built-in utility type of TypeScript.
