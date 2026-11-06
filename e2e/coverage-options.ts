/**
 * E2E coverage (E2E 4, ENG-40489): which UI Kit source lines the E2E tests execute in the browser.
 *
 * With E2E_COVERAGE=1, every test records Chromium's V8 JavaScript coverage for its page
 * (e2e/fixtures/coverage.ts) and global teardown maps it through the build's source maps onto
 * projects/cometchat-uikit/src. The sample app must be built with source maps
 * (`ng build sample-app --source-map`). Reported next to the Vitest numbers; it is not part of
 * the unit-coverage ratchet until it has been stable for 4 weeks (E2E design doc §8).
 */
import type { CoverageReportOptions } from 'monocart-coverage-reports';

export const E2E_COVERAGE = process.env['E2E_COVERAGE'] === '1';

export const coverageOptions: CoverageReportOptions = {
  name: 'E2E coverage (UI Kit source)',
  outputDir: './coverage-e2e',
  reports: ['v8', 'lcov', 'json-summary', 'console-summary'],
  // Every script the page loads; source maps decide which sources count.
  entryFilter: { '**/*.js': true, '**/*.mjs': true },
  sourceFilter: {
    '**/projects/cometchat-uikit/src/**': true,
    '**/*.spec.ts': false,
    '**/*.stories.ts': false,
    '**/node_modules/**': false,
    '**/sample-app/**': false,
    // Built chunks without a source mapping for a UI Kit file are not UI Kit source.
    '**/localhost*/**': false,
  },
};
