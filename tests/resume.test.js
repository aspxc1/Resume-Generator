import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyResume, parseResume, renderResume, toLatex, safeUrl } from '../src/resume.js';

test('new resumes contain no invented content and empty sections do not render', () => {
  const resume = emptyResume();
  assert.equal(resume.basics.name, '');
  assert.equal(renderResume(resume), '');
  assert.doesNotMatch(toLatex(resume), /Jake Ryan|Technical Skills|\\section\{/);
});

test('user text survives backup round trips and is safely rendered', () => {
  const resume = emptyResume();
  resume.basics.name = 'Zoë <script>alert(1)</script> & 李';
  resume.sections[1].entries.push({ title: 'R&D', subtitle: 'Engineer', location: 'Remote', dates: '2024 – Present', details: 'Cut latency by 27%.\nUsed C++ & Python_3.' });
  const loaded = parseResume(JSON.stringify(resume));
  assert.deepEqual(loaded, resume);
  const html = renderResume(loaded);
  assert.match(html, /Zoë &lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Cut latency by 27%\./);
  const tex = toLatex(loaded);
  assert.match(tex, /R\\&D/);
  assert.match(tex, /27\\%/);
  assert.match(tex, /Python\\_3/);
  assert.match(tex, /Zoë/);
});

test('imports reject invalid schema, duplicate ids, oversized and non-string values', () => {
  for (const input of ['null', '{}', '{bad', JSON.stringify({ ...emptyResume(), version: 2 })]) {
    assert.throws(() => parseResume(input));
  }
  const resume = emptyResume();
  resume.sections[0].entries.push({ title: 42 });
  assert.throws(() => parseResume(JSON.stringify(resume)));
  const duplicate = emptyResume();
  duplicate.sections[1].id = duplicate.sections[0].id;
  assert.throws(() => parseResume(JSON.stringify(duplicate)));
  assert.throws(() => parseResume(' '.repeat(2_000_001)));
});

test('links accept web addresses and reject executable schemes', () => {
  assert.equal(safeUrl('github.com/me'), 'https://github.com/me');
  assert.equal(safeUrl('https://example.com/a?x=1&y=2'), 'https://example.com/a?x=1&y=2');
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', '//evil.test', 'bad link']) assert.equal(safeUrl(value), '');
});

test('exports follow user section order and custom labels, ignoring blank bullets', () => {
  const resume = emptyResume();
  resume.sections = [{ id: 'custom', type: 'custom', title: 'Research & Publications', entries: [{ title: 'Paper title', subtitle: '', dates: '', location: '', details: '\nMy exact words.\n\nSecond point.' }] }, { id: 'skills', type: 'skills', title: 'Skills', entries: [{ title: 'Languages', details: 'C, Rust' }] }];
  const html = renderResume(resume);
  assert.ok(html.indexOf('Research &amp; Publications') < html.indexOf('Skills'));
  assert.equal((html.match(/<li>/g) || []).length, 2);
  const tex = toLatex(resume);
  assert.ok(tex.indexOf('Research \\& Publications') < tex.indexOf('\\section{Skills}'));
  assert.match(tex, /\\resumeItem\{My exact words\.\}/);
});
