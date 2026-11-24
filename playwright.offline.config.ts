import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Offline support E2E: the sample app, built with `-c offline-e2e`, against the
 * offline conformance harness's local fake CometChat server. No real App ID,
 * keys or network are used.
 *
 * Needs:
 *   - OFFLINE_CONFORMANCE_DIR: a checkout of adityagokula2210/offline-conformance
 *     (its `server/` is started with TLS; run `npm install` and `npm run certs` in it once)
 *   - a Chat SDK with offline support installed (4.3.1 or later)
 *
 * Usage:
 *   OFFLINE_CONFORMANCE_DIR=../offline-conformance npx playwright test -c playwright.offline.config.ts
 */
const harness = process.env['OFFLINE_CONFORMANCE_DIR'] ? path.resolve(process.env['OFFLINE_CONFORMANCE_DIR']) : '';
const serverDir = harness ? path.join(harness, 'server') : '';
export const OFFLINE_SERVER = {
  dataPort: 48787,
  wsPort: 48788,
  controlPort: 48789,
};

export default defineConfig({
  testDir: './e2e/offline',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-offline' }]],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: 'http://localhost:4300',
    // The SDK hard-codes https:// and wss://; the fake server uses a local CA.
    ignoreHTTPSErrors: true,
    // The fake server sends no CORS headers (the harness drives it from Node); real CometChat does.
    launchOptions: { args: ['--disable-web-security'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // PW_CHROME_CHANNEL=chrome uses an installed Google Chrome instead of Playwright's download.
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.env['PW_CHROME_CHANNEL'] ? { channel: process.env['PW_CHROME_CHANNEL'] } : {}) } }],
  webServer: harness
    ? [
        {
          command: `node src/index.mjs`,
          cwd: serverDir,
          env: {
            PORT: String(OFFLINE_SERVER.dataPort),
            WS_PORT: String(OFFLINE_SERVER.wsPort),
            CONTROL_PORT: String(OFFLINE_SERVER.controlPort),
            TLS_CERT: path.join(serverDir, 'certs', 'leaf.pem'),
            TLS_KEY: path.join(serverDir, 'certs', 'leaf.key'),
            QUIET: '1',
            // The SDK learns a dashboard kill switch from the settings-hash ping (UIT-LIFE-04).
            ANALYTICS_PING_DISABLED: '0',
          },
          url: `http://127.0.0.1:${OFFLINE_SERVER.controlPort}/requests`,
          reuseExistingServer: true,
          timeout: 30_000,
        },
        {
          command: 'npx ng serve sample-app -c offline-e2e --port 4300',
          url: 'http://localhost:4300',
          reuseExistingServer: true,
          timeout: 300_000,
        },
      ]
    : undefined,
});
