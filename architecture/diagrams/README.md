# Diagrams

## Phase 0 package graph

```mermaid
flowchart LR
  schemas[packages/schemas<br/>configuration contracts]
  core[packages/core<br/>validation and diagnostics]
  cli[apps/cli<br/>terminal interface]
  framework[packages/framework<br/>reusable content]
  website[apps/website<br/>static site]

  schemas --> core
  core --> cli
  framework -.-> core
  framework -.-> cli
  website -.-> framework
```

Solid arrows are runtime package dependencies. Dotted arrows mean content is
consumed without importing the CLI runtime. The framework must not depend on
the CLI.

## Configuration flow

```mermaid
flowchart TD
  file[.vahu/project.json] --> schema[Zod schema]
  schema -->|valid| readiness[Readiness rules]
  schema -->|invalid| errors[Actionable validation errors]
  readiness -->|blocking| errors
  readiness -->|warnings| report[Validation report]
  readiness -->|ready| report
```

The schema checks structure. Readiness checks relationships such as “a UI project
must have an approved design system.”
