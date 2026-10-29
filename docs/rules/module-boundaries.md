# module-boundaries

**Level:** Error. The build stops.

**Allowed:**
- A file in one module imports another module only through its `index.ts`.
- `index.ts` exports each public entity by name: `export { findUser } from './findUser';`.

Do not use anything else.

**Reason:** `index.ts` is the public contract of the module. Other files in the module are private. You can change them, and other modules do not break. An export with `*` hides the contract. It can also export a private entity by accident.

**Good**
```ts
import { findUser } from '../user';
```

**Setup:** Set `MODULES_DIR` and `PATH_ALIASES` in `eslint.config.js`. The tests are in `tools/moduleBoundary.test.js`.
