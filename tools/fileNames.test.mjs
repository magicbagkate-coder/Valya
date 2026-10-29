import { RuleTester } from 'eslint';
import { fileNames } from './fileNames.mjs';

// Run: node tools/fileNames.test.js. The tester throws an error on each failed case.
const tester = new RuleTester();
const rule = fileNames.rules['file-name-words'];
const code = 'export const userName = 1;';
const invalid = (filename) => ({ code, filename, errors: 1 });

tester.run('file-name-words', rule, {
  valid: [
    'index.ts',
    'user.ts',
    'userCard.ts',
    'UserCard.tsx',
    'user-card.ts',
    'user-profile.controller.ts',
    'next-env.d.ts',
    'userCard.test.ts',
    'vite.config.ts',
    'userProfileCard.ts',
    'user-profile-card.ts',
    'UserProfileCard.tsx',
    'user_profile_card.ts',
  ].map((filename) => ({ code, filename })),
  invalid: ['userProfileCardList.ts', 'user-profile-card-list.ts', 'UserProfileCardList.tsx'].map(invalid),
});

console.log('fileNames: all cases pass');
