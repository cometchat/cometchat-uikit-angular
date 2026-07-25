/**
 * VoiceRecordingCoordinatorService Tests
 *
 * At most one composer may hold the microphone. Covers claiming the slot (stopping the previous
 * holder), re-claiming, and the owner-guarded release that keeps a late/stale release from
 * clearing somebody else's slot.
 */
import { describe, it, expect, vi } from 'vitest';
import { VoiceRecordingCoordinatorService } from './voice-recording-coordinator.service';

describe('VoiceRecordingCoordinatorService', () => {
  const composerA = { name: 'A' };
  const composerB = { name: 'B' };

  it('does not stop anyone when the slot is free', () => {
    const svc = new VoiceRecordingCoordinatorService();
    const stopA = vi.fn();
    svc.claim(composerA, stopA);
    expect(stopA).not.toHaveBeenCalled();
  });

  it('stops the previous holder when another composer claims the slot', () => {
    const svc = new VoiceRecordingCoordinatorService();
    const stopA = vi.fn();
    const stopB = vi.fn();

    svc.claim(composerA, stopA);
    svc.claim(composerB, stopB);

    expect(stopA).toHaveBeenCalledOnce(); // A was recording -> asked to stop
    expect(stopB).not.toHaveBeenCalled(); // B is the new holder
  });

  it('never stops the holder when it re-claims its own slot', () => {
    const svc = new VoiceRecordingCoordinatorService();
    const stopA = vi.fn();

    svc.claim(composerA, stopA);
    svc.claim(composerA, stopA);

    expect(stopA).not.toHaveBeenCalled();
  });

  it('releases the slot so the next claim stops nobody', () => {
    const svc = new VoiceRecordingCoordinatorService();
    const stopA = vi.fn();
    const stopB = vi.fn();

    svc.claim(composerA, stopA);
    svc.release(composerA);
    svc.claim(composerB, stopB);

    expect(stopA).not.toHaveBeenCalled(); // A had already let go
  });

  it('ignores a release from a composer that no longer holds the slot', () => {
    const svc = new VoiceRecordingCoordinatorService();
    const stopA = vi.fn();
    const stopB = vi.fn();
    const stopC = vi.fn();

    svc.claim(composerA, stopA);
    svc.claim(composerB, stopB); // B takes over, A is stopped
    stopA.mockClear();

    svc.release(composerA); // A's stale release must NOT free B's slot

    svc.claim({ name: 'C' }, stopC);
    expect(stopB).toHaveBeenCalledOnce(); // B was still the holder, so it got stopped
  });

  /**
   * Stopping the previous owner synchronously drives its recording flag to false, which calls back
   * into release(). The slot must already be cleared so that re-entrant release cannot wipe the
   * incoming holder.
   */
  it('survives a re-entrant release fired from the previous holder\'s stop callback', () => {
    const svc = new VoiceRecordingCoordinatorService();
    const stopB = vi.fn();
    const stopA = vi.fn(() => svc.release(composerA)); // A releases while being stopped

    svc.claim(composerA, stopA);
    svc.claim(composerB, stopB);

    expect(stopA).toHaveBeenCalledOnce();

    // B must still own the slot: a third claim has to stop B.
    const stopC = vi.fn();
    svc.claim({ name: 'C' }, stopC);
    expect(stopB).toHaveBeenCalledOnce();
  });
});
