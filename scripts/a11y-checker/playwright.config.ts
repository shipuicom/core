import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    headless: true,
    baseURL: 'http://localhost:4205',
  },
  projects: [
    {
      name: 'a11y-checker',
      use: {
        browserName: 'chromium',
        connectOptions: process.env['LIGHTPANDA_URL'] ? {
          wsEndpoint: process.env['LIGHTPANDA_URL'],
        } : undefined,
      },
    },
  ],
});
