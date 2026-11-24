/** The offline-OFF baseline's comparison (UIT-OFF-01): it must catch real differences and mask only what may vary. */
import { describe, expect, it } from 'vitest';
import { applyRuledOffChanges, Baseline, compareBaselines, eventLine, mask, normalizeRequests } from '../../e2e/offline-baseline/normalize';

const baseline = (requests: string[], events: string[]): Baseline => ({ kit: 'x', recordedAt: '', steps: [{ step: 's', requests, events }] });

describe('offline-OFF baseline comparison', () => {
  it('masks ids that vary per run and clocks, nothing else', () => {
    expect(mask({ muid: 'a', sentAt: 1, text: 'hi', nested: { deviceId: 'd', id: 7 } })).toEqual({ muid: '<masked>', nested: { deviceId: '<masked>', id: 7 }, sentAt: '<masked>', text: 'hi' });
  });

  it('two runs with only masked differences are equal; request order within a step does not matter', () => {
    const a = normalizeRequests([{ method: 'GET', path: '/a', query: {}, body: null }, { method: 'POST', path: '/messages', query: {}, body: { muid: '1', text: 'x' } }]);
    const b = normalizeRequests([{ method: 'POST', path: '/messages', query: {}, body: { muid: '2', text: 'x' } }, { method: 'GET', path: '/a', query: {}, body: null }]);
    expect(compareBaselines(baseline(a, []), baseline(b, []))).toEqual([]);
  });

  it('catches a missing, an extra and a changed request', () => {
    const a = normalizeRequests([{ method: 'GET', path: '/a', query: { per_page: 30 }, body: null }]);
    const b = normalizeRequests([{ method: 'GET', path: '/a', query: { per_page: 50 }, body: null }, { method: 'GET', path: '/b', query: {}, body: null }]);
    const [diff] = compareBaselines(baseline(a, []), baseline(b, []));
    expect(diff.kind).toBe('request');
    expect(diff.missing).toHaveLength(1);
    expect(diff.extra).toHaveLength(2);
  });

  it('ignores the SDK ping and socket log lines', () => {
    expect(normalizeRequests([{ method: 'POST', path: '/v1/ping', query: {}, body: null }, { method: 'WS', path: 'push', query: {}, body: null }])).toEqual([]);
  });

  it('catches a changed payload and a changed event order', () => {
    const one = eventLine({ name: 'E.ccMessageSent', payload: { status: 1, message: { text: 'a' } } });
    const two = eventLine({ name: 'E.ccMessageSent', payload: { status: 2, message: { text: 'a' } } });
    expect(compareBaselines(baseline([], [one]), baseline([], [two]))[0].kind).toBe('event');
    const [order] = compareBaselines(baseline([], [one, two]), baseline([], [two, one]));
    expect(order.extra).toEqual(['(same events, different order)']);
  });

  it('D3/D6 ruling: only metadata.error on ccMessageSent is allowed to appear', () => {
    const before = eventLine({ name: 'E.ccMessageSent', payload: { status: 2, message: { metadata: null } } });
    const after = eventLine({ name: 'E.ccMessageSent', payload: { status: 2, message: { metadata: { error: { code: 'X' } } } } });
    expect(applyRuledOffChanges(after)).toBe(before);
    expect(compareBaselines(baseline([], [before]), baseline([], [after]))).toEqual([]);
    // Integrator metadata must survive the merge.
    const lost = eventLine({ name: 'E.ccMessageSent', payload: { status: 2, message: { metadata: { keep: 1 } } } });
    expect(compareBaselines(baseline([], [lost]), baseline([], [after]))).toHaveLength(1);
    // Any other event's metadata is compared exactly.
    const other = eventLine({ name: 'E.ccMessageEdited', payload: { message: { metadata: { error: 1 } } } });
    expect(applyRuledOffChanges(other)).toBe(other);
  });
});
