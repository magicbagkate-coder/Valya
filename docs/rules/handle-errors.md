# handle-errors

**Level:** Error. The build stops.

**Allowed:** In a `catch` block, handle the error, log it, or throw it again. Do not use anything else.

**Reason:** A `catch` block with no action hides a failure. The bug appears later, far from its cause.

**Good**
```ts
try {
  run();
} catch (error) {
  logger.error(error);
  throw error;
}
```
