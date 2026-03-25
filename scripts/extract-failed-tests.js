#!/usr/bin/env node
/**
 * Extracts failed tests from vitest JSON output and writes a human-readable log.
 * Run via: npm run test:log
 * Output: test-results/failed-tests.log
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const INPUT = 'test-results/failed-tests.json';
const OUTPUT = 'test-results/failed-tests.log';

if (!existsSync(INPUT)) {
  console.log('No test results found. Run tests first.');
  process.exit(0);
}

const results = JSON.parse(readFileSync(INPUT, 'utf-8'));
const lines = [];
const timestamp = new Date().toISOString();

lines.push(`Test Failure Report — ${timestamp}`);
lines.push(`${'='.repeat(60)}`);
lines.push('');

const failedSuites = (results.testResults ?? []).filter(
  (suite) => suite.status === 'failed'
);

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
          // Indent each line of the error message
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

mkdirSync('test-results', { recursive: true });
writeFileSync(OUTPUT, lines.join('\n'), 'utf-8');
console.log(`\n📄 Failure log written to: ${OUTPUT}`);
