import { test, expect } from '@playwright/test';
import { emptyResume } from '../../src/resume.js';

test('all standard sections fit and export on Letter and A4', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const resume = emptyResume();
  resume.basics = { name: 'Alex Morgan', email: 'alex@example.com', phone: '+1 555 012 3456', location: 'Boston, MA', github: 'github.com/alex', linkedin: 'linkedin.com/in/alex', website: '' };
  resume.sections[0].entries = [{ title: 'Example Institute of Technology', subtitle: 'B.S. in Electrical Engineering', location: 'Boston, MA', dates: '2020 – 2024', details: 'Relevant coursework: Embedded Systems, Digital Signal Processing, Control Systems.' }];
  resume.sections[1].entries = [{ title: 'Embedded Systems Engineer', subtitle: 'Example Engineering', location: 'Boston, MA', dates: 'Jun 2024 – Present', details: 'Developed firmware in C++ for a low-power sensor platform.\nReduced power consumption by 18% through duty-cycle optimization.\nValidated signal acquisition on an oscilloscope and documented test results.' }];
  resume.sections[2].entries = [{ title: 'Autonomous Sensor Platform', subtitle: 'C++, Python, STM32, KiCad', dates: 'Jan – May 2024', url: 'https://example.com/project', details: 'Designed a four-layer PCB and wrote hardware abstraction drivers.\nBuilt a Python test harness to verify sensor calibration across 50 trials.' }];
  resume.sections[3].entries = [{ title: 'Languages', details: 'C, C++, Python, MATLAB' }, { title: 'Tools', details: 'Git, Linux, KiCad, SolidWorks, STM32CubeIDE' }];
  await page.addInitScript(data => localStorage.setItem('jakes-resume:v1', JSON.stringify(data)), resume);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/');
  await expect(page.locator('#resume h2')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true });
  const letter = await page.pdf({ preferCSSPageSize: true, path: testInfo.outputPath('resume-letter.pdf') });
  expect((letter.toString('latin1').match(/\/Type \/Page\b/g) || []).length).toBe(1);
  await page.getByLabel('Paper size').selectOption('a4');
  const a4 = await page.pdf({ preferCSSPageSize: true, path: testInfo.outputPath('resume-a4.pdf') });
  expect((a4.toString('latin1').match(/\/Type \/Page\b/g) || []).length).toBe(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
