# project-logger

**Level:** Error. The build stops.

**Allowed:** The project logger for all log messages. `console` only during development and in test files. Do not use anything else.

**Reason:** Debug output in production is noise. It can also show private data. The project logger controls the level and the format.
