import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:3200' },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: { command: 'npm start -- --hostname 127.0.0.1 --port 3200', url: 'http://127.0.0.1:3200', reuseExistingServer: false, env: { DATABASE_URL: '', WHATSAPP_NUMBER: '51999999999' } },
});
