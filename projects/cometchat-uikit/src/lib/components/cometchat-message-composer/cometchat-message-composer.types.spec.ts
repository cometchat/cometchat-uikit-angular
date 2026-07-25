import { describe, it, expect } from 'vitest';
import type {
  AttachmentFile,
  AttachmentTileStatus,
} from './cometchat-message-composer.types';

/**
 * U1 — guards the extended AttachmentFile model used by the multi-attachment
 * composer tray. These are primarily compile-time (type) assertions surfaced
 * as runtime checks.
 */
describe('AttachmentFile (extended multi-attachment model)', () => {
  it('accepts the new upload fields and the widened status union', () => {
    const allStatuses: AttachmentTileStatus[] = [
      'pending',
      'uploading',
      'uploaded',
      'failed',
      'rejected',
      'cancelled',
      'error',
    ];

    const tile: AttachmentFile = {
      id: 'local-1',
      fileId: 'sdk-file-1',
      file: new File(['x'], 'photo.png', { type: 'image/png' }),
      type: 'image',
      name: 'photo.png',
      size: 1024,
      mimeType: 'image/png',
      thumbnailUrl: 'blob:preview',
      uploadProgress: 42,
      loaded: 430,
      total: 1024,
      status: 'uploading',
    };

    expect(tile.fileId).toBe('sdk-file-1');
    expect(tile.mimeType).toBe('image/png');
    expect(tile.loaded).toBe(430);
    expect(tile.total).toBe(1024);
    expect(allStatuses).toContain(tile.status);
  });

  it('remains backward compatible with the legacy shape', () => {
    const legacy: AttachmentFile = {
      id: '1',
      file: new File(['x'], 'notes.txt', { type: 'text/plain' }),
      type: 'file',
      name: 'notes.txt',
      size: 1,
      uploadProgress: 0,
      status: 'pending',
    };

    expect(legacy.status).toBe('pending');
    expect(legacy.fileId).toBeUndefined();
  });

  it('supports terminal statuses (uploaded/failed/rejected/cancelled)', () => {
    const terminal: AttachmentTileStatus[] = [
      'uploaded',
      'failed',
      'rejected',
      'cancelled',
    ];
    terminal.forEach((status) => {
      const tile: AttachmentFile = {
        id: status,
        file: new File(['x'], 'a'),
        type: 'file',
        name: 'a',
        size: 1,
        uploadProgress: 100,
        status,
      };
      expect(tile.status).toBe(status);
    });
  });
});
