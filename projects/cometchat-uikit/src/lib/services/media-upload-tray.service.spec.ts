import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MediaUploadTrayService } from './media-upload-tray.service';

function mkFile(name: string, size: number, type: string): File {
  const f = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('MediaUploadTrayService', () => {
  let svc: MediaUploadTrayService;
  /** The callback bundle the service registers via request.addUploadListener(...). */
  let listener: any;
  /** The fake UploadFileRequest handed back by createUploadFileRequest. */
  let request: any;
  let createRequestSpy: any;

  /** fileIds are UIKit-generated now, so tests read them off the tile rather than assuming a shape. */
  const idOf = (i: number) => svc.tiles()[i].fileId as string;

  beforeEach(() => {
    listener = undefined;
    // Capture the listener bundle. Must be a regular function (constructable):
    // `new MockListener(bundle)` returns the bundle object.
    vi.spyOn(CometChat as any, 'UploadFileListener').mockImplementation(
      function (this: unknown, bundle: any) {
        return bundle;
      } as any,
    );
    vi.spyOn(CometChat as any, 'getMaxAttachmentCount').mockResolvedValue(10);

    // Models the SDK's REAL dispatch semantics, which bit us once:
    //  - the batch's group is created lazily by the first uploadAttachments call;
    //  - addUploadListener before that point is a SILENT no-op (`groups.get(id) && ...`);
    //  - the per-call listener is stored per file and is what actually receives events.
    // A stub that just captures whichever listener it is handed would let a listener that the real
    // SDK drops on the floor look wired up, which is exactly how the tiles got stuck spinning.
    let groupExists = false;
    request = {
      setParentMessageId: vi.fn().mockImplementation(() => request),
      setBatchId: vi.fn().mockImplementation(() => request),
      setConcurrency: vi.fn().mockImplementation(() => request),
      getBatchId: vi.fn().mockReturnValue('batch-1'),
      uploadAttachments: vi.fn().mockImplementation((_items: any, l: any) => {
        groupExists = true;
        if (l) { listener = l; }
      }),
      addUploadListener: vi.fn().mockImplementation((l: any) => {
        if (groupExists) { listener = l; }
      }),
      removeUploadListener: vi.fn(),
      retryAttachment: vi.fn(),
      removeAttachment: vi.fn(),
      clearAll: vi.fn(),
    };
    createRequestSpy = vi
      .spyOn(CometChat as any, 'createUploadFileRequest')
      .mockImplementation(() => request);

    if (typeof URL.createObjectURL !== 'function') {
      (URL as any).createObjectURL = () => 'blob:mock';
      (URL as any).revokeObjectURL = () => undefined;
    }

    svc = new MediaUploadTrayService();
  });

  afterEach(() => vi.restoreAllMocks());

  it('stages files and seeds tiles keyed by fileId', async () => {
    await svc.stage([
      mkFile('a.png', 100, 'image/png'),
      mkFile('b.pdf', 200, 'application/pdf'),
    ]);
    expect(request.uploadAttachments).toHaveBeenCalledOnce();
    expect(svc.tiles().length).toBe(2);
    expect(svc.getBatchId()).toBe('batch-1');
    expect(svc.tiles()[0].status).toBe('uploading');
    expect(svc.tiles()[0].type).toBe('image');
    expect(svc.tiles()[1].type).toBe('file');
    // The ids we generated are what the SDK was asked to upload under.
    expect(request.uploadAttachments.mock.calls[0][0].map((i: any) => i.fileId)).toEqual([
      idOf(0),
      idOf(1),
    ]);
    expect(idOf(0)).toBeTruthy();
    expect(idOf(0)).not.toBe(idOf(1));
  });

  it('paints tiles even when the SDK throws synchronously, marking them failed', async () => {
    request.uploadAttachments.mockImplementation(() => { throw new Error('boom'); });
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    // The batch must survive a throw — the user keeps the tile and can retry.
    expect(svc.tiles().length).toBe(1);
    expect(svc.tiles()[0].status).toBe('failed');
    expect(svc.notice()).toBeTruthy();
  });

  it('forcedKind overrides the MIME-derived type — the "File" picker keeps an MP4 a file', async () => {
    await svc.stage([mkFile('clip.mp4', 100, 'video/mp4')], 'file');
    expect(svc.tiles()[0].type).toBe('file');
    // ...and no image preview is created for a force-filed item.
    expect(svc.tiles()[0].thumbnailUrl).toBeUndefined();
  });

  it('forcedKind applies to every file in the batch', async () => {
    await svc.stage(
      [mkFile('clip.mp4', 100, 'video/mp4'), mkFile('pic.png', 100, 'image/png')],
      'file',
    );
    expect(svc.tiles().map((t) => t.type)).toEqual(['file', 'file']);
  });

  it('without forcedKind the type stays MIME-derived (drag-drop / paste)', async () => {
    await svc.stage([mkFile('clip.mp4', 100, 'video/mp4'), mkFile('a.mp3', 100, 'audio/mpeg')]);
    expect(svc.tiles().map((t) => t.type)).toEqual(['video', 'audio']);
  });

  it('getSuccessfulTiles exposes the staged kind alongside the SDK attachment', async () => {
    await svc.stage([mkFile('clip.mp4', 100, 'video/mp4')], 'file');
    expect(svc.getSuccessfulTiles()).toEqual([]); // nothing uploaded yet

    const attachment = { getUrl: () => 'https://cdn/clip.mp4' } as any;
    listener.onFileUploaded(idOf(0), attachment);

    const tiles = svc.getSuccessfulTiles();
    expect(tiles.length).toBe(1);
    expect(tiles[0].type).toBe('file');
    expect(svc.getSuccessfulAttachments()).toEqual([attachment]);
  });

  it('updates progress (byte-weighted) and marks uploaded; enables canSend on complete', async () => {
    await svc.stage([mkFile('a.png', 1000, 'image/png')]);
    listener.onFileProgress(idOf(0), 500, 1000, 50);
    expect(svc.aggregate().percent).toBe(50);

    const localPreview = svc.tiles()[0].thumbnailUrl; // local object-URL from stage()
    const attachment = { getUrl: () => 'https://cdn/a.png' } as any;
    listener.onFileUploaded(idOf(0), attachment);
    expect(svc.tiles()[0].status).toBe('uploaded');
    expect(svc.tiles()[0].attachment).toBe(attachment);
    // Tray keeps the LOCAL preview after upload — it must NOT switch to the (private/unsigned) S3 URL.
    expect(svc.tiles()[0].thumbnailUrl).toBe(localPreview);
    expect(svc.tiles()[0].thumbnailUrl).not.toBe('https://cdn/a.png');

    expect(svc.canSend()).toBe(false); // not until onComplete
    listener.onComplete({ successful: [{ fileId: idOf(0), attachment }] });
    expect(svc.canSend()).toBe(true);
    expect(svc.getSuccessfulAttachments()).toEqual([attachment]);
  });

  it('maps onFileError -> rejected and onFileFailure -> failed', async () => {
    await svc.stage([
      mkFile('a.png', 10, 'image/png'),
      mkFile('b.png', 10, 'image/png'),
    ]);
    listener.onFileError(idOf(0), { message: 'too big' } as any);
    listener.onFileFailure(idOf(1), { message: 'network' } as any);
    expect(svc.tiles()[0].status).toBe('rejected');
    expect(svc.tiles()[0].errorMessage).toBe('too big');
    expect(svc.tiles()[1].status).toBe('failed');
    expect(svc.canSend()).toBe(false);
  });

  it('keeps Send disabled when a batch has BOTH uploaded and failed tiles', async () => {
    await svc.stage([mkFile('a.png', 10, 'image/png'), mkFile('b.png', 10, 'image/png')]);
    const attachment = { getUrl: () => 'https://cdn/a.png' } as any;
    listener.onFileUploaded(idOf(0), attachment);
    listener.onFileError(idOf(1), { message: 'too big' } as any);
    // onComplete reports the one success, but the sibling error must still block Send.
    listener.onComplete({ successful: [{ fileId: idOf(0), attachment }] });
    expect(svc.hasErrorTile()).toBe(true);
    expect(svc.canSend()).toBe(false);
    // Removing the failed tile clears the block.
    svc.remove(svc.tiles()[1]);
    expect(svc.hasErrorTile()).toBe(false);
    expect(svc.canSend()).toBe(true);
  });

  it('cancel/remove drops the tile and removes it from the batch', async () => {
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    const id = idOf(0);
    svc.cancel(svc.tiles()[0]);
    expect(request.removeAttachment).toHaveBeenCalledWith(id);
    expect(svc.tiles().length).toBe(0);
    expect(svc.canSend()).toBe(false);
  });

  it('retry sets uploading and re-uploads the retained bytes', async () => {
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    listener.onFileFailure(idOf(0), { message: 'x' } as any);
    svc.retry(svc.tiles()[0]);
    expect(request.retryAttachment).toHaveBeenCalledWith(idOf(0));
    expect(svc.tiles()[0].status).toBe('uploading');
    expect(svc.tiles()[0].errorMessage).toBeUndefined();
  });

  it('does NOT retry a rejected tile — retryAttachment is a no-op for it, so the tile would hang', async () => {
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    listener.onFileError(idOf(0), { message: 'too big' } as any);
    svc.retry(svc.tiles()[0]);
    expect(request.retryAttachment).not.toHaveBeenCalled();
    expect(svc.tiles()[0].status).toBe('rejected');
  });

  it('clearAll detaches the listener, releases the batch and empties the tray', async () => {
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    svc.clearAll();
    expect(request.clearAll).toHaveBeenCalled();
    expect(svc.hasTiles()).toBe(false);
    expect(svc.getBatchId()).toBeNull();
  });

  it('discards the batch when the destination changes (presigns are destination-scoped)', async () => {
    svc.setReceiver('alice', 'user');
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    expect(svc.tiles().length).toBe(1);

    svc.setReceiver('bob', 'user');
    expect(request.clearAll).toHaveBeenCalled();
    expect(svc.hasTiles()).toBe(false);

    // ...and the next stage builds a request for the NEW destination.
    await svc.stage([mkFile('b.png', 10, 'image/png')]);
    expect(createRequestSpy).toHaveBeenLastCalledWith('bob', 'user');
  });

  it('passes the thread parent to the request so the presign is thread-scoped', async () => {
    svc.setReceiver('alice', 'user', 42);
    await svc.stage([mkFile('a.png', 10, 'image/png')]);
    expect(request.setParentMessageId).toHaveBeenCalledWith(42);
  });

  it('enforces the max attachment count (rejects the WHOLE batch, sets a notice)', async () => {
    (CometChat.getMaxAttachmentCount as any).mockResolvedValue(2);
    await svc.stage([
      mkFile('a', 1, 'image/png'),
      mkFile('b', 1, 'image/png'),
      mkFile('c', 1, 'image/png'),
    ]);
    // All-or-nothing: 3 files over a limit of 2 stages none, rather than truncating to the first 2.
    expect(svc.tiles().length).toBe(0);
    expect(svc.notice()).toBeTruthy();
  });

  it('rejects a batch that overflows the REMAINING capacity, leaving earlier tiles intact', async () => {
    (CometChat.getMaxAttachmentCount as any).mockResolvedValue(2);
    await svc.stage([mkFile('a', 1, 'image/png')]);
    expect(svc.tiles().length).toBe(1);
    await svc.stage([mkFile('b', 1, 'image/png'), mkFile('c', 1, 'image/png')]);
    expect(svc.tiles().length).toBe(1);
    expect(svc.notice()).toBeTruthy();
  });

  it('stages a batch that exactly fills the limit', async () => {
    (CometChat.getMaxAttachmentCount as any).mockResolvedValue(2);
    await svc.stage([mkFile('a', 1, 'image/png'), mkFile('b', 1, 'image/png')]);
    expect(svc.tiles().length).toBe(2);
    expect(svc.notice()).toBeNull();
  });

  describe('errorText — friendly localized copy for upload errors', () => {
    const errorText = (e: unknown) => (svc as any).errorText(e) as string;

    it('maps the SDK size-exceeded code to a localized "{n} MB" message', () => {
      expect(
        errorText({
          code: 'ERR_FILE_SIZE_EXCEEDED',
          message: 'The file 500mb.txt exceeds the maximum allowed size of 104857600 bytes.',
        }),
      ).toBe('File exceeds the 100 MB size limit.');
    });

    it('maps a size error by message text even when the code is unknown', () => {
      expect(
        errorText({ code: 'SOME_SERVER_CODE', message: 'exceeds the maximum allowed size of 52428800 bytes' }),
      ).toBe('File exceeds the 50 MB size limit.');
    });

    it('maps a server file-type rejection to "File type not supported."', () => {
      expect(errorText({ code: 'ERR_SERVER', message: 'This file type is not supported.' })).toBe(
        'File type not supported.',
      );
    });

    it('passes an unrecognized error through verbatim', () => {
      expect(errorText({ code: 'ERR_UPLOAD_STALLED', message: 'Upload stalled. Try again.' })).toBe(
        'Upload stalled. Try again.',
      );
    });
  });

  it('accumulates subsequent stages into the SAME batch (one request, reused)', async () => {
    await svc.stage([mkFile('a', 1, 'image/png')]);
    await svc.stage([mkFile('b', 1, 'image/png')]);
    expect(request.uploadAttachments).toHaveBeenCalledTimes(2);
    // One request => one batch: it is created once and re-used, so both stages share a batch id.
    expect(createRequestSpy).toHaveBeenCalledOnce();
    expect(svc.tiles().length).toBe(2);
  });

  it('passes the listener with EVERY upload call, so events are delivered from the first file on', async () => {
    await svc.stage([mkFile('a', 1, 'image/png')]);
    await svc.stage([mkFile('b', 1, 'image/png')]);
    // Regression guard: registering only via addUploadListener at request-creation time is a silent
    // no-op (the group doesn't exist yet), which left every tile spinning forever despite the bytes
    // reaching S3. The listener must ride along on the upload call itself.
    expect(request.uploadAttachments.mock.calls[0][1]).toBeDefined();
    expect(request.uploadAttachments.mock.calls[1][1]).toBe(
      request.uploadAttachments.mock.calls[0][1],
    );
  });

  it('drives tiles to uploaded from the listener the SDK actually received', async () => {
    await svc.stage([mkFile('a.png', 1000, 'image/png')]);
    // `listener` here is whatever the fake SDK genuinely retained — not what we hoped it got.
    const attachment = { getUrl: () => 'https://cdn/a.png' } as any;
    listener.onFileProgress(idOf(0), 500, 1000, 50);
    expect(svc.tiles()[0].uploadProgress).toBe(50);
    listener.onFileUploaded(idOf(0), attachment);
    listener.onComplete({ successful: [{ fileId: idOf(0), attachment }] });
    expect(svc.tiles()[0].status).toBe('uploaded');
    expect(svc.canSend()).toBe(true);
  });

  it('rejects oversized files (maxFileSize) with a notice', async () => {
    svc.setValidationConfig({ maxFileSize: 50 });
    await svc.stage([
      mkFile('big.png', 100, 'image/png'),
      mkFile('ok.png', 10, 'image/png'),
    ]);
    expect(svc.tiles().length).toBe(1);
    expect(svc.notice()).toBeTruthy();
  });

  it('rejects disallowed file types (allowedFileTypes)', async () => {
    svc.setValidationConfig({ allowedFileTypes: ['image/*'] });
    await svc.stage([
      mkFile('a.png', 10, 'image/png'),
      mkFile('b.pdf', 10, 'application/pdf'),
    ]);
    expect(svc.tiles().length).toBe(1);
    expect(svc.tiles()[0].type).toBe('image');
    expect(svc.notice()).toBeTruthy();
  });
});
