# Software Requirements Specification (SRS)

## Product
FlowScope — BPMN Visual Diff & Live Editing Platform

## Document Control
- **Version:** 1.0
- **Date:** 2026-04-26
- **Status:** Build-ready baseline (MVP)

---

## 1. Introduction

### 1.1 Purpose
This SRS defines functional and non-functional requirements for FlowScope, a web platform for comparing, editing, and reviewing BPMN 2.0 process models across local files and Git revisions.

### 1.2 Scope
FlowScope shall enable users to:
- Compare two BPMN 2.0 XML files.
- Visualize differences semantically on diagrams.
- Inspect XML-level differences in a dedicated diff view.
- Edit BPMN models in real time with synchronized XML/model views.
- Analyze structural, attribute, script, and variable changes.
- Compare versions from branches, tags, commits, and working tree states in Git.

### 1.3 Out of Scope (Initial Release)
- Multi-user live co-editing.
- Workflow execution/simulation.
- Automated process optimization recommendations.

### 1.4 Definitions
- **BPMN:** Business Process Model and Notation.
- **Semantic Diff:** Change analysis based on BPMN model meaning/structure.
- **XML Diff:** Tree/text comparison of BPMN XML.
- **Model Element:** BPMN node or edge (task, event, gateway, sequence flow, etc.).

---

## 2. Product Overview

### 2.1 Product Perspective
FlowScope is a standalone web application with optional backend services for Git access, persistence, and heavy diff operations.

### 2.2 System Context
Git Repository / File System → BPMN Loader → Parser/Validator → Diff Engines → Visual/XML Renderers → User

### 2.3 User Classes
- **Process Engineers:** author and maintain workflows.
- **Developers:** review implementation logic changes in service/script tasks.
- **DevOps Engineers:** track changes across branches/commits.
- **Auditors/Analysts:** review historical process changes.

### 2.4 Operating Environment
- Modern browsers (latest 2 versions of Chrome, Edge, Firefox).
- Frontend-first architecture with optional Node.js backend.
- Git providers: local Git, GitHub, GitLab (MVP can start with local + GitHub).

---

## 3. Assumptions and Constraints

### 3.1 Assumptions
- Input files are valid or near-valid BPMN 2.0 XML.
- Users have repository access rights for selected revisions.

### 3.2 Constraints
- Must preserve BPMN 2.0 compatibility.
- Must not execute embedded scripts or process logic.
- Must parse vendor extensions without data loss when possible.

---

## 4. Functional Requirements

### 4.1 BPMN Input, Parsing, and Validation
- **FR-001**: The system shall import BPMN 2.0 XML files from local storage.
- **FR-002**: The system shall validate BPMN structure and report validation errors with location details.
- **FR-003**: The system shall tolerate vendor extensions (e.g., Camunda/Flowable/Activiti) without parser failure.

### 4.2 Diff Computation
- **FR-004**: The system shall compute differences between two BPMN models.
- **FR-005**: The system shall classify semantic changes as Added, Removed, or Modified.
- **FR-006**: The system shall detect attribute changes (name, type, condition expressions, event definitions, references).
- **FR-007**: The system shall detect script-level changes (service task scripts, listeners, mappings).
- **FR-008**: The system shall detect variable-level changes (create/update/delete).

### 4.3 Visual Diff Experience
- **FR-009**: The system shall render BPMN diagrams for both baseline and target versions.
- **FR-010**: The system shall apply color-coding for differences:
    - Green = added
    - Red = removed
    - Yellow = modified
- **FR-011**: The system shall provide side-by-side visual comparison.
- **FR-012**: The system shall support navigation between detected changes.

### 4.4 XML Diff Experience
- **FR-013**: The system shall provide a raw XML diff view.
- **FR-014**: The system shall allow toggling between visual diff and XML diff views.
- **FR-015**: XML diff shall highlight node, attribute, and text/script differences.

### 4.5 Live Editing and Synchronization
- **FR-016**: The system shall allow direct BPMN diagram editing.
- **FR-017**: Diagram edits shall synchronize to the underlying XML representation.
- **FR-018**: Valid XML edits shall synchronize to the diagram model.
- **FR-019**: The system shall support undo/redo in editing workflows.
- **FR-020**: Diff results shall refresh after user edits.

### 4.6 Git Integration
- **FR-021**: The system shall connect to Git repositories.
- **FR-022**: The system shall allow selecting branches, commits, and tags.
- **FR-023**: The system shall compare any two selected revisions.
- **FR-024**: The system shall support comparison of working tree vs selected commit.
- **FR-025**: The system shall display commit metadata (author, timestamp, message).

### 4.7 Search and Filtering
- **FR-026**: The system shall search model elements by ID and name.
- **FR-027**: The system shall filter diffs by Added/Removed/Modified categories.

### 4.8 Export and Reporting
- **FR-028**: The system shall export updated BPMN XML.
- **FR-029**: The system shall export diff summaries in JSON.
- **FR-030**: The system may export human-readable diff reports in HTML.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-001**: Diff computation shall complete within 2 seconds for BPMN files up to 5 MB on a standard developer laptop.
- **NFR-002**: UI interaction response time shall be < 200 ms for common actions (select, highlight, filter).

### 5.2 Scalability
- **NFR-003**: The system shall support diagrams with at least 1,000 nodes and 2,000 edges.

### 5.3 Reliability and Data Integrity
- **NFR-004**: The system shall not corrupt XML during editing or export.
- **NFR-005**: Save/export shall be blocked when model validation fails, with actionable error messages.

### 5.4 Usability
- **NFR-006**: The interface shall support side-by-side and overlay/inspect workflows.
- **NFR-007**: The interface shall be fully usable at 1920x1080 resolution.

### 5.5 Compatibility
- **NFR-008**: The system shall comply with BPMN 2.0 XML format.
- **NFR-009**: The system shall interoperate with files generated by Camunda, Flowable, and Activiti.

### 5.6 Security
- **NFR-010**: The system shall parse XML securely (e.g., XXE-safe parser configuration).
- **NFR-011**: BPMN embedded scripts shall never be executed.
- **NFR-012**: Git authentication shall use secure mechanisms (token/OAuth/credential helper) and avoid plaintext persistence.

---

## 6. Architecture Requirements

### 6.1 Logical Components
1. **Frontend UI**
     - BPMN renderer/editor
     - Diff visualization panel
     - XML diff/editor panel
     - Search/filter/navigation controls
2. **Application Layer**
     - Synchronization controller (diagram ↔ XML)
     - Validation orchestration
     - Diff recomputation triggers
3. **Core Services**
     - Semantic diff engine
     - XML diff engine
     - BPMN parser/serializer
     - Git integration adapter

### 6.2 Architectural Style
- Modular layered architecture.
- Client-heavy MVP with optional backend for scalability and repository operations.

### 6.3 Data Flow (Normative)
User action → state update → validation → diff recomputation → render update → user feedback.

---

## 7. Data Requirements

### 7.1 BPMN Internal Model
- `nodes[]`: id, type, properties, extension attributes
- `edges[]`: id, source, target, conditions

### 7.2 Diff Model
- `added[]`
- `removed[]`
- `modified[]`
- `attributeChanges[]`
- `scriptChanges[]`
- `variableChanges[]`
- `metadata` (comparison source, commit refs, timestamps)

---

## 8. External Interfaces

### 8.1 Git Interface
- Clone/open repository
- Enumerate refs (branches/tags)
- Read file at revision
- Compare revisions

### 8.2 File Interface
- Import BPMN XML
- Export BPMN XML
- Export diff report (JSON, optional HTML)

---

## 9. Acceptance Criteria (Release 1)

1. Given two valid BPMN files, users can view semantic and XML diffs without application error.
2. Added/removed/modified elements are highlighted correctly in visual mode.
3. Editing in visual mode updates XML; editing valid XML updates diagram.
4. Users can compare BPMN files from two Git commits and view commit metadata.
5. Exported BPMN remains valid BPMN 2.0 after supported edits.

---

## 10. Risks and Mitigations
- **Risk:** Large diagrams degrade rendering performance.
    - **Mitigation:** Incremental rendering, virtualization, Web Workers.
- **Risk:** Vendor extension incompatibilities.
    - **Mitigation:** Extension-preserving parse/serialize strategy and fallback handling.
- **Risk:** Sync conflicts between XML and visual edits.
    - **Mitigation:** Transactional update pipeline with validation gates.

---

## 11. Recommended Technology Baseline (Non-binding)
- Frontend: TypeScript + React
- BPMN rendering/editing: `bpmn-js`
- XML editor: Monaco
- Backend (optional): Node.js + NestJS/Express
- Git integration: `isomorphic-git` or secure Git provider APIs

---

## 12. Implementation Milestones
- **M1 (MVP):** Import 2 BPMN files, visual diff, XML diff toggle.
- **M2:** Live editing with synchronization and undo/redo.
- **M3:** Script/variable diff depth and advanced filtering/navigation.
- **M4:** Git revision comparison support.
- **M5:** Performance and scale hardening.

---

## 13. Future Enhancements
- AI-assisted change summaries.
- Multi-user collaborative editing.
- Approval workflows for BPMN change governance.
- Time-travel visualization across commit history.

---

## 14. MVP Scope Freeze (Build Target)

### 14.1 In Scope for MVP (Must Ship)
- Local file import for two BPMN files.
- Semantic diff (added/removed/modified) with visual highlighting.
- XML diff view with toggle from visual mode.
- Element search and diff filtering.
- Visual editing with XML synchronization and undo/redo.
- BPMN export and JSON diff export.

### 14.2 Deferred (Post-MVP)
- Full remote Git provider integration UI.
- HTML report export.
- Large-scale optimization beyond baseline thresholds.
- Any collaborative editing capability.

### 14.3 Requirement Baseline for MVP
MVP must fully implement: **FR-001..FR-020, FR-026..FR-029, NFR-001, NFR-002, NFR-004, NFR-005, NFR-008, NFR-010, NFR-011**.

---

## 15. Build Architecture Baseline (Decision Lock)

### 15.1 Runtime Topology (MVP)
- **Primary mode:** Frontend-only application for BPMN load/diff/edit/export.
- **Optional backend mode (feature flag):** Git/repository adapter.

### 15.2 Locked Technical Decisions
- UI framework: React + TypeScript.
- BPMN renderer/editor: `bpmn-js`.
- XML editor: Monaco.
- State management: Zustand.
- Testing: Vitest (unit), Playwright (E2E).

### 15.3 Component Boundaries
- `BpmnWorkspace`: diagram render/edit orchestration.
- `DiffService`: semantic + XML diff generation.
- `SyncService`: diagram↔XML transactional synchronization.
- `ValidationService`: BPMN and XML validation pipeline.
- `ExportService`: BPMN and JSON artifact generation.

---

## 16. Initial Repository Structure (Target)

- `src/app` — app shell, routing, layout.
- `src/features/diff` — visual diff logic and mapping.
- `src/features/editor` — BPMN and XML editing integration.
- `src/features/search` — search/filter/navigation.
- `src/core/parser` — BPMN parse/serialize/validation adapters.
- `src/core/models` — BPMN/diff domain models.
- `src/core/security` — safe XML parser and guards.
- `src/shared/ui` — reusable UI components.
- `tests/unit` — unit tests.
- `tests/e2e` — end-to-end scenarios.

---

## 17. Contract-First Data Models (Normative)

### 17.1 BPMN Element
- `id: string`
- `kind: 'node' | 'edge'`
- `type: string`
- `name?: string`
- `attrs: Record<string, string>`
- `extensions?: Record<string, unknown>`

### 17.2 Diff Item
- `changeType: 'added' | 'removed' | 'modified'`
- `elementId: string`
- `elementType: string`
- `fieldPath?: string`
- `before?: unknown`
- `after?: unknown`
- `severity: 'info' | 'warning' | 'critical'`

### 17.3 Diff Summary
- `counts: { added: number; removed: number; modified: number }`
- `items: DiffItem[]`
- `source: { leftRef: string; rightRef: string; generatedAt: string }`

---

## 18. Backend API Surface (Optional, if enabled)

### 18.1 Endpoints
- `POST /api/diff/semantic` — returns semantic diff summary and items.
- `POST /api/diff/xml` — returns XML diff sections.
- `GET /api/git/refs` — returns branches/tags.
- `GET /api/git/file` — returns BPMN XML at revision.
- `GET /api/git/compare/meta` — returns commit metadata.

### 18.2 API Constraints
- All request payloads must be schema-validated.
- XML inputs must pass secure parser policy before processing.
- Responses must include deterministic IDs for diff items to enable stable UI navigation.

---

## 19. Delivery Plan (Build-Start Ready)

### Phase A — Foundation (Week 1)
- Project skeleton + architecture modules.
- BPMN load/render baseline.
- Safe XML parsing + validation pipeline.

### Phase B — Core Diff (Week 2)
- Semantic diff engine.
- XML diff engine.
- Diff mapping to visual overlays.

### Phase C — Editing & Sync (Week 3)
- Visual editing.
- XML editing with validation.
- Transactional sync + undo/redo.

### Phase D — UX Completion (Week 4)
- Search/filter/navigation.
- Export JSON + BPMN.
- Accessibility pass and error-state UX.

### Phase E — Hardening (Week 5)
- Performance tuning against NFR targets.
- E2E regression and release candidate quality gate.

---

## 20. Quality Gates and Definition of Done

### 20.1 Build Gate
- Application builds successfully in CI.
- No blocker/critical lint or type errors.

### 20.2 Test Gate
- Unit coverage for core diff/sync logic ≥ 80% lines.
- E2E tests pass for acceptance criteria in Section 9.

### 20.3 Security Gate
- XML parser policy validated against XXE payload tests.
- No script execution paths from BPMN content.

### 20.4 Product Gate (Done)
Feature is Done only if:
1. Mapped to one or more FR/NFR IDs.
2. Has automated tests.
3. Meets UX/error handling expectations.
4. Has no unresolved high-severity defects.

---

## 21. Requirement-to-Work Traceability (Starter Matrix)

- **FR-001..FR-003** → Phase A
- **FR-004..FR-015** → Phase B
- **FR-016..FR-020** → Phase C
- **FR-026..FR-029** → Phase D
- **NFR-001..NFR-002, NFR-004..NFR-005, NFR-008, NFR-010..NFR-011** → Phase E (with earlier checkpoints)

This matrix is mandatory for sprint planning and release sign-off.

---

## 22. Immediate Next Actions (Start Now)

1. Create repository skeleton per Section 16.
2. Implement parser/validation foundation and BPMN render baseline.
3. Add first executable acceptance tests for Section 9 criteria 1 and 2.
4. Implement semantic diff MVP loop and wire visual highlights.
5. Start weekly gate review using Section 20.
