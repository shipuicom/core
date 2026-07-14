import { defineConfig } from '@playwright/test';

/**
 * E2E harness for the experimental editor (/editors-exp).
 *
 * Runs against the dev server so `window.ng` is available — the specs read the
 * live AST straight off the component to assert the editor's core invariant
 * (DOM text ≡ AST text) under real keyboard/IME event streams.
 */
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
    baseURL: 'http://localhost:4205',
  },
  webServer: {
    command: 'npx ng serve --port=4205',
    url: 'http://localhost:4205',
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
