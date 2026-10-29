# early-return

**Level:** Error. The build stops.

**Allowed:** `if` without `else`, `switch`, and the ternary `? :`. Do not use anything else to branch.

**Rule:** Handle each special case first and return at once. The rest of the function is the main path.

**Reason:** Each open branch is one more thing for the reader to remember. An early return keeps the main path flat.

**Good**
```ts
if (user) return user.name;
return 'guest';
```

**Exception:** Keep an existing `else` in old code. Do not change it.
