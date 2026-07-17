import { defineConfig } from '@playwright/test';

/**
 * E2E harness for the experimental editor (/editors).
 *
 * Runs against the dev server so `window.ng` is available — the specs read the
 * live AST straight off the component to assert the editor's core invariant
 * (DOM text ≡ AST text) under real keyboard/IME event streams.
 */
const PORT = Number(process.env['EDITOR_E2E_PORT'] ?? 4205);

export default defineConfig({
  testDir: '.',
  // *.e2e.ts (not *.spec.ts) so vitest's default include never picks these up.
  testMatch: '**/*.e2e.ts',
  timeout: 120_000,
  // The invariant specs mutate one shared editor instance — keep them serial.
  fullyParallel: false,
  workers: 1,
  use: {
    headless: true,
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `npx ng serve --port=${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 300_000, // cold ng serve build on CI runners

  },
  projects: [
    {
      name: 'editor-e2e',
      use: { browserName: 'chromium' },
    },
  ],
});
