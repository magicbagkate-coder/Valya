# language-ste

**Level:** Error. The build stops.

**Allowed:** Simplified Technical English (ASD-STE100) for documentation, comments, commit messages, and rule files. Do not use anything else.

**Reason:** Short and exact text has one meaning. The reader does not need to guess. People with a different first language understand it.

## Writing rules
- Use 20 words or fewer in an instruction sentence. Use 25 words or fewer in other sentences.
- Write one instruction in one sentence. Start it with a verb.
- Use the active voice. Write "The tool reads the file", not "The file is read by the tool".
- Use the simple present tense for facts.
- Use one word for one thing. Do not change a term in the same document.
- Write a paragraph of 6 sentences or fewer. Give each paragraph one topic.
- Use articles (`a`, `an`, `the`). Do not skip them.
- Write `do not` and not `don't`. Do not use contractions.

## Use these words
- Use `must` for an obligation. Use `can` for a possibility.
- Use `use`, not `utilize`.
- Write `to`, not `in order to`.
- Write `for example`, not `e.g.`. Write `that is`, not `i.e.`.
- Write the full list, not `etc.`.
- Use a plain verb. Delete `please`, `simply`, and `just`.
- Use `simple` and `clear`, not `easy` and `obvious`.

## Check
The Vale style `STE` in `.vale/styles/STE/` checks sentence length, passive voice, and the words in the list above. Run `npm run lint:docs`. The check is an approximation. It is not a full ASD-STE100 check.

## Bad and good
<!-- vale off -->
**Bad:** The configuration file should probably be updated in order to enable the feature.

<!-- vale on -->
**Good:** Update the configuration file. This enables the feature.
