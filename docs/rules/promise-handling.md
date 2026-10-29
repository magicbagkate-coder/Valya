# promise-handling

**Level:** Error. The build stops.

**Allowed:** `await` for each promise, `return` of the promise, or `void` with a comment that gives the reason. Use `await` on a promise only. Do not use anything else.

**Reason:** A promise without `await` loses its error. In Node.js, an unhandled rejection can stop the process. A promise in an `if` check is always true. These are frequent async bugs.

**Good**
```ts
await saveOrder(order);

// Fire and forget: the metric is not critical.
void sendMetric('order.saved');
```

**Check:** These rules need type information. The project must have a `tsconfig.json` that includes the file.
