/**
 * Playwright Global Teardown
 *
 * Runs ONCE after all test files complete.
 * - Permanently deletes this run's E2E-created groups and users (with an isolated run's
 *   own login users)
 * - Leaves permanent fixture users (cometchat-uid-1..5) intact
 * - Finalizes the monocart V8 coverage report (outputs LCOV + HTML)
 *
 * This ensures no test data accumulates between runs.
 */

import dotenv from 'dotenv';
import path from 'path';
import { cleanupTestData } from './helpers/seed';
import { coverageOptions, E2E_COVERAGE } from './coverage-options';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MCR = require('monocart-coverage-reports') as typeof import('monocart-coverage-reports');

// Load .env before accessing process.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] Cleaning up E2E test data...');
  await cleanupTestData();
  console.log('[global-teardown] Teardown complete.\n');

  // E2E coverage (only collected with E2E_COVERAGE=1; see coverage-options.ts)
  if (E2E_COVERAGE) {
    console.log('[global-teardown] Generating E2E coverage report...');
    const results = await MCR(coverageOptions).generate();
    console.log(`[global-teardown] E2E coverage written to ./coverage-e2e (lines ${results?.summary?.lines?.pct ?? 'n/a'}%)\n`);
  }
}
