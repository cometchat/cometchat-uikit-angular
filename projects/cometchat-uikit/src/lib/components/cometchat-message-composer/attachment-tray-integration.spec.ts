import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageComposerComponent } from './cometchat-message-composer.component';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import { MessageComposerService } from '../../services/message-composer.service';

/** Minimal stub of the composer-scoped MediaUploadTrayService. */
function trayStub(over: Record<string, unknown> = {}) {
  return {
    tiles: signal([] as unknown[]),
    hasTiles: signal(false),
    aggregate: signal({ loaded: 0, total: 0, percent: 0 }),
    notice: signal<string | null>(null),
    canSend: signal(false),
    getSuccessfulAttachments: vi.fn(() => [] as unknown[]),
    getSuccessfulTiles: vi.fn(() => [] as unknown[]),
    getBatchId: vi.fn(() => 'batch-x'),
    setValidationConfig: vi.fn(),
    stage: vi.fn(),
    getMaxCount: vi.fn(async () => 10),
    remainingSlots: vi.fn(async () => 10),
    cancel: vi.fn(),
    remove: vi.fn(),
    retry: vi.fn(),
    clearAll: vi.fn(),
    reset: vi.fn(),
    ...over,
  };
}

async function createWith(
  stub: ReturnType<typeof trayStub>,
): Promise<ComponentFixture<CometChatMessageComposerComponent>> {
  await TestBed.configureTestingModule({
    imports: [CometChatMessageComposerComponent],
  })
    .overrideComponent(CometChatMessageComposerComponent, {
      // `set` replaces the component's whole providers array, so the composer-scoped
      // MessageComposerService (added to the component's providers) must be re-listed here or the
      // component fails to inject it (NG0201). The tray service stays stubbed; the real
      // MessageComposerService has no dependencies and its default (empty) mention signals are fine.
      set: { providers: [{ provide: MediaUploadTrayService, useValue: stub }, MessageComposerService] },
    })
    .overrideComponent(CometChatFullScreenViewerComponent, {
      set: { template: '<div></div>', styles: [] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(CometChatMessageComposerComponent);
  fixture.detectChanges();
  return fixture;
}

describe('CometChatMessageComposer × attachment tray (U5 integration)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('hides the mic (showVoiceButton) when the tray has tiles', async () => {
    const stub = trayStub({ hasTiles: signal(true) });
    const fixture = await createWith(stub);
    expect(fixture.componentInstance.showVoiceButton()).toBe(false);
  });

  it('shows the mic when the tray is empty (default behaviour preserved)', async () => {
    const fixture = await createWith(trayStub({ hasTiles: signal(false) }));
    expect(fixture.componentInstance.showVoiceButton()).toBe(true);
  });

  it('gates canSend on the tray when staging', async () => {
    const canSend = signal(false);
    const fixture = await createWith(trayStub({ hasTiles: signal(true), canSend }));
    expect(fixture.componentInstance.canSend()).toBe(false);
    canSend.set(true);
    expect(fixture.componentInstance.canSend()).toBe(true);
  });

  it('routes multi-file selection (file input) into the tray', async () => {
    const stub = trayStub({ hasTiles: signal(false) });
    const fixture = await createWith(stub);
    const f1 = new File([new Uint8Array(1)], 'a.png', { type: 'image/png' });
    const f2 = new File([new Uint8Array(1)], 'b.png', { type: 'image/png' });
    const input = { files: [f1, f2], value: 'x' } as unknown as HTMLInputElement;

    await fixture.componentInstance.handleFileInputChange({ target: input } as unknown as Event);

    expect(stub.setValidationConfig).toHaveBeenCalledOnce();
    expect(stub.stage).toHaveBeenCalledOnce();
    expect(stub.stage.mock.calls[0][0]).toEqual([f1, f2]);
  });

  it('hands the FULL picker selection to the tray (the tray enforces the count limit, not the picker)', async () => {
    // The picker used to truncate to the free slots, which silently dropped the excess (and showed
    // nothing at all once the tray was full). Now the whole selection reaches tray.stage, so the
    // tray's all-or-nothing check raises the same limit toast as drag-drop.
    const stub = trayStub({ hasTiles: signal(true), remainingSlots: vi.fn(async () => 2) });
    const fixture = await createWith(stub);
    const mk = (n: string) => new File([new Uint8Array(1)], n, { type: 'image/png' });
    const [a, b, c] = [mk('a.png'), mk('b.png'), mk('c.png')];
    const input = { files: [a, b, c], value: 'x' } as unknown as HTMLInputElement;

    fixture.componentInstance.handleFileInputChange({ target: input } as unknown as Event);

    expect(stub.stage).toHaveBeenCalledOnce();
    expect(stub.stage.mock.calls[0][0]).toEqual([a, b, c]);
    expect(stub.remainingSlots).not.toHaveBeenCalled();
  });

  function mkAttachment(mime: string, name: string): CometChat.Attachment {
    return {
      getMimeType: () => mime,
      getUrl: () => 'https://cdn/' + name,
      getName: () => name,
      getExtension: () => name.split('.').pop() ?? '',
      getSize: () => 1024,
    } as unknown as CometChat.Attachment;
  }

  /**
   * A staged tile. `type` is the kind the tray recorded (which the picker may have forced away
   * from the MIME type) — the send path must group on this, not on the attachment's MIME.
   */
  function mkTile(mime: string, name: string, type: 'image' | 'video' | 'audio' | 'file') {
    return { type, attachment: mkAttachment(mime, name), status: 'uploaded' };
  }

  it('sends one MediaMessage per attachment type with a shared batchId; caption on the last', async () => {
    const stub = trayStub({
      hasTiles: signal(true),
      canSend: signal(true),
      getSuccessfulTiles: vi.fn(() => [
        mkTile('image/png', 'a.png', 'image'),
        mkTile('application/pdf', 'b.pdf', 'file'),
      ]),
    });
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance;
    (comp as unknown as { currentUser: { set(v: CometChat.User): void } }).currentUser.set(
      new CometChat.User('u1'),
    );
    (comp as unknown as { composerText: { set(v: string): void } }).composerText.set('hello');

    const sendSpy = vi
      .spyOn(CometChat, 'sendMediaMessage')
      .mockImplementation((m) => Promise.resolve(m as CometChat.BaseMessage));

    await comp.handleSend();

    // images message + files message (audios/videos absent -> skipped)
    expect(sendSpy).toHaveBeenCalledTimes(2);
    const imagesMsg = sendSpy.mock.calls[0][0] as unknown as CometChat.MediaMessage;
    const filesMsg = sendSpy.mock.calls[1][0] as unknown as CometChat.MediaMessage;
    expect(imagesMsg.getAttachments().length).toBe(1);
    expect(filesMsg.getAttachments().length).toBe(1);

    const batchId = (imagesMsg.getMetadata() as { batchId?: string }).batchId;
    expect(batchId).toBeTruthy();
    expect((filesMsg.getMetadata() as { batchId?: string }).batchId).toBe(batchId);

    // caption only on the last message of the batch
    expect(imagesMsg.getCaption()).toBeFalsy();
    expect(filesMsg.getCaption()).toBe('hello');
    expect(stub.clearAll).toHaveBeenCalledOnce();
  });

  it('groups by the STAGED kind, not the MIME type — an MP4 staged as "file" sends as a file message', async () => {
    // This is what the "File" picker produces: video/mp4 bytes, but kind === 'file'.
    const stub = trayStub({
      hasTiles: signal(true),
      canSend: signal(true),
      getSuccessfulTiles: vi.fn(() => [
        mkTile('video/mp4', 'clip.mp4', 'file'),
        mkTile('application/pdf', 'doc.pdf', 'file'),
      ]),
    });
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance;
    (comp as unknown as { currentUser: { set(v: CometChat.User): void } }).currentUser.set(
      new CometChat.User('u1'),
    );

    const sendSpy = vi
      .spyOn(CometChat, 'sendMediaMessage')
      .mockImplementation((m) => Promise.resolve(m as CometChat.BaseMessage));
    // afterEach's restoreAllMocks does not restore this SDK method, so spyOn hands back the
    // SAME mock across tests and its call log carries over. Clear it explicitly.
    sendSpy.mockClear();

    await comp.handleSend();

    // ONE file message holding both — not a videos message plus a files message.
    expect(sendSpy).toHaveBeenCalledTimes(1);
    const msg = sendSpy.mock.calls[0][0] as unknown as CometChat.MediaMessage;
    expect(msg.getType()).toBe(CometChat.MESSAGE_TYPE.FILE);
    expect(msg.getAttachments().length).toBe(2);
  });

  it('still groups by MIME when the tray staged by MIME (drag-drop / paste)', async () => {
    const stub = trayStub({
      hasTiles: signal(true),
      canSend: signal(true),
      getSuccessfulTiles: vi.fn(() => [
        mkTile('video/mp4', 'clip.mp4', 'video'),
        mkTile('application/pdf', 'doc.pdf', 'file'),
      ]),
    });
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance;
    (comp as unknown as { currentUser: { set(v: CometChat.User): void } }).currentUser.set(
      new CometChat.User('u1'),
    );

    const sendSpy = vi
      .spyOn(CometChat, 'sendMediaMessage')
      .mockImplementation((m) => Promise.resolve(m as CometChat.BaseMessage));
    sendSpy.mockClear();

    await comp.handleSend();

    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect((sendSpy.mock.calls[0][0] as unknown as CometChat.MediaMessage).getType()).toBe(
      CometChat.MESSAGE_TYPE.VIDEO,
    );
    expect((sendSpy.mock.calls[1][0] as unknown as CometChat.MediaMessage).getType()).toBe(
      CometChat.MESSAGE_TYPE.FILE,
    );
  });

  it('disables Send (canSend=false) while a staged batch is being sent', async () => {
    const fixture = await createWith(trayStub({ hasTiles: signal(true), canSend: signal(true) }));
    const comp = fixture.componentInstance;
    expect(comp.canSend()).toBe(true);
    comp.isSendingStaged.set(true);
    expect(comp.canSend()).toBe(false);
  });

  it('ignores a second Send while a batch is still in flight — no duplicate send', async () => {
    const stub = trayStub({
      hasTiles: signal(true),
      canSend: signal(true),
      getSuccessfulTiles: vi.fn(() => [
        mkTile('image/png', 'a.png', 'image'),
        mkTile('application/pdf', 'b.pdf', 'file'),
      ]),
    });
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance;
    (comp as unknown as { currentUser: { set(v: CometChat.User): void } }).currentUser.set(
      new CometChat.User('u1'),
    );

    // Hold the FIRST message in flight so the batch is mid-send, then fire Send again.
    let firstMsg: CometChat.BaseMessage;
    let release!: () => void;
    const gate = new Promise<CometChat.BaseMessage>((res) => {
      release = () => res(firstMsg);
    });
    const sendSpy = vi.spyOn(CometChat, 'sendMediaMessage');
    sendSpy.mockReset();
    sendSpy
      .mockImplementationOnce((m) => {
        firstMsg = m as CometChat.BaseMessage;
        return gate;
      })
      .mockImplementation((m) => Promise.resolve(m as CometChat.BaseMessage));

    const inFlight = comp.handleSend(); // batch starts; first message hangs on the gate
    expect(comp.isSendingStaged()).toBe(true);
    expect(comp.canSend()).toBe(false);
    expect(sendSpy).toHaveBeenCalledTimes(1);

    // Second Send during the send window — must be a no-op (the guard swallows it).
    await comp.handleSend();
    expect(sendSpy).toHaveBeenCalledTimes(1); // still just the first message, NOT re-batched

    release();
    await inFlight;

    // Exactly the two messages of ONE batch were sent (image + file), not four.
    expect(sendSpy).toHaveBeenCalledTimes(2);
    expect(stub.clearAll).toHaveBeenCalledOnce();
    expect(comp.isSendingStaged()).toBe(false);
  });

  it('the picker\'s kind reaches tray.stage, and is consumed once', async () => {
    const stub = trayStub();
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance as unknown as {
      handleAttachmentOptionClick(id: string): void;
      pendingPickerKind?: string;
      fileInputRef?: unknown;
    };
    // The click handler needs a file input to exist; stub it.
    comp.fileInputRef = { nativeElement: { accept: '', click: vi.fn() } };

    comp.handleAttachmentOptionClick('file');
    expect(comp.pendingPickerKind).toBe('file');

    (comp as unknown as { processFiles(f: File[]): void })['processFiles']([
      new File([new Uint8Array(1)], 'clip.mp4', { type: 'video/mp4' }),
    ]);
    expect(stub.stage).toHaveBeenCalledWith(expect.any(Array), 'file');
    // Consumed — a subsequent drop must not inherit it.
    expect(comp.pendingPickerKind).toBeUndefined();
  });

  it('drag-drop stages with NO forced kind (MIME-derived)', async () => {
    const stub = trayStub();
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance;

    const file = new File([new Uint8Array(1)], 'clip.mp4', { type: 'video/mp4' });
    const event = new Event('drop') as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });

    comp.handleDrop(event);
    expect(stub.stage).toHaveBeenCalledWith(expect.any(Array), undefined);
  });

  it('does not stage into the tray when enableMultipleAttachments is false', async () => {
    const stub = trayStub({ hasTiles: signal(false) });
    const fixture = await createWith(stub);
    const comp = fixture.componentInstance;
    (comp as unknown as { enableMultipleAttachments: boolean }).enableMultipleAttachments = false;

    const f = new File([new Uint8Array(1)], 'a.png', { type: 'image/png' });
    comp.handleFileInputChange({ target: { files: [f], value: 'x' } } as unknown as Event);

    expect(stub.stage).not.toHaveBeenCalled();
  });

  /** Builds a DragEvent-shaped stub whose dataTransfer carries the given files. */
  function dropEventWith(files: File[]): DragEvent {
    return {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files },
    } as unknown as DragEvent;
  }

  it('routes DROPPED files into the tray (drag-and-drop path)', async () => {
    const stub = trayStub({ hasTiles: signal(false) });
    const fixture = await createWith(stub);
    const f1 = new File([new Uint8Array(1)], 'dropped.png', { type: 'image/png' });
    const f2 = new File([new Uint8Array(1)], 'dropped.pdf', { type: 'application/pdf' });

    const event = dropEventWith([f1, f2]);
    fixture.componentInstance.handleDrop(event);

    // Drop is neutralised (no browser navigation/open) and files are staged, not sent.
    expect(event.preventDefault).toHaveBeenCalled();
    expect(fixture.componentInstance.isDraggingOver()).toBe(false);
    expect(stub.setValidationConfig).toHaveBeenCalledOnce();
    expect(stub.stage).toHaveBeenCalledOnce();
    expect(stub.stage.mock.calls[0][0]).toEqual([f1, f2]);
  });

  it('ignores a drop when enableDragDrop is false', async () => {
    const stub = trayStub({ hasTiles: signal(false) });
    const fixture = await createWith(stub);
    (fixture.componentInstance as unknown as { enableDragDrop: boolean }).enableDragDrop = false;

    const f = new File([new Uint8Array(1)], 'a.png', { type: 'image/png' });
    fixture.componentInstance.handleDrop(dropEventWith([f]));

    expect(stub.stage).not.toHaveBeenCalled();
  });
});
