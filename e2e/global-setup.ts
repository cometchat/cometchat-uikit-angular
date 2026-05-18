/**
 * Playwright Global Setup
 *
 * Runs ONCE before all test files.
 * - Deletes any leftover E2E data from previous runs
 * - Creates fresh test groups and seeds messages
 *
 * This ensures every test run starts with a clean, known state.
 */

import dotenv from 'dotenv';
import path from 'path';
import { seedTestData } from './helpers/seed';

// Load .env before accessing process.env
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export default async function globalSetup(): Promise<void> {
  console.log('\n[global-setup] Seeding fresh E2E test data...');
  await seedTestData();
  console.log('[global-setup] Setup complete.\n');
}
