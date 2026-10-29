# purpose-names

**Level:** Error. The build stops.

**Allowed:** A name of 2 or 3 words in camelCase for a function, a method, and a top-level variable, for example `saveOrder` or `userNameList`. A name of 1 to 3 words for a local variable and a parameter. A component name of 1 to 3 words in PascalCase, for example `UserCard`. The names `id`, `url`, `index`, and `error` in each place. A constant of 2 or 3 words in UPPER_CASE, for example `MAX_RETRY_COUNT`. Do not use anything else.

**Reason:** The name must tell the reader what the thing does. One general word does not. A name of more than 3 words is hard to read.

**Acronyms:** A group of capital letters in a row is one word. `getAIAds` has 3 words: `get`, `AI`, and `Ads`. Also `userId` and `parseUrl` are good.

**Check:** The linter counts the words in each name. It also blocks these general names in each place: `handler`, `handle`, `process`, `data`, `temp`. The reviewer checks if the name tells the purpose.
