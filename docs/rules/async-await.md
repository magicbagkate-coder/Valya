# async-await

**Level:** Error. The build stops.

**Allowed:** `async` functions, `await`, and `try` with `catch`. Do not use anything else to work with an asynchronous result.

**Reason:** The project has one style of error handling. A chain of promise methods hides the order of the work.

**Good**
```ts
const response = await fetch(url);
const body = await response.json();
```
