# doc-decision-reason

**Level:** Review. The linter cannot check this rule.

**Allowed:** A decision record with three fields: the decision, the reason, and the options that you did not choose. Keep the text short. Do not use anything else for an architecture decision.

**Reason:** The code shows what the system does. It does not show why. Without the reason, the next person cannot know if the decision is still valid.

**Good**
```md
Decision: Use a Map for more than 10 cases.
Reason: A Map keeps data apart from logic.
Rejected: A long switch. It is hard to read.
```
