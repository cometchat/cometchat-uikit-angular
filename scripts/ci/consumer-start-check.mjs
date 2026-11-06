#!/usr/bin/env node
// CI 3 compat: open the consumer app that scripts/ci/consumer-app.sh built, in headless Chromium,
// and fail if it does not start. `ng build` alone passes even when the bundle throws at load
// time: on Angular 17 the UI Kit's @defer components call an Angular 18 runtime function, and the
// app built cleanly but showed a blank page. Fails on an uncaught page error, or when the root
// component renders no UI Kit element.
//
//   node scripts/ci/consumer-start-check.mjs <built browser dir> [port]
//
// Playwright is resolved from the current directory (the consumer app installs it), not the repo.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
const port = Number(process.argv[3] || 4390);
if (!dir) {
  console.error('usage: node scripts/ci/consumer-start-check.mjs <built browser dir> [port]');
  process.exit(2);
}
const { chromium } = createRequire(`${process.cwd()}/`)('playwright');
const server = spawn(process.execPath, [fileURLToPath(new URL('./serve-static.mjs', import.meta.url)), dir, String(port)], {
  stdio: ['ignore', 'ignore', 'inherit'],
});
const url = `http://localhost:${port}/`;

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`the static server did not start on ${url}`);
}

let failed = false;
try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(`  console error: ${message.text()}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  const rendered = await page
    .locator('app-root cometchat-avatar')
    .first()
    .waitFor({ state: 'attached', timeout: 15_000 })
    .then(() => true, () => false);
  await browser.close();
  if (pageErrors.length) {
    failed = true;
    console.error(`✗ the app threw while starting:\n  ${pageErrors.join('\n  ')}`);
  }
  if (!rendered) {
    failed = true;
    console.error('✗ app-root rendered no UI Kit element (blank page)');
  }
  if (!failed) console.log('✓ the built app starts in a browser and renders the UI Kit');
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
