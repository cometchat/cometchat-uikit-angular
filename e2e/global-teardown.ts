/**
 * Playwright Global Teardown
 *
 * Runs ONCE after all test files complete.
 * - Permanently deletes all E2E-created groups and users
 * - Leaves permanent fixture users (cometchat-uid-1..5) intact
 *
 * This ensures no test data accumulates between runs.
 */

import dotenv from 'dotenv';
import path from 'path';
import { cleanupTestData } from './helpers/seed';

// Load .env before accessing process.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] Cleaning up E2E test data...');
  await cleanupTestData();
  console.log('[global-teardown] Teardown complete.\n');
}
