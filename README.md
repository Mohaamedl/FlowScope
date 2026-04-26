# FlowScope

A web platform for comparing, editing, and reviewing BPMN 2.0 process models — with visual diff, XML diff, and live editing.

## Licensing

FlowScope uses a dual licensing model:

### Open Source (AGPLv3)
- Free to use, modify, and distribute
- If used in a SaaS or network application, source code must be disclosed

### Commercial License
- Required for:
  - Proprietary use without AGPL obligations
  - Closed-source SaaS deployments
  - Enterprise integrations

To obtain a commercial license: https://github.com/Mohaamedl

## Features

- **Visual Diff** — side-by-side BPMN diagram comparison with color-coded overlays (green = added, red = removed, yellow = modified)
- **Semantic Diff** — element-level change detection including attributes, conditions, and vendor extensions
- **Search & Filter** — find changed elements by id, name, or type; filter by change category
- **BPMN Import/Export** — load `.bpmn`/`.xml` files from disk; export updated BPMN and JSON diff reports
- **Vendor Compatibility** — tolerates Camunda, Flowable, and Activiti extensions without parser failure
- **XXE-Safe Parsing** — DOCTYPE declarations are blocked; embedded scripts are never executed

## Stack

| Concern | Library |
|---|---|
| UI | React 19 + TypeScript |
| BPMN renderer | bpmn-js |
| XML editor | Monaco |
| State | Zustand |
| Build | Vite |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Getting Started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # unit tests
npm run typecheck  # TypeScript check
```

## Project Structure

```
src/
  app/             # App shell, routing, Zustand store
  core/
    models/        # BpmnElement, DiffItem, DiffSummary types
    parser/        # BPMN 2.0 parser (DOMParser-based, namespace-aware)
    security/      # XXE-safe XML parser utilities
  features/
    diff/          # Semantic diff engine + DiffPanel UI
    editor/        # BpmnViewer (bpmn-js), FileImport
    search/        # SearchBar
  shared/ui/       # Reusable components (ErrorBoundary, ...)
  styles/          # Global CSS

tests/
  unit/            # Vitest unit tests
  e2e/             # Playwright end-to-end tests

test/fixtures/     # Sample BPMN files for testing
docs/SRS.md        # Full Software Requirements Specification
```

## Roadmap

| Milestone | Scope |
|---|---|
| M1 — MVP | Import 2 BPMN files, visual diff, XML diff toggle ✓ |
| M2 | Live editing, XML sync, undo/redo |
| M3 | Script/variable diff depth, advanced filtering |
| M4 | Git revision comparison |
| M5 | Performance hardening (1000+ node diagrams) |


