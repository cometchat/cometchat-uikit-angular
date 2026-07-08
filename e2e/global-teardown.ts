/**
 * Playwright Global Teardown
 *
 * Runs ONCE after all test files complete.
 * - Permanently deletes all E2E-created groups and users
 * - Leaves permanent fixture users (cometchat-uid-1..5) intact
 * - Finalizes the monocart V8 coverage report (outputs LCOV + HTML)
 *
 * This ensures no test data accumulates between runs.
 */

import dotenv from 'dotenv';
import path from 'path';
import { cleanupTestData } from './helpers/seed';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MCR = require('monocart-coverage-reports') as typeof import('monocart-coverage-reports');

// Load .env before accessing process.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] Cleaning up E2E test data...');
  await cleanupTestData();
  console.log('[global-teardown] Teardown complete.\n');

  // Finalize coverage report — generates coverage-e2e/lcov.info + HTML
  console.log('[global-teardown] Generating E2E coverage report...');
  const mcr = MCR({
    name: 'E2E Coverage Report',
    outputDir: './coverage-e2e',
    reports: ['v8', 'lcov', 'json-summary'],
    entryFilter: {
      '**/projects/cometchat-uikit/src/**': true,
      '**/node_modules/**': false,
      '**/sample-app/**': false,
      '**/.angular/**': false,
    },
    sourceFilter: {
      '**/projects/cometchat-uikit/src/**': true,
      '**/node_modules/**': false,
      '**/sample-app/**': false,
    },
  });
  await mcr.generate();
  console.log('[global-teardown] E2E coverage report written to ./coverage-e2e/\n');
}
