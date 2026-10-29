# simple-functions

**Level:** Error. The build stops.

**Allowed:** A function with 4 branch points or fewer. A branch point is an `if`, a `switch`, a loop, or a ternary. `&&` and `||` do not count. Do not use anything else.

**Reason:** A person can keep 3 or 4 branches in mind. More branches make the function hard to read.

**How:** Move a branch into a named function. Or use early returns (see [early-return](early-return.md)).

**Note:** The ESLint rule `complexity` counts `&&` and `||`. Its result is only an approximation. The threshold is 7. The level is a warning.
