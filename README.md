# Jake's Resume Builder

A private browser app that formats **your own writing** for tech and engineering resumes using [Jake Gutierrez's Resume Template](https://github.com/jakegut/resume).

## Run locally

Install [Node.js](https://nodejs.org/) 22.12+ (24 LTS recommended), then run:

```sh
npm install
npm run dev
```

Open the local address Vite prints, normally `http://127.0.0.1:5173`. No account, API key, backend, or TeX installation is needed to use the editor or print a PDF. Runtime assets are local; the app does not call AI or send resume content to a server.

## Create a resume

1. Fill in Personal, then add entries under Education, Experience, Projects and Technical Skills. Blank fields and sections stay out of the resume.
2. Enter one bullet per line. The app preserves your words; it adds no job descriptions or achievements.
3. Use arrow controls to reorder entries and sections. Rename headings or add custom sections for certifications, research, awards or other content.
4. Choose US Letter or A4 and Normal or Compact spacing.
5. Click **Print / Save PDF**, choose **Save as PDF**, use 100% scale and turn browser headers/footers off. Use the chosen paper size and the CSS margins (0.5 inches). The continuous preview flows across pages in print. Browser rendering can differ slightly from LaTeX.
6. Click **LaTeX source** to inspect and copy the complete code or **Download .tex**. Upload it to Overleaf with the pdfLaTeX compiler, or run `pdflatex resume.tex` with a full TeX installation. Edit the exported source freely. External edits do not sync back into the form.

LaTeX export includes Jake's original preamble and commands. Input is treated as plain text, so characters such as `%`, `&`, `_`, and backslashes are escaped automatically. Most Western European text works with pdfLaTeX; scripts and characters outside its font support require adapting the fonts/compiler in your exported source. Browser PDF uses installed browser fonts and is usually the easier option for multilingual text. Review your final PDF before applying.

## Save and restore

Drafts save automatically in this browser's local storage. **Save backup** downloads a JSON file you can restore with **Import JSON**. Import validates the file before asking to replace your work. A backup is useful before clearing the resume, clearing browser data, changing devices or switching between development and preview addresses (each origin has its own storage). Private browsing may discard the draft when closed. If device storage is unavailable or full, editing and exports still work and the app shows a save warning.

Imports support version 1, files up to 2 MB, 30 sections and 100 entries per section. No sensitive resume examples are bundled or prefilled.

## Build and test

```sh
npm test
npm run build
npm run preview
npm run test:e2e
```

Unit tests use Node's built-in runner. Browser tests use an installed Chrome by default and Chromium when `CI` is set. For a different setup, adjust `channel` in `playwright.config.js`. GitHub Actions installs Chromium and runs unit tests, the production build, and browser tests on pushes and pull requests. The production `dist/` directory can be served by any static HTTP host.

## Template credit

Jake's original template is MIT licensed, based on [Sourabh Bajaj's template](https://github.com/sb2nov/resume). Its license is preserved in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md). The browser layout adapts the same centered contact header, ruled section headings, paired entry headings, bullet lists, and skill categories. LaTeX source remains standalone and editable.
