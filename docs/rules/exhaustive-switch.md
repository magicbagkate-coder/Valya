# exhaustive-switch

**Level:** Error. The build stops.

**Allowed:** A `switch` on a union with a `case` for each member, or with a `default`. Do not use anything else.

**Reason:** When a person adds a member to the union, the linter shows each `switch` that must change. Without the check, the new member goes to no branch.

**Good**
```ts
type Status = 'active' | 'blocked';

switch (status) {
  case 'active':
    return 'Active';
  case 'blocked':
    return 'Blocked';
}
```
