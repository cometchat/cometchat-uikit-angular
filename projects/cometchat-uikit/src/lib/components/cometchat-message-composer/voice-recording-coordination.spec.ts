/**
 * Voice recording coordination across composers.
 *
 * The main message list and an open thread each render their own composer, each with its own
 * recorder and microphone stream. Only one may record at a time.
 *
 * The existing ccActivePopover event cannot do this on its own: it carries the popover *type*, so a
 * composer receiving 'voiceRecording' cannot tell whether it came from itself or from another
 * composer — and the guard that stops it closing itself also stops it closing for a second recorder.
 * VoiceRecordingCoordinatorService adds the missing instance identity.
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CometChatMessageComposerComponent } from './cometchat-message-composer.component';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import { MessageComposerService } from '../../services/message-composer.service';

/** Minimal stub of the composer-scoped MediaUploadTrayService. */
function trayStub() {
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
    setReceiver: vi.fn(),
    stage: vi.fn(),
    getMaxCount: vi.fn(async () => 10),
    remainingSlots: vi.fn(async () => 10),
    cancel: vi.fn(),
    remove: vi.fn(),
    retry: vi.fn(),
    clearAll: vi.fn(),
    reset: vi.fn(),
  };
}

type Composer = CometChatMessageComposerComponent & {
  isRecording(): boolean;
  startInlineRecording(): void;
  toggleVoiceRecording(): void;
};

async function configure(): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [CometChatMessageComposerComponent],
  })
    .overrideComponent(CometChatMessageComposerComponent, {
      // `set` replaces the component's whole providers array — re-list the composer-scoped
      // MessageComposerService (a dependency-free @Injectable) or the component fails to inject it (NG0201).
      set: { providers: [{ provide: MediaUploadTrayService, useValue: trayStub() }, MessageComposerService] },
    })
    .overrideComponent(CometChatFullScreenViewerComponent, {
      set: { template: '<div></div>', styles: [] },
    })
    .compileComponents();
}

/** A composer instance. Both instances share the root VoiceRecordingCoordinatorService. */
function createComposer(): { fixture: ComponentFixture<CometChatMessageComposerComponent>; comp: Composer } {
  const fixture = TestBed.createComponent(CometChatMessageComposerComponent);
  fixture.detectChanges();
  return { fixture, comp: fixture.componentInstance as Composer };
}

/** Let the isRecording effect run on every composer. */
function settle(...fixtures: ComponentFixture<unknown>[]): void {
  TestBed.tick();
  fixtures.forEach((f) => f.detectChanges());
}

describe('voice recording is exclusive across composers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('stops the first composer when a second one starts recording', async () => {
    await configure();
    const a = createComposer();
    const b = createComposer();

    a.comp.startInlineRecording();
    settle(a.fixture, b.fixture);
    expect(a.comp.isRecording()).toBe(true);

    b.comp.startInlineRecording();
    settle(a.fixture, b.fixture);

    expect(b.comp.isRecording()).toBe(true);
    // Was left recording before the coordinator existed: ccActivePopover emits the popover TYPE, so
    // A saw its own contentToDisplay ('voiceRecording') === the incoming id and stayed open.
    expect(a.comp.isRecording()).toBe(false);
  });

  it('works for a start path that never emits ccActivePopover (toggleVoiceRecording -> startInlineRecording)', async () => {
    await configure();
    const a = createComposer();
    const b = createComposer();

    // toggleVoiceRecording DOES emit ccActivePopover; startInlineRecording does NOT. Mixing them
    // proves the coordinator hooks the isRecording signal rather than the event.
    a.comp.toggleVoiceRecording();
    settle(a.fixture, b.fixture);
    expect(a.comp.isRecording()).toBe(true);

    b.comp.startInlineRecording();
    settle(a.fixture, b.fixture);

    expect(b.comp.isRecording()).toBe(true);
    expect(a.comp.isRecording()).toBe(false);
  });

  it('leaves a lone composer recording untouched', async () => {
    await configure();
    const a = createComposer();
    const b = createComposer();

    a.comp.startInlineRecording();
    settle(a.fixture, b.fixture);

    expect(a.comp.isRecording()).toBe(true);
    expect(b.comp.isRecording()).toBe(false);
  });

  it('frees the slot when the recording composer stops, so the next start stops nobody', async () => {
    await configure();
    const a = createComposer();
    const b = createComposer();

    a.comp.startInlineRecording();
    settle(a.fixture, b.fixture);
    a.comp.toggleVoiceRecording(); // stop A
    settle(a.fixture, b.fixture);
    expect(a.comp.isRecording()).toBe(false);

    b.comp.startInlineRecording();
    settle(a.fixture, b.fixture);

    expect(b.comp.isRecording()).toBe(true);
    expect(a.comp.isRecording()).toBe(false);
  });

  it('frees the slot when a recording composer is destroyed', async () => {
    await configure();
    const a = createComposer();
    const b = createComposer();

    a.comp.startInlineRecording();
    settle(a.fixture, b.fixture);
    a.fixture.destroy(); // thread closed mid-recording

    b.comp.startInlineRecording();
    settle(b.fixture);

    expect(b.comp.isRecording()).toBe(true);
  });
});
