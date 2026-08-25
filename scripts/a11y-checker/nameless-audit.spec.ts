import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, Page } from '@playwright/test';

/**
 * Regression gate: crawls every docs page (overview + examples tabs) and
 * fails when any interactive element would be announced by a screen reader
 * WITHOUT an accessible name (a bare "button", "checkbox", "slider" …).
 * Name/role computation is the sh-screenreader simulator's, which is itself
 * verified against Chromium's accessibility tree and the WPT accname suite
 * in screenreader-verify.spec.ts.
 *
 * Requires the docs app on localhost:4205 (same as checker.spec.ts).
 */

/** Roles whose instances must have an accessible name. */
const NAMED_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'textbox', 'searchbox', 'combobox',
  'listbox', 'option', 'tab', 'switch', 'slider', 'spinbutton', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'progressbar', 'treeitem',
]);

/** Pages allowed to have nameless elements, with the reason. */
const KNOWN_GAPS: Record<string, string> = {
  '/editors': 'sh-editor internal inputs — deferred (see ship-screenreader memory)',
};

const BUNDLE = join(__dirname, '.generated', 'screenreader-verify.bundle.js');

test.describe('docs-wide nameless-announcement audit', () => {
  test.beforeAll(() => {
    mkdirSync(join(__dirname, '.generated'), { recursive: true });
    execSync(
      `bun build "${join(__dirname, 'screenreader-verify.entry.ts')}" --target=browser --format=esm --outfile="${BUNDLE}"`,
      { stdio: 'pipe' },
    );
  });

  test('every interactive element on every docs page has an accessible name', async ({ page }) => {
    test.setTimeout(300_000);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const links: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button[routerlink]'))
        .map((b) => b.getAttribute('routerlink')!)
        .filter((link) => link && link !== '/'),
    );
    expect(links.length, 'sidebar links found').toBeGreaterThan(20);

    const failures: string[] = [];
    const gapReports: string[] = [];

    for (const link of links) {
      for (const path of [link, `${link}/examples`]) {
        const nameless = await auditPage(page, path);
        if (nameless === null) continue; // route does not exist
        if (nameless.length === 0) continue;

        const report = `${path}:\n  ${nameless.join('\n  ')}`;
        if (KNOWN_GAPS[link]) gapReports.push(report);
        else failures.push(report);
      }
    }

    if (gapReports.length) {
      console.log(`Known gaps (allowed):\n${gapReports.join('\n')}`);
    }

    expect(
      failures,
      `Interactive elements a screen reader would announce without a name.\n` +
        `Give each a label (visible text, aria-label, associated <label>, or the component's label input).\n\n` +
        failures.join('\n\n'),
    ).toEqual([]);
  });
});

async function auditPage(page: Page, path: string): Promise<string[] | null> {
  const response = await page.goto(path);
  if (!response || response.status() >= 400) return null;
  await page.waitForLoadState('networkidle');
  // Allow client hydration + deferred demo rendering to settle.
  await page.waitForTimeout(400);
  await page.addScriptTag({ path: BUNDLE, type: 'module' });

  return page.evaluate((namedRoles: string[]) => {
    const sr = window.__shipScreenreader;
    const roles = new Set(namedRoles);
    const main = document.querySelector('main') ?? document.body;
    const els = Array.from(
      main.querySelectorAll('button, a[href], input, select, textarea, [role], [tabindex]'),
    ).filter(
      (el) =>
        !el.closest('sh-screenreader, [data-ship-screenreader]') &&
        el.getAttribute('tabindex') !== '-1' &&
        !el.closest('.anchor-link'),
    );

    const nameless: string[] = [];
    for (const el of els) {
      if (sr.isAccHidden(el)) continue;
      const role = el.getAttribute('role')?.trim().split(/\s+/)[0] || sr.computeRole(el);
      if (!roles.has(role)) continue;
      if (sr.computeAccessibleName(el).trim()) continue;
      nameless.push(
        `<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : ''} …> announced as bare "${role}"`,
      );
    }
    return [...new Set(nameless)];
  }, Array.from(NAMED_ROLES));
}
