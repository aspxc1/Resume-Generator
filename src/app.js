import './style.css';
import { basicFields, emptyResume, escapeHtml as h, parseResume, renderResume, toLatex, backupJson, backupFits, MAX_BACKUP_BYTES } from './resume.js';

const STORAGE_KEY = 'jakes-resume:v1';
let resume = emptyResume();
let active = 'basics';
let storageMessage = 'Saved on this device';
let startupError = '';
try {
  const draft = localStorage.getItem(STORAGE_KEY);
  if (draft) resume = parseResume(draft);
} catch {
  startupError = 'Your saved draft could not be loaded. Import a JSON backup to restore it. Existing saved data will only be replaced when you edit.';
  storageMessage = 'Draft unavailable — save a backup';
}
const labels = { name: 'Full name', email: 'Email', phone: 'Phone', location: 'Location', linkedin: 'LinkedIn URL', github: 'GitHub URL', website: 'Website URL' };
const addLabels = { education: 'Add education', experience: 'Add experience', projects: 'Add project', skills: 'Add skill category', custom: 'Add entry' };
let lastAccepted = JSON.stringify(resume);

document.querySelector('#app').innerHTML = `
  <header class="app-header">
    <a class="brand" href="./" aria-label="Jake's Resume Builder home"><span class="brand-mark">j.</span><span>Jake’s <strong>Resume Builder</strong></span></a>
    <div class="header-actions"><button data-action="source" class="button secondary">LaTeX source <span aria-hidden="true">↗</span></button><button data-action="print" class="button primary">Print / Save PDF <span aria-hidden="true">↓</span></button></div>
  </header>
  <main class="workspace">
    <section class="editor-pane" aria-label="Resume editor">
      <div class="intro"><span class="eyebrow">BUILT FOR YOUR NEXT CHAPTER</span><h1>Your experience.<br><span>Beautifully formatted.</span></h1><p>Bring the words. We’ll take care of the layout.</p></div>
      <div class="draft-bar"><span class="save-indicator" aria-hidden="true"></span><span id="save-status" role="status">${h(storageMessage)}</span><span class="local-badge">LOCAL ONLY</span></div>
      <div id="message" role="alert" hidden></div>
      <nav id="section-nav" aria-label="Resume sections"></nav>
      <div id="editor-content"></div>
      <button class="add-section" data-action="add-section"><span aria-hidden="true">＋</span> Add custom section</button>
      <div class="backup-bar"><button data-action="backup">Save backup</button><button data-action="import">Import JSON</button><button data-action="clear" class="danger-link">Clear resume</button><input id="import-file" type="file" accept=".json,application/json" hidden></div>
      <p class="privacy-note">Your content stays in this browser. Save a backup to move between devices. No descriptions are generated.</p>
      <footer class="attribution">Based on <a href="https://github.com/jakegut/resume" target="_blank" rel="noopener noreferrer">Jake Gutierrez’s Resume Template ↗</a></footer>
    </section>
    <section class="preview-pane" aria-label="Resume preview">
      <div class="preview-toolbar"><div><span class="live-dot"></span><strong>Live preview</strong></div><div class="preview-options"><label>Paper size<select id="paper"><option value="letter">US Letter</option><option value="a4">A4</option></select></label><label>Spacing<select id="spacing"><option value="normal">Normal</option><option value="compact">Compact</option></select></label></div></div>
      <div class="paper-viewport"><div id="paper-shell"><div id="resume" class="resume"></div><div id="empty-preview"><span class="empty-icon" aria-hidden="true">≡</span><h2>A fresh page.<br>A new opportunity.</h2><p>Add your details to see your resume<br>take shape here.</p><span>JAKE’S RESUME TEMPLATE</span></div></div></div>
      <p class="preview-note">Continuous preview · Page breaks are applied when printing.</p>
    </section>
  </main>
  <dialog id="source-dialog" aria-labelledby="source-title"><div class="dialog-heading"><div><span class="eyebrow">YOURS TO EDIT</span><h2 id="source-title">Your LaTeX source</h2></div><button data-action="close-source" class="icon-button" aria-label="Close LaTeX source">×</button></div><p>Copy or download the complete source, then edit it freely in Overleaf or your own editor. This view updates from your resume fields.</p><p class="source-note">Uses Jake’s original template. Compile with pdfLaTeX; for scripts it does not support, adapt the font and compiler in your editor.</p><label class="sr-only" for="latex-code">Generated LaTeX code</label><textarea id="latex-code" readonly spellcheck="false"></textarea><div class="dialog-actions"><span id="copy-status" role="status"></span><button class="button secondary" data-action="copy-source">Copy code</button><button class="button primary" data-action="download-source">Download .tex</button></div></dialog>
  <style id="print-settings"></style>
`;

function message(text = '') {
  const element = document.querySelector('#message');
  element.textContent = text;
  element.hidden = !text;
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resume)); storageMessage = 'Saved on this device'; }
  catch { storageMessage = 'Could not save on this device — save a backup'; }
  document.querySelector('#save-status').textContent = storageMessage;
}
function refreshPreview() {
  const element = document.querySelector('#resume');
  element.innerHTML = renderResume(resume);
  element.dataset.paper = resume.settings.paper;
  element.dataset.spacing = resume.settings.spacing;
  document.querySelector('#paper-shell').dataset.paper = resume.settings.paper;
  document.querySelector('#empty-preview').hidden = Boolean(element.innerHTML);
  document.querySelector('#paper').value = resume.settings.paper;
  document.querySelector('#spacing').value = resume.settings.spacing;
  document.querySelector('#print-settings').textContent = `@page { size: ${resume.settings.paper === 'a4' ? 'A4' : 'letter'}; margin: 0.5in; }`;
  document.title = resume.basics.name ? `${resume.basics.name} — Resume` : 'Jake’s Resume Builder';
  resizePreview();
}
function resizePreview() {
  const viewport = document.querySelector('.paper-viewport');
  const shell = document.querySelector('#paper-shell');
  const width = resume.settings.paper === 'a4' ? 794 : 816;
  const scale = Math.min(1, Math.max(0.1, (viewport.clientWidth - 4) / width));
  shell.style.zoom = scale;
}
function field(label, key, value = '', options = {}) {
  const id = `field-${options.index ?? 'basic'}-${key}`;
  const attrs = `id="${id}" data-field="${key}" ${options.index === undefined ? 'data-basic' : `data-index="${options.index}"`} maxlength="50000"`;
  return `<label class="field ${options.wide ? 'wide' : ''}" for="${id}"><span>${h(label)}</span>${options.area ? `<textarea ${attrs} rows="5" placeholder="${h(options.placeholder || '')}">${h(value)}</textarea>` : `<input ${attrs} type="text" value="${h(value)}" ${key === 'email' ? 'inputmode="email"' : ''} placeholder="${h(options.placeholder || '')}">`}${options.help ? `<small>${h(options.help)}</small>` : ''}</label>`;
}
function renderEditor() {
  const nav = document.querySelector('#section-nav');
  nav.innerHTML = [{ id: 'basics', title: 'Personal' }, ...resume.sections].map((section, index) => `<button data-action="select" data-id="${h(section.id)}" aria-pressed="${active === section.id}"><span class="nav-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${h(section.title || 'Untitled section')}</button>`).join('');
  const content = document.querySelector('#editor-content');
  if (active === 'basics') {
    content.innerHTML = `<div class="panel-heading"><div><h2>Personal details</h2><p>Make it easy for the right people to find you.</p></div><span class="section-counter">01</span></div><div class="fields-grid">${basicFields.map(key => field(labels[key], key, resume.basics[key], { wide: key === 'name', placeholder: key === 'name' ? 'Your name' : key === 'github' ? 'github.com/username' : key === 'linkedin' ? 'linkedin.com/in/username' : '' })).join('')}</div><div class="editor-tip"><span aria-hidden="true">↗</span><p>Only fields you fill in appear on your resume. Add links as full URLs or domain names.</p></div>`;
    return;
  }
  const section = resume.sections.find(section => section.id === active);
  const position = resume.sections.indexOf(section);
  content.innerHTML = `<div class="panel-heading"><div><h2>${h(section.title || 'Untitled section')}</h2><p>${section.type === 'skills' ? 'Group your technical skills into categories.' : 'Add your details and write each bullet in your own words.'}</p></div><div class="order-controls"><button class="icon-button" data-action="section-up" aria-label="Move section up" ${position === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-action="section-down" aria-label="Move section down" ${position === resume.sections.length - 1 ? 'disabled' : ''}>↓</button><button class="icon-button danger-link" data-action="remove-section" aria-label="Remove section">×</button></div></div><label class="field section-name"><span>Section heading</span><input id="section-title" maxlength="50000" value="${h(section.title)}"></label><div class="entries">${section.entries.map((entry, index) => renderEntry(section, entry, index)).join('')}</div>${!section.entries.length ? `<div class="empty-section"><span aria-hidden="true">＋</span><p>Ready when you are.</p><small>Add an entry to begin this section.</small></div>` : ''}<button class="add-entry" data-action="add-entry" ${section.entries.length >= 100 ? 'disabled' : ''}>＋ ${addLabels[section.type]}</button>`;
}
function renderEntry(section, entry, index) {
  const type = section.type;
  const names = type === 'education' ? ['School / university', 'Degree / field of study'] : type === 'experience' ? ['Role / position', 'Company / organization'] : type === 'projects' ? ['Project name', 'Technologies / tools'] : type === 'skills' ? ['Category', ''] : ['Title', 'Organization / subtitle'];
  const options = { index };
  const fields = type === 'skills' ? field(names[0], 'title', entry.title, { ...options, wide: true }) + field('Skills', 'details', entry.details, { ...options, area: true, wide: true, help: 'Enter your skills exactly as you want them displayed.' }) : field(names[0], 'title', entry.title, { ...options, wide: true }) + field(names[1], 'subtitle', entry.subtitle, { ...options, wide: true }) + field('Dates', 'dates', entry.dates, { ...options, placeholder: 'e.g. Aug 2023 – Present' }) + field('Location', 'location', entry.location, options) + (type === 'projects' || type === 'custom' ? field('Entry URL (optional)', 'url', entry.url, { ...options, wide: true }) : '') + field('Bullet points', 'details', entry.details, { ...options, area: true, wide: true, help: 'One bullet per line. Your wording is preserved; blank lines are skipped.' });
  return `<article class="entry-card"><div class="entry-card-heading"><span>ENTRY ${String(index + 1).padStart(2, '0')}</span><div class="order-controls"><button data-action="entry-up" data-index="${index}" class="icon-button" aria-label="Move entry ${index + 1} up" ${index === 0 ? 'disabled' : ''}>↑</button><button data-action="entry-down" data-index="${index}" class="icon-button" aria-label="Move entry ${index + 1} down" ${index === section.entries.length - 1 ? 'disabled' : ''}>↓</button><button data-action="remove-entry" data-index="${index}" class="icon-button danger-link" aria-label="Remove entry ${index + 1}">×</button></div></div><div class="fields-grid">${fields}</div></article>`;
}
function changed(structural = false) {
  if (!backupFits(resume)) {
    resume = parseResume(lastAccepted);
    if (active !== 'basics' && !resume.sections.some(section => section.id === active)) active = 'basics';
    renderEditor();
    refreshPreview();
    message('This edit exceeds the 2 MB resume size limit. Your previous draft is preserved. Shorten the content or remove an entry to continue.');
    return;
  }
  lastAccepted = JSON.stringify(resume);
  if (structural) renderEditor();
  refreshPreview();
  save();
}
function download(content, extension, mime) {
  const name = (resume.basics.name.trim() || 'My').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, '-').slice(0, 100) || 'My';
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name}-resume.${extension}`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

document.querySelector('#editor-content').addEventListener('input', event => {
  const input = event.target;
  if (input.id === 'section-title') {
    resume.sections.find(section => section.id === active).title = input.value;
    const navButton = [...document.querySelectorAll('#section-nav button')].find(button => button.dataset.id === active);
    navButton.lastChild.textContent = input.value || 'Untitled section';
  } else if (input.hasAttribute('data-basic')) resume.basics[input.dataset.field] = input.value;
  else if (input.dataset.field) resume.sections.find(section => section.id === active).entries[Number(input.dataset.index)][input.dataset.field] = input.value;
  else return;
  changed();
});
document.querySelectorAll('.preview-options select').forEach(select => select.addEventListener('change', event => {
  resume.settings[event.target.id] = event.target.value;
  changed();
}));
document.addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const section = resume.sections.find(section => section.id === active);
  const index = Number(button.dataset.index);
  if (action === 'select') { active = button.dataset.id; renderEditor(); return; }
  if (action === 'source') {
    document.querySelector('#latex-code').value = toLatex(resume);
    document.querySelector('#copy-status').textContent = '';
    document.querySelector('#source-dialog').showModal();
    return;
  }
  if (action === 'close-source') { document.querySelector('#source-dialog').close(); return; }
  if (action === 'copy-source') {
    try { await navigator.clipboard.writeText(document.querySelector('#latex-code').value); document.querySelector('#copy-status').textContent = 'Copied to clipboard'; }
    catch { document.querySelector('#latex-code').select(); document.querySelector('#copy-status').textContent = 'Press Ctrl+C (or ⌘C) to copy the selected code.'; }
    return;
  }
  if (action === 'download-source') { download(toLatex(resume), 'tex', 'application/x-tex;charset=utf-8'); return; }
  if (action === 'print') { window.print(); return; }
  if (action === 'backup') { download(backupJson(resume), 'json', 'application/json'); return; }
  if (action === 'import') { document.querySelector('#import-file').click(); return; }
  if (action === 'clear') {
    if (!confirm('Clear all resume content on this device? Save a backup first if you want to keep it.')) return;
    resume = emptyResume(); active = 'basics'; message();
  }
  if (action === 'add-section') {
    if (resume.sections.length >= 30) { message('You can have up to 30 sections.'); return; }
    const id = crypto.randomUUID();
    resume.sections.push({ id, type: 'custom', title: 'Additional experience', entries: [] }); active = id;
  }
  if (action === 'add-entry') {
    if (section.entries.length >= 100) return;
    section.entries.push({ title: '', subtitle: '', dates: '', location: '', url: '', details: '' });
  }
  if (action === 'remove-entry') {
    if (Object.values(section.entries[index]).some(value => value.trim()) && !confirm('Remove this entry? This cannot be undone.')) return;
    section.entries.splice(index, 1);
  }
  if (action === 'remove-section') {
    if (!confirm(`Remove the “${section.title}” section and all its entries?`)) return;
    resume.sections = resume.sections.filter(item => item !== section); active = 'basics';
  }
  if (action === 'entry-up' || action === 'entry-down') {
    const target = index + (action === 'entry-up' ? -1 : 1);
    if (target < 0 || target >= section.entries.length) return;
    [section.entries[index], section.entries[target]] = [section.entries[target], section.entries[index]];
  }
  if (action === 'section-up' || action === 'section-down') {
    const position = resume.sections.indexOf(section);
    const target = position + (action === 'section-up' ? -1 : 1);
    if (target < 0 || target >= resume.sections.length) return;
    [resume.sections[position], resume.sections[target]] = [resume.sections[target], resume.sections[position]];
  }
  changed(true);
  if (action === 'add-entry') document.querySelector('.entry-card:last-child input')?.focus();
  if (action === 'add-section') document.querySelector('#section-title')?.focus();
});
document.querySelector('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new Error('This file is too large. Use a resume backup under 2 MB.');
    const imported = parseResume(await file.text());
    if (!confirm('Replace your current resume with this backup? Save your current work first if you want to keep it.')) return;
    resume = imported; active = 'basics'; message(); changed(true);
  } catch (error) { message(error.message); }
  finally { event.target.value = ''; }
});
let lastPreviewWidth = 0;
new ResizeObserver(entries => {
  const width = entries[0].contentRect.width;
  if (width === lastPreviewWidth) return;
  lastPreviewWidth = width;
  requestAnimationFrame(resizePreview);
}).observe(document.querySelector('.paper-viewport'));
renderEditor();
refreshPreview();
if (startupError) message(startupError);
