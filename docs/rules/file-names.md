# file-names

**Level:** Error. The build stops.

**Allowed:** A file name of 1 to 3 words, for example `user.ts`, `userCard.ts`, `userProfileCard.ts`, or `user-profile.controller.ts`. Only the part before the first dot counts. Role suffixes such as `.controller`, `.service`, `.test`, and `.d` do not count. Do not use anything else.

**Reason:** A reader finds and says a short file name at once. A file with a long name usually does more than one task. Split the file.

**Check:** The linter counts the words before the first dot. A word starts at a capital letter after a lowercase letter or a digit, and after each `-` or `_`. A group of capital letters in a row is one word. The tests are in `tools/fileNames.test.js`.
