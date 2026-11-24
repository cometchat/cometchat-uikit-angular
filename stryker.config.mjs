// CI 4 mutation testing (ENG-40486 / ENG-40612). Stryker changes the code under test in small ways
// (flips a condition, drops a call, changes a value) and reruns the tests that cover it. A mutant
// that no test notices is a gap the coverage number can't show. Scoped to the services where a
// silent regression costs most, and run on promotion PRs only (it is slow).
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.config.ts' },
  coverageAnalysis: 'perTest',
  mutate: (process.env.STRYKER_MUTATE ?? [
    'projects/cometchat-uikit/src/lib/services/html-sanitizer.service.ts',
    'projects/cometchat-uikit/src/lib/services/message-list.*.ts',
    'projects/cometchat-uikit/src/lib/services/message-composer.service.ts',
    'projects/cometchat-uikit/src/lib/services/message-composer.utils.ts',
    'projects/cometchat-uikit/src/lib/services/call-buttons.service.ts',
    'projects/cometchat-uikit/src/lib/services/incoming-call.service.ts',
    'projects/cometchat-uikit/src/lib/services/outgoing-call.service.ts',
    '!**/*.spec.ts',
    '!**/*.types.ts',
  ].join(',')).split(','),
  reporters: ['clear-text', 'progress', 'json', 'html'],
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  thresholds: { high: 80, low: 60, break: Number(process.env.STRYKER_BREAK ?? 0) || null },
  concurrency: Number(process.env.STRYKER_CONCURRENCY ?? 2),
  // Runners are slower than laptops; a short limit turned slowness into "timed out" mutants, which
  // Stryker counts as caught (88.9% on a runner vs 55.6% locally for the same line).
  timeoutFactor: 4,
  timeoutMS: 60000,
  tempDirName: '.stryker-tmp',
};
