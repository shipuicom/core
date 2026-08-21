import { Page } from '@playwright/test';

/**
 * Wait until Angular has live component instances for `hostSelector`.
 *
 * The docs app is server-rendered: the DOM (e.g. `.sh-code-line`,
 * `.sh-editor-content`) is present immediately, but `ng.getComponent` returns
 * null — and event handlers are inert — until hydration (or the client
 * re-render of `ngSkipHydration` subtrees) attaches components ~1–2s later.
 * Waiting for element presence alone races that window, which is exactly how
 * these suites went red when hydration was added to the docs build.
 *
 * Resolves when at least `count` hosts match AND every match has a component
 * context — surviving the element swap that `ngSkipHydration` causes.
 */
export async function awaitHydrated(page: Page, hostSelector: string, count = 1): Promise<void> {
  await page.waitForFunction(
    ({ sel, min }) => {
      const ng = (window as any).ng;
      if (!ng?.getComponent) return false;
      const hosts = Array.from(document.querySelectorAll(sel));
      if (hosts.length < min) return false;
      return hosts.every((el) => !!ng.getComponent(el));
    },
    { sel: hostSelector, min: count },
  );
}
