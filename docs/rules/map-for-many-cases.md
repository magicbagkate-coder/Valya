# map-for-many-cases

**Level:** Error. The build stops.

**Allowed:** A `switch` with 10 cases or fewer. A `Map` for more than 10 cases on one value. Do not use anything else.

**Reason:** A long `switch` is a lookup table. A `Map` is shorter. It keeps the data apart from the logic.

**Good**
```ts
const titles = new Map<Status, string>([
  ['active', 'Active'],
  ['blocked', 'Blocked'],
]);
```
