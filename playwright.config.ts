import { createServer } from 'node:net';
import { defineConfig, devices } from '@playwright/test';

const base =
  process.env.GITHUB_REPOSITORY === 'sionrbot/personal-blog-acceptance'
    ? '/personal-blog-acceptance/'
    : '/personal-blog/';

// Let the OS choose a free local port; workers inherit the parent selection.
if (!process.env.BOOTSTRAP_PREVIEW_PORT) {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const address = listener.address();
  if (!address || typeof address === 'string')
    throw new Error('No preview port allocated');
  process.env.BOOTSTRAP_PREVIEW_PORT = String(address.port);
  await new Promise<void>((resolve, reject) =>
    listener.close((error) => (error ? reject(error) : resolve())),
  );
}
const port = process.env.BOOTSTRAP_PREVIEW_PORT;

export default defineConfig({
  testDir: './tests/bootstrap',
  outputDir: './test-results/browser',
  testMatch: '*.spec.ts',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 0,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}${base}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: `pnpm preview --ignore-lock --port ${port}`,
    url: `http://127.0.0.1:${port}${base}`,
    reuseExistingServer: false,
  },
});
