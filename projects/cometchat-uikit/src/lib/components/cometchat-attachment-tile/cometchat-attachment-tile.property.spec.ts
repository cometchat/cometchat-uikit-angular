/**
 * Property-based tests (NFR-2) for the tile status -> affordance mapping.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { affordanceFor } from './cometchat-attachment-tile.component';
import type { AttachmentTileStatus } from '../cometchat-message-composer/cometchat-message-composer.types';

const ALL_STATUSES: AttachmentTileStatus[] = [
  'pending',
  'uploading',
  'uploaded',
  'failed',
  'rejected',
  'cancelled',
  'error',
];

describe('affordanceFor (property)', () => {
  it('returns a valid affordance for every status', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATUSES), (s) =>
        ['progress', 'retry', 'error', 'none'].includes(affordanceFor(s)),
      ),
    );
  });

  it('progress iff the tile is in flight (uploading/pending)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_STATUSES), (s) => {
        const inFlight = s === 'uploading' || s === 'pending';
        return (affordanceFor(s) === 'progress') === inFlight;
      }),
    );
  });

  it('maps the spec exactly', () => {
    expect(affordanceFor('uploading')).toBe('progress');
    expect(affordanceFor('pending')).toBe('progress');
    expect(affordanceFor('failed')).toBe('retry');
    expect(affordanceFor('rejected')).toBe('error');
    expect(affordanceFor('error')).toBe('error');
    expect(affordanceFor('uploaded')).toBe('none');
    expect(affordanceFor('cancelled')).toBe('none');
  });
});
