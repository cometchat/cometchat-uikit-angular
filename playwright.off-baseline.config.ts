import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Offline-OFF baseline (offline TEST-PLAN §5, UIT-OFF-01): one scripted session
 * with offline off, recorded on the baseline kit and compared on this branch.
 * Driven by scripts/offline/off-baseline.sh, which sets:
 *   OFFLINE_CONFORMANCE_DIR  the harness (its fake server)
 *   OFF_BASELINE_APP_DIR     the checkout whose sample app to serve (default: this one)
 *   OFF_BASELINE_PORT        the sample app's port (default 4301, apart from the offline E2E's 4300)
 *   OFF_BASELINE_MODE        record | compare
 *   OFF_BASELINE_LABEL       the baseline's name under e2e/offline-baseline/baselines/
 */
const harness = process.env['OFFLINE_CONFORMANCE_DIR'] ? path.resolve(process.env['OFFLINE_CONFORMANCE_DIR']) : '';
const serverDir = harness ? path.join(harness, 'server') : '';
const appDir = process.env['OFF_BASELINE_APP_DIR'] ? path.resolve(process.env['OFF_BASELINE_APP_DIR']) : process.cwd();
const port = Number(process.env['OFF_BASELINE_PORT'] ?? 4301);

export default defineConfig({
  testDir: './e2e/offline-baseline',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 300_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: `http://localhost:${port}`,
    ignoreHTTPSErrors: true,
    launchOptions: { args: ['--disable-web-security'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], ...(process.env['PW_CHROME_CHANNEL'] ? { channel: process.env['PW_CHROME_CHANNEL'] } : {}) } }],
  webServer: harness
    ? [
        {
          command: 'node src/index.mjs',
          cwd: serverDir,
          env: {
            PORT: '48787', WS_PORT: '48788', CONTROL_PORT: '48789',
            TLS_CERT: path.join(serverDir, 'certs', 'leaf.pem'),
            TLS_KEY: path.join(serverDir, 'certs', 'leaf.key'),
            QUIET: '1',
          },
          url: 'http://127.0.0.1:48789/requests',
          reuseExistingServer: true,
          timeout: 30_000,
        },
        {
          command: `npx ng serve sample-app -c offline-e2e --port ${port}`,
          cwd: appDir,
          url: `http://localhost:${port}`,
          reuseExistingServer: false,
          timeout: 300_000,
        },
      ]
    : undefined,
});
