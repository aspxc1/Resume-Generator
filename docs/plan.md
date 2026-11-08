# Resume Generator Implementation Plan

**Goal:** A functional formatting-only resume editor with Jake's template exports.
**Architecture:** Shared validated resume model consumed by safe HTML and LaTeX renderers, with a browser editor and local persistence.
**Tech Stack:** JavaScript, CSS, Vite, Node test runner, Playwright.
**Spec:** docs/design.md

## Constraints and review focus
- Every resume word comes from the user. Start blank.
- Preserve Unicode and punctuation; escape rendering syntax and unsafe URLs.
- Reject malformed imports without replacing the current draft.
- Long entries must wrap and long documents must print across pages.
- Storage failure must leave editing/export available.

## Tasks
1. [ ] Write and run failing model/export tests; implement model validation, safe HTML, and template-based LaTeX export; run tests and commit.
2. [ ] Write failing browser flow tests; implement responsive editor, persistence, backups, ordering, and print layout; run tests and build; commit.
3. [ ] Inspect desktop/mobile and printed PDF, review code, fix observed issues, document use and limitations; verify all checks; commit and push.

Execution: inline in this session. The new empty repository has no existing work to isolate; use a codex feature branch in the supplied workspace. Local app delivery matches the repository-based program request; no hosted service is needed.
