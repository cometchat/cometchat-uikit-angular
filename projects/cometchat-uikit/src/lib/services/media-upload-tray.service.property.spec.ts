/**
 * Property-based tests (NFR-2) for the MediaUploadTrayService pure helpers.
 *
 * - computeAggregate: byte-weighted progress, never an average of per-tile percentages.
 * - deriveCanSend: send-gate truth table over tile statuses.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeAggregate,
  deriveCanSend,
  mimeMatches,
} from './media-upload-tray.service';
import type {
  AttachmentFile,
  AttachmentTileStatus,
} from '../components/cometchat-message-composer/cometchat-message-composer.types';

function tile(partial: Partial<AttachmentFile>): AttachmentFile {
  return {
    id: 'x',
    file: new File([new Uint8Array(1)], 'x'),
    type: 'file',
    name: 'x',
    size: partial.total ?? 0,
    uploadProgress: 0,
    status: 'uploading',
    ...partial,
  } as AttachmentFile;
}

const statusArb = fc.constantFrom<AttachmentTileStatus>(
  'pending',
  'uploading',
  'uploaded',
  'failed',
  'rejected',
  'cancelled',
);

describe('computeAggregate (property)', () => {
  it('percent equals the byte-weighted ratio and stays within [0,100]', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ total: fc.nat(1_000_000), ratio: fc.double({ min: 0, max: 1, noNaN: true }) }),
          { maxLength: 25 },
        ),
        (rows) => {
          const tiles = rows.map((r) =>
            tile({ total: r.total, loaded: Math.round(r.total * r.ratio) }),
          );
          const { loaded, total, percent } = computeAggregate(tiles);
          const expected = total > 0 ? Math.round((loaded / total) * 100) : 0;
          return percent === expected && percent >= 0 && percent <= 100;
        },
      ),
    );
  });

  it('is byte-weighted, not the average of per-tile percentages', () => {
    // Tile A: 1000/1000 = 100%. Tile B: 0/1 = 0%.
    // Weighted = 1000/1001 -> rounds to 100. Naive average would be 50.
    const tiles = [
      tile({ loaded: 1000, total: 1000 }),
      tile({ loaded: 0, total: 1 }),
    ];
    expect(computeAggregate(tiles).percent).toBe(100);
  });

  it('returns 0% when there is nothing to upload', () => {
    expect(computeAggregate([]).percent).toBe(0);
    expect(computeAggregate([tile({ loaded: 0, total: 0 })]).percent).toBe(0);
  });
});

describe('deriveCanSend (property)', () => {
  it('matches the spec: no tile in flight AND at least one uploaded', () => {
    fc.assert(
      fc.property(fc.array(statusArb, { minLength: 1, maxLength: 12 }), (statuses) => {
        const tiles = statuses.map((s) => tile({ status: s }));
        const inFlight = statuses.some((s) => s === 'uploading' || s === 'pending');
        const anyUploaded = statuses.some((s) => s === 'uploaded');
        return deriveCanSend(tiles) === (!inFlight && anyUploaded);
      }),
    );
  });

  it('is false for an empty tray', () => {
    expect(deriveCanSend([])).toBe(false);
  });

  it('concrete cases', () => {
    expect(deriveCanSend([tile({ status: 'uploaded' }), tile({ status: 'rejected' })])).toBe(true);
    expect(deriveCanSend([tile({ status: 'uploaded' }), tile({ status: 'uploading' })])).toBe(false);
    expect(deriveCanSend([tile({ status: 'rejected' })])).toBe(false);
  });
});

describe('mimeMatches (property)', () => {
  it('wildcard subtype matches its family', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('image/png', 'image/jpeg', 'image/gif', 'image/webp'),
        (t) => mimeMatches(t, 'image/*'),
      ),
    );
  });

  it('* matches anything', () => {
    fc.assert(fc.property(fc.string(), (t) => mimeMatches(t, '*')));
  });

  it('exact and mismatch cases', () => {
    expect(mimeMatches('image/png', 'image/png')).toBe(true);
    expect(mimeMatches('image/png', 'image/jpeg')).toBe(false);
    expect(mimeMatches('application/pdf', 'image/*')).toBe(false);
    expect(mimeMatches('video/mp4', 'video/*')).toBe(true);
  });
});
