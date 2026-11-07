# Examples

These are small, inspectable project configurations validated by the actual
CLI test suite. They are not production applications; each keeps readiness
incomplete to make clear that an example is not an adopted project.

| Example                     | Focus                                                          |
| --------------------------- | -------------------------------------------------------------- |
| `minimal-project/`          | Smallest valid backend-only configuration without brand assets |
| `backend-project/`          | Backend with database and testing selections                   |
| `web-project/`              | Web UI with approved design system and brand assets            |
| `mobile-project/`           | Mobile UI with approved design system and pending brand assets |
| `multi-repository-project/` | Documented multi-repository strategy                           |

Run:

```bash
pnpm dev -- validate --path examples/backend-project
pnpm dev -- project inspect --path examples/backend-project
pnpm dev -- profile list
```

The CLI integration suite validates every committed
`examples/*/.vahu/project.json`. Examples demonstrate configuration, not runnable
applications. No multi-agent adapter example is included because provider
adapters are not implemented.
