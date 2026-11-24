/** The frame probe reports a surface's rows only when a probe is installed and they changed. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, describe, expect, it, vi } from 'vitest';
import { offlineMessage, textMessage } from '../../testing/offline-sdk-fake';
import { FrameProbeReporter } from './frame-probe';

describe('FrameProbeReporter', () => {
  const holder = globalThis as { __ccFrameProbe?: unknown };
  afterEach(() => {
    delete holder.__ccFrameProbe;
  });
  const rows = [offlineMessage(textMessage('a'), { id: 3, status: 'SENT', sentAt: 1 })];
  const keyOf = () => () => 'k3';

  it('does nothing when no probe is installed', () => {
    expect(() => new FrameProbeReporter('message-list').report(rows, keyOf)).not.toThrow();
  });

  it('reports key, server id and state, and only again when they change', () => {
    const probe = vi.fn();
    holder.__ccFrameProbe = probe;
    const reporter = new FrameProbeReporter('message-list');
    reporter.report(rows, keyOf);
    reporter.report(rows, keyOf);
    expect(probe).toHaveBeenCalledTimes(1);
    expect(probe).toHaveBeenCalledWith('message-list', [{ key: 'k3', id: '3', state: 'sent' }]);
    reporter.report([], keyOf);
    expect(probe).toHaveBeenCalledTimes(2);
  });

  it('a probe that throws never breaks the list', () => {
    holder.__ccFrameProbe = () => {
      throw new Error('probe');
    };
    expect(() => new FrameProbeReporter('x').report(rows, keyOf)).not.toThrow();
  });
});
