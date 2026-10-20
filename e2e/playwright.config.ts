import { defineConfig, devices } from '@playwright/test';

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    // Software WebGL so Phaser renders in headless Chromium on any machine.
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @casino/server start',
      url: 'http://localhost:3001/health',
      env: { CASINO_BOTS: '6', CASINO_SEED: '7', CASINO_LOG_LEVEL: 'warn' },
      reuseExistingServer,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @casino/game dev',
      url: 'http://localhost:5173',
      reuseExistingServer,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @casino/dashboard dev',
      url: 'http://localhost:5174',
      reuseExistingServer,
      timeout: 60_000,
    },
  ],
});
