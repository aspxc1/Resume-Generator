import { preamble } from './template.js';

export const basicFields = ['name', 'email', 'phone', 'location', 'linkedin', 'github', 'website'];
const entryFields = ['title', 'subtitle', 'location', 'dates', 'details', 'url'];
export function emptyResume() {
  return { version: 1, basics: Object.fromEntries(basicFields.map(key => [key, ''])), settings: { paper: 'letter', spacing: 'normal' }, sections: [
    { id: 'education', type: 'education', title: 'Education', entries: [] },
    { id: 'experience', type: 'experience', title: 'Experience', entries: [] },
    { id: 'projects', type: 'projects', title: 'Projects', entries: [] },
    { id: 'skills', type: 'skills', title: 'Technical Skills', entries: [] },
  ] };
}
export function parseResume(text) {
  if (text.length > 2_000_000) throw new Error('This file is too large. Use a resume backup under 2 MB.');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('This file is not valid JSON. Choose a resume backup.'); }
  const invalid = () => { throw new Error('This is not a supported resume backup (version 1).'); };
  const string = value => typeof value === 'string' && value.length <= 50000;
  if (!value || value.version !== 1 || !value.basics || !basicFields.every(key => string(value.basics[key])) || !['letter', 'a4'].includes(value.settings?.paper) || !['normal', 'compact'].includes(value.settings?.spacing) || !Array.isArray(value.sections) || value.sections.length > 30) invalid();
  const ids = new Set();
  const sections = value.sections.map(section => {
    if (!section || !string(section.id) || !section.id || ids.has(section.id) || !['education', 'experience', 'projects', 'skills', 'custom'].includes(section.type) || !string(section.title) || !Array.isArray(section.entries) || section.entries.length > 100) invalid();
    ids.add(section.id);
    const entries = section.entries.map(entry => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !entryFields.every(key => entry[key] === undefined || string(entry[key]))) invalid();
      return Object.fromEntries(entryFields.filter(key => entry[key] !== undefined).map(key => [key, entry[key]]));
    });
    return { id: section.id, type: section.type, title: section.title, entries };
  });
  return { version: 1, basics: Object.fromEntries(basicFields.map(key => [key, value.basics[key]])), settings: { paper: value.settings.paper, spacing: value.settings.spacing }, sections };
}
export const escapeHtml = (value = '') => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export const escapeTex = (value = '') => value.replace(/[\\{}$&#%_^~]/g, char => ({ '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#', '%': '\\%', '_': '\\_', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}' })[char]).replace(/\r?\n/g, ' ');
export function safeUrl(value = '') {
  if (!value || /\s/.test(value) || value.startsWith('//')) return '';
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  try { const url = new URL(candidate); return ['https:', 'http:'].includes(url.protocol) && url.hostname.includes('.') ? url.href : ''; } catch { return ''; }
}
const bullets = value => (value || '').split(/\r?\n/).filter(line => line.trim());
const present = entry => entryFields.some(key => entry[key]?.trim());
const sectionsWithContent = resume => resume.sections.map(section => ({ ...section, entries: section.entries.filter(present) })).filter(section => section.entries.length);
const linkHtml = (label, href) => href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : escapeHtml(label);
function contacts(resume) {
  const b = resume.basics;
  return [
    [b.phone, ''], [b.email, /^[^\s@]+@[^\s@]+$/.test(b.email) ? `mailto:${b.email}` : ''], [b.location, ''],
    ...['linkedin', 'github', 'website'].map(key => [b[key], safeUrl(b[key])]),
  ].filter(([label]) => label.trim());
}
export function renderResume(resume) {
  const b = resume.basics;
  const contact = contacts(resume).map(([label, href]) => linkHtml(label, href)).join('<span class="separator"> | </span>');
  const header = b.name || contact ? `<header class="resume-heading">${b.name ? `<h1>${escapeHtml(b.name)}</h1>` : ''}${contact ? `<p>${contact}</p>` : ''}</header>` : '';
  return header + sectionsWithContent(resume).map(section => `<section class="resume-section"><h2>${escapeHtml(section.title)}</h2>${section.entries.map(entry => {
    if (section.type === 'skills') return `<p class="skill-line">${entry.title ? `<strong>${escapeHtml(entry.title)}:</strong> ` : ''}${escapeHtml(entry.details || '')}</p>`;
    const education = section.type === 'education';
    const primaryRight = education ? entry.location : entry.dates;
    const secondaryRight = education ? entry.dates : entry.location;
    return `<article class="resume-entry"><div class="entry-heading"><strong>${linkHtml(entry.title || '', safeUrl(entry.url))}</strong><span>${escapeHtml(primaryRight || '')}</span></div>${entry.subtitle || secondaryRight ? `<div class="entry-subheading"><em>${escapeHtml(entry.subtitle || '')}</em><em>${escapeHtml(secondaryRight || '')}</em></div>` : ''}${bullets(entry.details).length ? `<ul>${bullets(entry.details).map(line => `<li>${escapeHtml(line)}</li>`).join('')}</ul>` : ''}</article>`;
  }).join('')}</section>`).join('');
}
export function toLatex(resume) {
  const e = escapeTex;
  const texLink = (label, href) => href && !/[{}\\%#]/.test(href) ? `\\href{${e(href)}}{\\underline{${e(label)}}}` : e(label);
  const b = resume.basics;
  const heading = [b.name ? `\\textbf{\\Huge \\scshape ${e(b.name)}}` : '', contacts(resume).map(([label, href]) => texLink(label, href)).join(' $|$ ')].filter(Boolean).join(' \\\\ \\vspace{1pt}\n\\small ');
  let setup = preamble;
  if (resume.settings.paper === 'a4') setup = setup.replace('letterpaper,11pt', 'a4paper,11pt');
  if (resume.settings.spacing === 'compact') setup += '\n\\setlength{\\parskip}{0pt}\n\\setlist[itemize]{itemsep=0pt,topsep=2pt}\n';
  return setup + '\n\\begin{document}\n' + (heading ? `\\begin{center}\n${heading}\n\\end{center}\n` : '') + sectionsWithContent(resume).map(section => {
    const entries = section.entries.map(entry => {
      if (section.type === 'skills') return `\\item \\small{${entry.title ? `\\textbf{${e(entry.title)}:} ` : ''}${e(entry.details || '')}}`;
      let line;
      if (section.type === 'projects') line = `\\resumeProjectHeading{\\textbf{${texLink(entry.title || '', safeUrl(entry.url))}}${entry.subtitle ? ` $|$ \\emph{${e(entry.subtitle)}}` : ''}}{${e(entry.dates || '')}}${entry.location ? `\n\\par\\small{${e(entry.location)}}` : ''}`;
      else line = `\\resumeSubheading{${texLink(entry.title || '', safeUrl(entry.url))}}{${e((section.type === 'education' ? entry.location : entry.dates) || '')}}{${e(entry.subtitle || '')}}{${e((section.type === 'education' ? entry.dates : entry.location) || '')}}`;
      const items = bullets(entry.details);
      return line + (items.length ? '\n\\resumeItemListStart\n' + items.map(line => `\\resumeItem{${e(line)}}`).join('\n') + '\n\\resumeItemListEnd' : '\n\\vspace{6pt}');
    }).join('\n');
    return `\n\\section{${e(section.title)}}\n\\resumeSubHeadingListStart\n${entries}\n\\resumeSubHeadingListEnd\n`;
  }).join('') + '\n\\end{document}\n';
}
