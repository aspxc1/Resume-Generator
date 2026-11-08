import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function enterExperience(page) {
  await page.getByRole('button', { name: 'Experience', exact: true }).click();
  await page.getByRole('button', { name: 'Add experience' }).click();
  await page.getByLabel('Role / position').fill('Firmware Engineer');
  await page.getByLabel('Company / organization').fill('User Entered Co.');
  await page.getByLabel('Bullet points').fill('Reduced boot time by 23%.\nBuilt C++ & Python_3 tools.');
}

test('edits exact user content, persists it, and exports complete LaTeX', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('#resume')).toBeEmpty();
  await page.getByLabel('Full name').fill('Zoë Engineer');
  await page.getByLabel('Email').fill('zoe@example.com');
  await enterExperience(page);
  await expect(page.locator('#resume')).toContainText('Reduced boot time by 23%.');
  await page.reload();
  await expect(page.locator('#resume')).toContainText('Zoë Engineer');
  await expect(page.locator('#resume')).toContainText('Built C++ & Python_3 tools.');
  await page.getByRole('button', { name: 'LaTeX source' }).click();
  await expect(page.getByLabel('Generated LaTeX code')).toHaveValue(/\\resumeItem\{Reduced boot time by 23\\%\.\}/);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy code' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Zoë Engineer');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .tex' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('Zoë-Engineer-resume.tex');
  expect(await readFile(await download.path(), 'utf8')).toBe(await page.getByLabel('Generated LaTeX code').inputValue());
  await expect(page.getByLabel('Generated LaTeX code')).toHaveValue(/\\end\{document\}/);
});

test('supports custom sections, ordering, entry deletion and paper settings', async ({ page }) => {
  await page.goto('/');
  await enterExperience(page);
  await page.getByRole('button', { name: 'Add custom section' }).click();
  await page.getByLabel('Section heading').fill('Certifications');
  await page.getByRole('button', { name: 'Add entry' }).click();
  await page.getByLabel('Title', { exact: true }).fill('Professional Engineer');
  await page.getByRole('button', { name: 'Move section up' }).click();
  await page.getByRole('button', { name: 'Move section up' }).click();
  await page.getByRole('button', { name: 'Move section up' }).click();
  expect(await page.locator('#resume h2').allTextContents()).toEqual(['Certifications', 'Experience']);
  await page.getByLabel('Paper size').selectOption('a4');
  await expect(page.locator('#resume')).toHaveAttribute('data-paper', 'a4');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Remove entry 1' }).click();
  await expect(page.locator('#resume')).not.toContainText('Certifications');
});

test('valid backups import and malformed files leave current work intact', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Full name').fill('Keep My Work');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save backup' }).click();
  const backup = await downloadPromise;
  await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1}') });
  await expect(page.getByRole('alert')).toContainText('not a supported resume backup');
  await expect(page.locator('#resume')).toContainText('Keep My Work');
  await page.getByLabel('Full name').fill('Changed');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#import-file').setInputFiles(await backup.path());
  await expect(page.getByLabel('Full name')).toHaveValue('Keep My Work');
});

test('remains usable when local storage fails and renders unsafe input as text', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Unavailable'); }; });
  await page.goto('/');
  await page.getByLabel('Full name').fill('<img src=x onerror=alert(1)>');
  await expect(page.getByRole('status')).toContainText('backup');
  await expect(page.locator('#resume img')).toHaveCount(0);
  await expect(page.locator('#resume')).toContainText('<img src=x onerror=alert(1)>');
  await page.getByLabel('GitHub URL').fill('javascript:alert(1)');
  await expect(page.locator('#resume a')).toHaveCount(0);
});

test('mobile editor does not overflow the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Full name').fill('Mobile Engineer');
  await enterExperience(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Print / Save PDF' })).toBeVisible();
});

test('oversized edits keep the last restorable draft', async ({ page }) => {
  const { emptyResume } = await import('../../src/resume.js');
  const resume = emptyResume();
  resume.sections[1].entries = Array.from({ length: 39 }, () => ({ title: 'Role', details: 'a'.repeat(50000) }));
  await page.addInitScript(data => { if (!localStorage.getItem('jakes-resume:v1')) localStorage.setItem('jakes-resume:v1', JSON.stringify(data)); }, resume);
  await page.goto('/');
  await page.getByLabel('Full name').fill('Original name');
  await page.getByLabel('Full name').fill('b'.repeat(50000));
  await expect(page.getByRole('alert')).toContainText('size limit');
  await expect(page.getByLabel('Full name')).toHaveValue('Original name');
  await page.reload();
  await expect(page.locator('#resume h1')).toHaveText('Original name');
});

test('long content prints over multiple pages with selectable user text', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('Full name').fill('Print Verification');
  await enterExperience(page);
  await page.getByLabel('Bullet points').fill(Array.from({ length: 65 }, (_, i) => `User bullet ${i + 1}: Tested embedded systems, validated engineering requirements and documented the result.`).join('\n'));
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.app-header')).toBeHidden();
  await expect(page.locator('#resume')).toBeVisible();
  const pdf = await page.pdf({ preferCSSPageSize: true, path: testInfo.outputPath('long-resume.pdf') });
  expect(pdf.length).toBeGreaterThan(15000);
  expect((pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length).toBeGreaterThan(1);
});
