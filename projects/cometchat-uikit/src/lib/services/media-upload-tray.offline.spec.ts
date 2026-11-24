vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../testing/offline-sdk-fake';
import { MediaUploadTrayService } from './media-upload-tray.service';
import { OfflineHub } from '../utils/offline/offline-hub';

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function mkFile(name: string, type: string): File {
  return new File([new Uint8Array(1)], name, { type });
}

function item(fileId: string, status: string, extra: Record<string, unknown> = {}) {
  return { fileId, name: `${fileId}.png`, size: 10, mimeType: 'image/png', status, ...extra };
}

/** A restored `UploadFileRequest` as the SDK hands it back from `getExistingUploadFileRequest`. */
function restoredRequest(items: unknown[]) {
  return {
    getItems: vi.fn(() => items),
    getBatchId: vi.fn(() => 'restored-batch'),
    getFileBytes: vi.fn(() => Promise.resolve(null)),
    uploadAttachments: vi.fn(),
    uploadAttachment: vi.fn(),
    retryAttachment: vi.fn(),
    removeAttachment: vi.fn(),
    clearAll: vi.fn(),
    setParentMessageId: vi.fn(),
  };
}

describe('MediaUploadTrayService: offline restore (BEH-UPLOAD-14, UIK-UPLOAD-01)', () => {
  let fake: OfflineSdkFake;
  let bundle: any;
  let svc: MediaUploadTrayService;

  beforeEach(() => {
    fake = installOfflineSdk();
    bundle = undefined;
    vi.spyOn(CometChat as any, 'UploadFileListener').mockImplementation(function (
      this: unknown,
      b: any
    ) {
      bundle = b;
      return b;
    } as any);
    vi.spyOn(CometChat as any, 'getMaxAttachmentCount').mockResolvedValue(10);
    svc = new MediaUploadTrayService();
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  it('UIT-UP-01: done tiles stay done, interrupted ones show failed with retry, nothing uploads by itself', async () => {
    const attachment = { getUrl: () => 'https://cdn/a.png' } as unknown as CometChat.Attachment;
    const request = restoredRequest([
      item('a', 'uploaded', { attachment }),
      item('b', 'uploading'),
      item('c', 'queued'),
      item('d', 'rejected', { failure: { code: 'ERR_FILE_SIZE_EXCEEDED' } }),
    ]);
    fake.existingUpload = request;
    const create = vi.spyOn(CometChat as any, 'createUploadFileRequest');

    svc.setReceiver('alice', 'user');
    await flush();

    expect(svc.tiles().map(t => [t.fileId, t.status])).toEqual([
      ['a', 'uploaded'],
      ['b', 'failed'],
      ['c', 'failed'],
      ['d', 'rejected'],
    ]);
    expect(svc.tiles()[0].attachment).toBe(attachment);
    expect(request.uploadAttachments).not.toHaveBeenCalled();
    expect(request.uploadAttachment).not.toHaveBeenCalled();
    expect(request.retryAttachment).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    expect(svc.getBatchId()).toBe('restored-batch');
    // A failed tile blocks Send until it is retried or removed.
    expect(svc.canSend()).toBe(false);
  });

  it("retry of a restored tile re-uploads the SDK copy with this tray's listener", async () => {
    const request = restoredRequest([item('b', 'failed')]);
    fake.existingUpload = request;
    svc.setReceiver('alice', 'user');
    await flush();

    svc.retry(svc.tiles()[0]);
    expect(request.retryAttachment).toHaveBeenCalledWith('b', bundle);
    expect(svc.tiles()[0].status).toBe('uploading');
  });

  it("UIT-UP-02: a thread composer asks for its own triple and never gets the main chat's batch", async () => {
    const mainBatch = restoredRequest([item('main', 'uploaded', { attachment: {} })]);
    (CometChat as any).getExistingUploadFileRequest = vi.fn(
      (_id: string, _type: string, parent?: number) =>
        Promise.resolve(parent === undefined ? mainBatch : null)
    );

    const thread = new MediaUploadTrayService();
    thread.setReceiver('alice', 'user', 42);
    svc.setReceiver('alice', 'user');
    await flush();

    expect((CometChat as any).getExistingUploadFileRequest).toHaveBeenCalledWith(
      'alice',
      'user',
      42
    );
    expect((CometChat as any).getExistingUploadFileRequest).toHaveBeenCalledWith(
      'alice',
      'user',
      undefined
    );
    expect(thread.hasTiles()).toBe(false);
    expect(svc.tiles().map(t => t.fileId)).toEqual(['main']);
  });

  it('restores once, on the settled triple, however many times it is set', async () => {
    fake.existingUpload = restoredRequest([item('a', 'uploaded', { attachment: {} })]);
    svc.setReceiver('alice', 'user');
    svc.setReceiver('bob', 'user');
    svc.setReceiver('bob', 'user', 7);
    await flush();
    svc.setReceiver('bob', 'user', 7);
    await flush();
    expect(fake.callsTo('getExistingUploadFileRequest')).toEqual([['bob', 'user', 7]]);
  });

  it('drops an answer that arrives after the destination moved on', async () => {
    let resolveFirst!: (value: unknown) => void;
    const batch = restoredRequest([item('a', 'uploaded', { attachment: {} })]);
    (CometChat as any).getExistingUploadFileRequest = vi.fn((id: string) =>
      id === 'alice'
        ? new Promise(resolve => {
            resolveFirst = resolve;
          })
        : Promise.resolve(null)
    );
    svc.setReceiver('alice', 'user');
    await flush();
    svc.setReceiver('bob', 'user');
    resolveFirst(batch);
    await flush();
    expect(svc.hasTiles()).toBe(false);
  });

  it('UIT-UP-03: sending after the uploads finished does not upload again', async () => {
    const attachment = { getUrl: () => 'https://cdn/a.png' } as unknown as CometChat.Attachment;
    const request = restoredRequest([item('a', 'uploaded', { attachment })]);
    fake.existingUpload = request;
    svc.setReceiver('alice', 'user');
    await flush();

    expect(svc.canSend()).toBe(true);
    expect(svc.getSuccessfulAttachments()).toEqual([attachment]);
    expect(request.uploadAttachments).not.toHaveBeenCalled();
    expect(request.uploadAttachment).not.toHaveBeenCalled();
    expect(request.retryAttachment).not.toHaveBeenCalled();
  });

  it('does not offer Retry for a failed file whose SDK copy is gone', async () => {
    fake.existingUpload = restoredRequest([item('a', 'failed', { localCopyMissing: true })]);
    svc.setReceiver('alice', 'user');
    await flush();
    expect(svc.tiles()[0].status).toBe('rejected');
  });

  it('offline on: a chat switch lets go of the batch without destroying it', async () => {
    const request = restoredRequest([item('a', 'uploaded', { attachment: {} })]);
    fake.existingUpload = request;
    svc.setReceiver('alice', 'user');
    await flush();

    fake.existingUpload = null;
    svc.setReceiver('bob', 'user');
    expect(request.clearAll).not.toHaveBeenCalled();
    expect(svc.hasTiles()).toBe(false);
  });

  it('offline on: reset() on composer destroy keeps the SDK batch', async () => {
    const request = restoredRequest([item('a', 'uploaded', { attachment: {} })]);
    fake.existingUpload = request;
    svc.setReceiver('alice', 'user');
    await flush();
    svc.reset();
    expect(request.clearAll).not.toHaveBeenCalled();
    expect(svc.hasTiles()).toBe(false);
  });

  it('clearAll after a send still releases the batch', async () => {
    const request = restoredRequest([item('a', 'uploaded', { attachment: {} })]);
    fake.existingUpload = request;
    svc.setReceiver('alice', 'user');
    await flush();
    svc.clearAll();
    expect(request.clearAll).toHaveBeenCalled();
  });

  it('UIT-LIFE-01: logout or a user switch lets go of the batch; nothing of the old session stays', async () => {
    fake.existingUpload = restoredRequest([item('a', 'uploaded')]);
    svc.setReceiver('alice', 'user');
    await flush();
    expect(svc.hasTiles()).toBe(true);
    OfflineHub.getInstance().endSession();
    expect(svc.hasTiles()).toBe(false);
    expect((fake.existingUpload as any).clearAll).not.toHaveBeenCalled();
    svc.ngOnDestroy();
  });

  it('a cache reset lets go of the batch, then restores what the rebuilt store holds for this chat', async () => {
    fake.existingUpload = restoredRequest([item('old', 'uploaded', { attachment: {} })]);
    svc.setReceiver('alice', 'user');
    await flush();
    expect(svc.tiles().map(t => t.fileId)).toEqual(['old']);

    fake.existingUpload = restoredRequest([item('kept', 'uploaded', { attachment: {} })]);
    const hub = OfflineHub.getInstance();
    hub.cacheReset$.next({ gen: hub.gen + 1, reason: 'SCHEMA_RESET', pendingMessagesLost: 0 });
    await flush();
    expect(svc.tiles().map(t => t.fileId)).toEqual(['kept']);

    // A logout does not restore: nothing of the old session stays.
    hub.endSession();
    await flush();
    expect(svc.hasTiles()).toBe(false);
    svc.ngOnDestroy();
  });

  it('syncReceiver (composer open) restores the batch', async () => {
    fake.existingUpload = restoredRequest([item('a', 'uploaded', { attachment: {} })]);
    svc.syncReceiver('alice', 'user');
    await flush();
    expect(svc.tiles().map(t => t.fileId)).toEqual(['a']);
  });
});

/** UIT-OFF-08 (critical): with offline off the tray behaves exactly as before (P1). */
describe('MediaUploadTrayService: offline off (UIT-OFF-08)', () => {
  let fake: OfflineSdkFake;
  let request: any;
  let svc: MediaUploadTrayService;

  beforeEach(() => {
    fake = installOfflineSdk({ enabled: false });
    vi.spyOn(CometChat as any, 'UploadFileListener').mockImplementation(function (
      this: unknown,
      b: any
    ) {
      return b;
    } as any);
    vi.spyOn(CometChat as any, 'getMaxAttachmentCount').mockResolvedValue(10);
    request = {
      setParentMessageId: vi.fn(),
      getBatchId: vi.fn(() => 'b'),
      uploadAttachments: vi.fn(),
      retryAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAll: vi.fn(),
    };
    vi.spyOn(CometChat as any, 'createUploadFileRequest').mockImplementation(() => request);
    if (typeof URL.createObjectURL !== 'function') {
      (URL as any).createObjectURL = () => 'blob:mock';
      (URL as any).revokeObjectURL = () => undefined;
    }
    svc = new MediaUploadTrayService();
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
  });

  it('destroys the batch when the chat switches', async () => {
    svc.setReceiver('alice', 'user');
    await svc.stage([mkFile('a.png', 'image/png')]);
    svc.setReceiver('bob', 'user');
    expect(request.clearAll).toHaveBeenCalled();
    expect(svc.hasTiles()).toBe(false);
  });

  it('destroys the batch on reset (composer destroyed or its conversation changed)', async () => {
    svc.setReceiver('alice', 'user');
    await svc.stage([mkFile('a.png', 'image/png')]);
    svc.reset();
    expect(request.clearAll).toHaveBeenCalled();
    expect(svc.hasTiles()).toBe(false);
  });

  it('syncReceiver leaves a live batch alone and restores nothing', async () => {
    svc.setReceiver('alice', 'user');
    await svc.stage([mkFile('a.png', 'image/png')]);
    svc.syncReceiver('bob', 'user');
    await flush();
    expect(request.clearAll).not.toHaveBeenCalled();
    expect(svc.tiles().length).toBe(1);
  });

  it('a logout leaves an offline-off tray exactly as today', async () => {
    svc.setReceiver('alice', 'user');
    await svc.stage([mkFile('a.png', 'image/png')]);
    OfflineHub.getInstance().endSession();
    expect(svc.tiles().length).toBe(1);
    expect(request.clearAll).not.toHaveBeenCalled();
    svc.ngOnDestroy();
  });

  it('the restore read answers null, so no tile appears', async () => {
    svc.syncReceiver('alice', 'user');
    await flush();
    expect(svc.hasTiles()).toBe(false);
  });

  /**
   * P1 / UIK-GATE-03: with the gate off the kit asks the offline SDK nothing.
   * The restore read answered null, so nothing showed either way, but every
   * composer open and every conversation switch still paid for a microtask, a
   * promise and an SDK call that could not have anything to say
   * (Prajwal 2026-11-20T11:54Z on #674).
   */
  it('asks the SDK for a batch to restore not even once', async () => {
    svc.syncReceiver('alice', 'user');
    await flush();
    svc.setReceiver('bob', 'user');
    await flush();
    svc.setReceiver('bob', 'user', 42);
    await flush();

    expect(fake.callsTo('getExistingUploadFileRequest')).toEqual([]);
  });

  it('still asks the SDK once the gate is turned on', async () => {
    fake.setEnabled(true);

    svc.syncReceiver('alice', 'user');
    await flush();

    expect(fake.callsTo('getExistingUploadFileRequest')).toHaveLength(1);
  });
});
