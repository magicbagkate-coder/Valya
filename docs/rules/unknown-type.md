# unknown-type

**Level:** Error. The build stops.

**Allowed:** Concrete types, `unknown` with a check before use, and `as const`. Do not use anything else. This includes `any`, a cast with `as`, and the `!` operator.

**Reason:** `unknown` forces a check at the boundary. A cast and `!` skip the check. The type checker stays active in the rest of the code.

**Good**
```ts
function parse(input: unknown): string {
  if (typeof input !== 'string') throw new Error('Expected string');
  return input;
}
```
