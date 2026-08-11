import { defineConfig } from '@playwright/test';

/**
 * Runs the e2e specs against the prerendered SSG output in
 * `dist/design-system/browser` — exactly what production serves. Build first
 * (`bun run build:docs`), then:
 *
 *   npx playwright test -c scripts/editor-e2e/playwright.static.config.ts
 *
 * Useful when the dev server is unavailable, and as a production-parity run.
 */
const PORT = Number(process.env['EDITOR_E2E_STATIC_PORT'] ?? 4321);

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx http-server dist/design-system/browser -p ${PORT} -c-1 --silent`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    cwd: '../..',
    timeout: 30_000,
  },
  projects: [{ name: 'editor-e2e-static' }],
});
