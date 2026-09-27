import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/admin-browser',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:3202' },
  projects: [320, 768, 1280].map(width => ({ name: `admin-${width}`, use: { viewport: { width, height: 900 } } })),
  webServer: { command: 'npm start -- --hostname 127.0.0.1 --port 3202', url: 'http://127.0.0.1:3202', reuseExistingServer: false },
});
