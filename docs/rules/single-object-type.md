# single-object-type

**Level:** Error. The build stops.

**Allowed:** One `type` that lists all fields of the object. Do not use anything else to build an object type.

**Reason:** The reader sees the final shape at once. With an intersection, the reader must combine the parts.

**Good**
```ts
type Admin = { id: string; name: string; permissions: string[] };
```
