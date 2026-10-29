# alias-imports

**Level:** Error. The build stops.

**Allowed:** An import from another folder with the alias `@/`, for example `@/modules/health`. An import from the same folder with `./`. Do not use anything else. Do not use `../`.

**Reason:** A path with `../` breaks when you move a file. An alias path stays the same. It also shows the module at once.

**Good**
```ts
import { appEnv } from '@/config/appEnv';
import { buildAnswer } from './buildAnswer';
```

**Setup:** `@/` points to `src/`. See `paths` in `tsconfig.json` and `PATH_ALIASES` in `eslint.config.js`.
