#!/usr/bin/env node
/**
 * Extracts failed tests from vitest JSON output and writes:
 *   - test-results/failed-tests.json  — only failed suites/tests (filtered)
 *   - test-results/failed-tests.log   — human-readable failure report
 *
 * Run via: npm run test:log
 * Input:   test-results/vitest-full-results.json  (written by vitest json reporter)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';

const INPUT = 'test-results/vitest-full-results.json';
const LEGACY_INPUT = 'test-results/failed-tests.json'; // pre-rename fallback
const OUTPUT = 'test-results/failed-tests.log';
const FAILED_JSON = 'test-results/failed-tests.json';

// Resolve input — prefer new filename, fall back to legacy if not yet re-run
const resolvedInput = existsSync(INPUT)
  ? INPUT
  : existsSync(LEGACY_INPUT)
  ? LEGACY_INPUT
  : null;

if (!resolvedInput) {
  console.log('No test results found. Run tests first.');
  process.exit(0);
}

if (resolvedInput === LEGACY_INPUT) {
  console.warn(
    `⚠️  Reading from legacy ${LEGACY_INPUT}. Re-run "npm test" to generate ${INPUT}.`
  );
}

const results = JSON.parse(readFileSync(resolvedInput, 'utf-8'));
const timestamp = new Date().toISOString();

// --- Filter to failed suites/tests only ---
const failedSuites = (results.testResults ?? []).filter(
  (suite) => suite.status === 'failed'
);

// Build the filtered JSON — only failed suites, only failed assertions within them
const failedJson = {
  numTotalTestSuites: results.numTotalTestSuites,
  numPassedTestSuites: results.numPassedTestSuites,
  numFailedTestSuites: results.numFailedTestSuites,
  numTotalTests: results.numTotalTests,
  numPassedTests: results.numPassedTests,
  numFailedTests: results.numFailedTests,
  startTime: results.startTime,
  success: results.success,
  testResults: failedSuites.map((suite) => ({
    name: suite.name,
    status: suite.status,
    message: suite.message,
    startTime: suite.startTime,
    endTime: suite.endTime,
    assertionResults: (suite.assertionResults ?? []).filter(
      (t) => t.status === 'failed'
    ),
  })),
};

mkdirSync('test-results', { recursive: true });
writeFileSync(FAILED_JSON, JSON.stringify(failedJson, null, 2), 'utf-8');

// --- Build human-readable log ---
const lines = [];
lines.push(`Test Failure Report — ${timestamp}`);
lines.push(`${'='.repeat(60)}`);
lines.push('');

if (failedSuites.length === 0) {
  lines.push('✅ All tests passed!');
} else {
  lines.push(`❌ ${failedSuites.length} suite(s) with failures\n`);

  for (const suite of failedSuites) {
    lines.push(`FILE: ${suite.name}`);
    lines.push('-'.repeat(60));

    const failedTests = (suite.assertionResults ?? []).filter(
      (t) => t.status === 'failed'
    );

    for (const test of failedTests) {
      lines.push(`  ✗ ${test.fullName}`);
      if (test.failureMessages?.length) {
        for (const msg of test.failureMessages) {
          const indented = msg
            .split('\n')
            .map((l) => `      ${l}`)
            .join('\n');
          lines.push(indented);
        }
      }
      lines.push('');
    }
  }

  lines.push('');
  lines.push(`Total failed suites : ${failedSuites.length}`);
  lines.push(
    `Total failed tests  : ${failedSuites.reduce(
      (acc, s) => acc + (s.assertionResults ?? []).filter((t) => t.status === 'failed').length,
      0
    )}`
  );
}

writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');
console.log(`\n📄 Failure log written to: ${OUTPUT}`);
console.log(`📋 Failed tests JSON written to: ${FAILED_JSON}`);
