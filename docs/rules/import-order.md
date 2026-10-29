# import-order

**Level:** Error. The build stops.

**Allowed:** Three groups of imports in this order: packages, types, local files. One blank line between the groups. Do not use anything else.

**Reason:** The reader sees the external dependencies of the file at once. The order does not change from file to file.

**Good**
```ts
import path from 'node:path';

import type { User } from '../types';

import { findUser } from './findUser';
```

**Fix:** Run `npx eslint --fix`. The linter sorts the imports.
