# rule-exceptions

**Level:** Error. The build stops.

**Allowed:**
- `// eslint-disable-next-line <rule> -- <reason>` for one line.
- `// @ts-expect-error <reason>` with a reason of 10 characters or more.

Do not use anything else to turn off a check.

**Reason:** Sometimes a rule is wrong for a specific line. An exception with a rule name and a reason is visible in review. A disable comment without a rule name turns off all checks, also the checks for defects.

**Good**
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The library has no types.
const client: any = createClient();
```

**Check:** The linter also finds a disable comment that disables nothing. Delete such a comment.
