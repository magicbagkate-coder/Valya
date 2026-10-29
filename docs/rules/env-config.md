# env-config

**Level:** Error. The build stops.

**Allowed:** Read `process.env` in `src/config/appEnv.ts` only. Other files import `appEnv`. Do not use anything else.

**Reason:** One file shows all settings of the project. It checks each value at start. A missing value stops the start with a clear message. A value never becomes `undefined` deep in the code.

**Good**
```ts
import { appEnv } from '@/config/appEnv';

const port = appEnv.port;
```

**Setup:** `dotenv` loads `.env` in `src/main.ts`. Add each new variable to `.env.example`. Do not commit `.env`. See `.gitignore`.
