import type { Page } from '@playwright/test';

/**
 * Let `ms` pass before checking that something did NOT happen (a request, a reply, a create).
 *
 * The only fixed wait the E2E suite allows: proving an absence needs a period to have passed,
 * and nothing on screen can signal it. Everything else waits on a condition (expect, toPass,
 * waitForResponse), and scripts/ci/check-e2e-sleeps.mjs keeps every other waitForTimeout out.
 * Say in `reason` what the period is long enough for.
 */
export async function expectNothingFor(page: Page, ms: number, reason: string): Promise<void> {
  void reason;
  await page.waitForTimeout(ms);
}
