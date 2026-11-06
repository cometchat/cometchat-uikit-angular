// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decide } from './ci-gate.mjs';

const ok = { result: 'success' };
const skipped = { result: 'skipped' };
const failure = { result: 'failure' };
const allE2e = (r: { result: string }) => ({ 'e2e-smoke': r, 'e2e-full': r, 'e2e-full-report': r });
const intoDev = { e2eEnabled: true, sameRepo: true, baseRef: 'dev-v5' };
const intoRelease = { e2eEnabled: true, sameRepo: true, baseRef: 'release-5.3-v5' };

describe('ci-gate', () => {
  it('passes a PR into dev-v5 when every job, smoke and full E2E included, succeeded', () => {
    expect(decide({ lint: ok, ...allE2e(ok) }, intoDev).ok).toBe(true);
  });

  it('fails when E2E smoke fails', () => {
    const { ok: passed, lines } = decide({ lint: ok, ...allE2e(ok), 'e2e-smoke': failure }, intoDev);
    expect(passed).toBe(false);
    expect(lines).toContain('✗ e2e-smoke: failure');
  });

  it('fails a PR into dev-v5 when the full E2E report fails (a failed test or the quarantine budget)', () => {
    expect(decide({ lint: ok, ...allE2e(ok), 'e2e-full-report': failure }, intoDev).ok).toBe(false);
  });

  it('fails a PR into dev-v5 or master-v5 that skipped full E2E', () => {
    const needs = { lint: ok, 'e2e-smoke': ok, 'e2e-full': skipped, 'e2e-full-report': skipped };
    expect(decide(needs, intoDev).ok).toBe(false);
    expect(decide(needs, { ...intoDev, baseRef: 'master-v5' }).ok).toBe(false);
  });

  it('passes a PR into a release branch with smoke only: full E2E is for promotion PRs', () => {
    const { ok: passed, lines } = decide(
      { lint: ok, 'e2e-smoke': ok, 'e2e-full': skipped, 'e2e-full-report': skipped },
      intoRelease
    );
    expect(passed).toBe(true);
    expect(lines[2]).toMatch(/^- e2e-full: not run/);
  });

  it('passes a PR into ci-sandbox-v5 with smoke only: full E2E there is opt-in', () => {
    const needs = { lint: ok, 'e2e-smoke': ok, 'e2e-full': skipped, 'e2e-full-report': skipped };
    expect(decide(needs, { ...intoDev, baseRef: 'ci-sandbox-v5' }).ok).toBe(true);
  });

  it('fails an opted-in full E2E run on ci-sandbox-v5 that failed', () => {
    const needs = { lint: ok, 'e2e-smoke': ok, 'e2e-full': failure, 'e2e-full-report': failure };
    expect(decide(needs, { ...intoDev, baseRef: 'ci-sandbox-v5' }).ok).toBe(false);
  });

  it('never lets smoke be skipped, even on a release-branch PR', () => {
    expect(decide({ lint: ok, 'e2e-smoke': skipped, 'e2e-full': skipped }, intoRelease).ok).toBe(false);
  });

  it('fails while E2E is not enabled, and says how to enable it', () => {
    const { ok: passed, lines } = decide({ lint: ok, ...allE2e(skipped) }, { ...intoDev, e2eEnabled: false });
    expect(passed).toBe(false);
    expect(lines.find((l) => l.startsWith('✗ e2e-smoke'))).toMatch(/E2E_ENABLED=true, runbook step 2/);
  });

  it('fails a fork PR, which gets no secrets to run E2E, and says why', () => {
    const { ok: passed, lines } = decide({ lint: ok, ...allE2e(skipped) }, { ...intoDev, sameRepo: false });
    expect(passed).toBe(false);
    expect(lines.find((l) => l.startsWith('✗ e2e-smoke'))).toMatch(/fork PRs/);
  });

  it('never lets a non-E2E job be skipped', () => {
    expect(decide({ lint: skipped, ...allE2e(ok) }, intoDev).ok).toBe(false);
  });

  it('passes a draft PR into dev-v5 with every E2E job skipped, and says why', () => {
    const { ok: passed, lines } = decide({ lint: ok, ...allE2e(skipped) }, { ...intoDev, draft: true });
    expect(passed).toBe(true);
    expect(lines.filter((l) => l.startsWith('- e2e-'))).toHaveLength(3);
    expect(lines[1]).toMatch(/^- e2e-smoke: not run \(draft PR; .*marked ready for review\)/);
  });

  it('still fails a draft PR whose other jobs failed', () => {
    expect(decide({ lint: failure, ...allE2e(skipped) }, { ...intoDev, draft: true }).ok).toBe(false);
  });

  it('still fails a draft PR whose E2E did run and failed', () => {
    const needs = { lint: ok, ...allE2e(skipped), 'e2e-smoke': failure };
    expect(decide(needs, { ...intoDev, draft: true }).ok).toBe(false);
  });

  it('requires E2E again once the PR is ready for review', () => {
    expect(decide({ lint: ok, ...allE2e(skipped) }, { ...intoDev, draft: false }).ok).toBe(false);
  });

  it('fails a cancelled job', () => {
    expect(decide({ lint: ok, ...allE2e(ok), 'e2e-full': { result: 'cancelled' } }, intoDev).ok).toBe(false);
  });
});
