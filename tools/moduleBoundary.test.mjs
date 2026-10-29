import { RuleTester } from 'eslint';
import { moduleBoundary } from './moduleBoundary.mjs';

// Run: node tools/moduleBoundary.test.js. The tester throws an error on each failed case.
const tester = new RuleTester();
const rule = moduleBoundary.rules['module-boundary'];
const filename = '/repo/src/modules/order/orderService.ts';
const aliasOptions = [{ aliases: { '@/': '/repo/src/' } }];
const valid = (code, options = []) => ({ code, filename, options });
const invalid = (code, options = []) => ({ code, filename, options, errors: 1 });

tester.run('module-boundary', rule, {
  valid: [
    valid("import { findUser } from '../user';"),
    valid("import { findUser } from '../user/index';"),
    valid("import { findUser } from '../user/index.ts';"),
    valid("import { orderTotal } from './orderTotal';"),
    valid("import { orderTotal } from './parts/orderTotal';"),
    valid("import { format } from 'date-fns';"),
    valid("import { findUser } from '@/modules/user';", aliasOptions),
    valid("import { appConfig } from '../../config/appConfig';"),
    { code: "import { userRepo } from '../user/userRepo';", filename: '/repo/src/shared/tool.ts' },
  ],
  invalid: [
    invalid("import { userRepo } from '../user/userRepo';"),
    invalid("import { userRepo } from '../user/data/userRepo';"),
    invalid("export { userRepo } from '../user/userRepo';"),
    invalid("export * from '../user/userRepo';"),
    invalid("const repo = import('../user/userRepo');"),
    invalid("import { userRepo } from '@/modules/user/userRepo';", aliasOptions),
  ],
});

console.log('moduleBoundary: all cases pass');
