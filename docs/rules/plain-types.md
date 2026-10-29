# plain-types

**Level:** Error. The build stops.

**Allowed:** Object types, primitives, arrays, unions of primitives or string literals, and the generic types `Promise`, `Map`, and `Set`. Do not use anything else. Use a union of string literals in place of `enum`.

**Reason:** Conditional, mapped, and template literal types are a small programming language inside the type system. The reader must run them in the head. A concrete type shows the result at once.

**Check:** The linter finds conditional, mapped, and template literal types, and `enum`. The reviewer checks `keyof` and `typeof` in types.
