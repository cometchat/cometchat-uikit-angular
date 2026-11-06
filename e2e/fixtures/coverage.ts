/**
 * Playwright `test` with E2E coverage (E2E 4, ENG-40489). Specs import from here instead of
 * '@playwright/test'; everything else is re-exported unchanged. When E2E_COVERAGE=1, an automatic
 * fixture records V8 JavaScript coverage of the test's page and adds it to the run's report
 * (finalised in global teardown). Otherwise it does nothing.
 */
import { test as base } from '@playwright/test';
import { coverageOptions, E2E_COVERAGE } from '../coverage-options';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MCR = require('monocart-coverage-reports') as typeof import('monocart-coverage-reports');

export * from '@playwright/test';

// With coverage off, specs get Playwright's own `test`: the fixture below needs `page`, which
// would open a page for every test, including the serial specs that manage their own pages.
const withCoverage = base.extend<{ e2eCoverage: void }>({
  e2eCoverage: [
    async ({ page, browserName }, use) => {
      if (browserName !== 'chromium') {
        await use();
        return;
      }
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      const coverage = await page.coverage.stopJSCoverage();
      await MCR(coverageOptions).add(coverage);
    },
    { auto: true },
  ],
});

// The fixture is automatic and adds nothing specs use, so both share Playwright's `test` type.
export const test: typeof base = E2E_COVERAGE ? (withCoverage as unknown as typeof base) : base;
