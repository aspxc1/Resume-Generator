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
1. [x] Write and run failing model/export tests; implement model validation, safe HTML, and template-based LaTeX export; run tests and commit.
2. [x] Write failing browser flow tests; implement responsive editor, persistence, backups, ordering, and print layout; run tests and build; commit.
3. [x] Inspect desktop/mobile and printed PDF, review code, fix observed issues, document use and limitations; verify all checks; commit and push.

Execution: inline in this session. The new empty repository has no existing work to isolate; use a codex feature branch in the supplied workspace. Local app delivery matches the repository-based program request; no hosted service is needed.

## Verification record

- `npm test`: 7 passing tests covering validation, exact wording, safe HTML/TeX, links and section ordering.
- `npm run test:e2e`: 8 passing tests in Chrome, covering editing, local persistence, clipboard and real .tex downloads, backups, malformed imports, reordering, mobile, storage failure and size limits, Letter/A4 PDF output and multiple-page printing.
- `npm run build`: production build succeeds.
- Inspected desktop/mobile screenshots and a Poppler-rendered PDF. pypdf verified Letter/A4 page geometry and selectable text; a long resume has 2 pages and retains bullets 1 and 65.
- Independent code review identified reserved section IDs, large-draft round trips and OT1 comparison symbols. Each has a regression test and fix. Fixed a ResizeObserver loop found during browser testing.
- The LaTeX source is assembled from Jake's original preamble. No local TeX compiler is installed, so actual TeX compilation was not executed; exported source, escaping and downloads are covered by tests. Browser PDF output was generated and inspected.
