# naming-vocabulary

**Level:** Review. The linter does not check this rule. The reviewer checks it. The linter checks only the length of a name. See [purpose-names](purpose-names.md) and [file-names](file-names.md).

**Allowed:** Name a thing by the product concept and by the direction of the data. Do not name it by the technique.

**Verbs.** Choose the verb that shows where the data goes:
- `detect` - data goes from the page, the address, or a message to our code. Examples: `detectTheme`, `detectClick`, `detectFeed`.
- `get` - data goes from a back end to our code. Example: `getAdsAI`.
- `post` - data goes from our code to a back end. Example: `postStatistics`.
- `report` - our code tells the statistics about an event. Examples: `reportClick`, `reportViews`.
- `render` - data goes from our code to the page. Example: `renderAiAds`.
- `check` and `trace` - the orchestrator looks at a state or follows an event. Examples: `checkOwnFeed`, `traceClick`.

**Nouns.** Use the words of the product: `Ads`, `AI`, `Feed`, `Click`, `Theme`, `Signal`, `Div`. Do not use words of the technique in a name, for example `observer`, `queue`, `layer`, or `probe`.

**Prefix.** Use `smart` for a thing that belongs to our module only, for example `smartDiv` and `smartClick`. The prefix prevents a clash with the names of other modules. Write `ads` for the ads of the partner and `AIAds` for our ads.

**Two tiers.**
- The orchestrator names a step by its result, in the past form or as a fact. Examples: `detectedHeight`, `adsIsExist`.
- A worker names the action. Examples: `detectDivHeight`, `detectTheme`.

**Forms.** Use `verb + noun` for an action. Use `noun + Is + state` for a question, for example `adsIsExist`. Use 2 words, and 3 words at most.

**Folders.** Name a folder by the direction of the data: `detected` (in), `api` (to and from a back end), `render` (out to the page), `style`, `type`. Do not make a folder named `utils`, `helpers`, or `services`.

**Files.** One file has one task. The name of the main export is the name of the file, for example `detectTheme.ts` exports `detectTheme`.

**Reason:** A name from the product shows the purpose. A name from the technique shows only how the code works, and it changes when the code changes. One verb for one direction lets the reader know the file from the name.

**Check:** If you cannot choose the verb, the function has more than one task. Split the function.
