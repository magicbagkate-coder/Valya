# one-object-parameter

**Level:** Error. The build stops.

**Allowed:** A function with 3 parameters or fewer. For more data, a function with one object parameter. Do not use anything else.

**Reason:** The reader can swap positional arguments by mistake. The fields of an object have names.

**Good**
```ts
createUser({ name, email, role, team, locale });
```
