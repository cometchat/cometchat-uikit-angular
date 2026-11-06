import type { TestRunnerConfig } from '@storybook/test-runner';

/**
 * CI 4 storybook-test-runner (ENG-40484): every story renders, its play function passes, and
 * (via `a11y: { test: 'error' }` in preview.ts) it has no axe violations.
 *
 * Stories that fail today are tagged `quarantine` and ticketed; they are skipped here until
 * fixed. The quarantine list may only shrink.
 */
const config: TestRunnerConfig = {
  tags: {
    exclude: ['quarantine'],
  },
};

export default config;
