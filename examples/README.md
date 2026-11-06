# Examples

These are small, inspectable project configurations used to exercise the Phase 0
validator. They are not production applications.

| Example                     | Focus                                            |
| --------------------------- | ------------------------------------------------ |
| `minimal-project/`          | Smallest valid backend-only configuration        |
| `backend-project/`          | Backend with database and testing selections     |
| `web-project/`              | UI project with an approved design system        |
| `mobile-project/`           | Mobile UI project with an approved design system |
| `multi-repository-project/` | Documented multi-repository strategy             |

Run:

```bash
pnpm dev -- validate --path examples/backend-project
```
