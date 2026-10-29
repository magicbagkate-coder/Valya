# single-utility-layer

**Level:** Error. The build stops.

**Allowed:** One utility type around a plain type. A hand-written type for a more complex shape. 5 derived types or fewer from one base type. Do not use anything else.

**Reason:** A chain of utility types hides the final shape. The reader must work it out step by step.

**Good**
```ts
type Patch = { name?: string; email?: string };
```
