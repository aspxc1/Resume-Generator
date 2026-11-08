# Resume Generator

Build a local browser app for tech and engineering applicants. Users supply every word; the app formats it using Jake Gutierrez's resume structure. No AI services, accounts, or backend storage.

Implementation choice: a static JavaScript app with Vite for development/build. A command-line generator would be less convenient to edit; a backend LaTeX service would add installation and privacy costs. The browser approach supports live preview and print-to-PDF without a TeX installation; exported LaTeX uses Jake's original preamble for canonical output in Overleaf or pdfLaTeX. Browser PDF and TeX rendering may differ slightly.

Fields: name and contact links; repeatable education, experience, projects and skill categories; repeatable custom sections with entries and user-written bullet lists. Allow entry and section ordering, deletion, Letter/A4 and normal/compact spacing. Blank fields/sections disappear from output. Start empty. Never insert example descriptions into a user's resume.

Persist drafts in localStorage, report save failures, allow JSON backup/import with schema validation and confirmation before replacement, and clear with confirmation. Escape HTML and TeX, restrict hyperlink protocols, keep text selectable in print, support long documents without cutting content. All controls must have accessible labels and work at mobile widths.

Verification: unit tests for text preservation, import validation, escaping, unsafe URLs, empty and reordered sections, and exports; browser tests for editing, persistence, add/remove/reorder, backup/import, and print layout. Preserve upstream MIT notice. Commit milestones on a codex branch and push to the supplied empty repository when available.
