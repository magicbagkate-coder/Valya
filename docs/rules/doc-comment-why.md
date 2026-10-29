# doc-comment-why

**Level:** Review. The linter cannot check this rule.

**Allowed:** A comment that tells why the code does something. Use it only for logic that the reader cannot understand at once. Do not use anything else.

**Reason:** A comment that repeats the code becomes wrong when the code changes. A comment that gives the reason keeps its value.

**Good**
```ts
// The API counts pages from 1, not from 0.
page += 1;
```
