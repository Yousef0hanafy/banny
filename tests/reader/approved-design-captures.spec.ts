import { test, expect } from '@playwright/test';
import path from 'node:path';

// Review artifacts captured during the same isolated production-browser gate.
// These are captures, not assertions of pixel fidelity or automated UX scoring.
const surfaces = [
  ['home', '/'],
  ['explore', '/explore'],
  ['work', '/series/qa-reader-webtoon'],
  ['reader', '/read/webtoon/qa-reader-webtoon/1'],
] as const;

for (const [name, route] of surfaces) {
  test(`approved design capture: ${name}`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    if (name === 'home') await expect(page.getByRole('region', { name: 'وحدة القراءة الرئيسية', exact: true }).getByRole('heading')).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).filter(i => i.complete || i.loading !== 'lazy').map(i => i.decode().catch(() => {})));
    });
    await page.screenshot({ path: path.join(process.env.READER_QA_RUN_DIR!, `${name}-${testInfo.project.name}.png`), fullPage: false, animations: 'disabled' });
  });
}
