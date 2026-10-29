# acyclic-imports

**Level:** Error. The build stops.

**Allowed:** Imports in one direction. If two files need the same code, move that code to a third file. Both files import the third file. Do not use anything else.

**Reason:** A cycle makes the load order unclear. A value can be `undefined` at start. A cycle also joins two modules into one. Then you cannot change one module alone.
