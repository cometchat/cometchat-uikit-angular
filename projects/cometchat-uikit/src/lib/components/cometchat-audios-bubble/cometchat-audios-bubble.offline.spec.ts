vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatAudiosBubbleComponent } from './cometchat-audios-bubble.component';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';

const REMOTE = 'https://cdn.example.com/song.mp3';
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function audioMessage(): any {
  return {
    getAttachments: () => [{ url: REMOTE, name: 'song.mp3', mimeType: 'audio/mpeg', size: 5 }],
    getCaption: () => '',
  };
}

/** Offline audio files: cached copy plays, never-downloaded shows the placeholder (README §3.8). */
describe('CometChatAudiosBubbleComponent offline media', () => {
  let fake: OfflineSdkFake;
  let fixture: ComponentFixture<CometChatAudiosBubbleComponent>;
  let online: boolean;

  beforeEach(async () => {
    fake = installOfflineSdk();
    online = true;
    (URL as any).revokeObjectURL = vi.fn();
    // The SDK's connection state (never navigator.onLine, README P3).
    Object.defineProperty(fake, 'connected', { get: () => online, configurable: true });
    await TestBed.configureTestingModule({
      imports: [CometChatAudiosBubbleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatAudiosBubbleComponent);
    fixture.componentRef.setInput('message', audioMessage());
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
    OfflineHub.resetForTests();
  });

  const audioSrc = () => fixture.nativeElement.querySelector('audio')?.getAttribute('src');

  it('plays the SDK copy when it has one', async () => {
    fake.cachedMedia.set(REMOTE, 'blob:song');
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    expect(audioSrc()).toBe('blob:song');
  });

  it('shows "Available when online" for a never-downloaded file while offline, and no player', async () => {
    online = false;
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(audioSrc()).toBeUndefined();
    expect(el.textContent).toContain('Available when online');
    expect(el.querySelector('.cometchat-audios-bubble__download')).toBeNull();
  });

  it('loads from the URL as today with offline off', async () => {
    fake.setEnabled(false);
    online = false;
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    expect(audioSrc()).toBe(REMOTE);
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
  });

  it('refreshes to the cached copy when the SDK finishes the download', async () => {
    online = false;
    fixture.detectChanges();
    await flush();
    fake.cachedMedia.set(REMOTE, 'blob:later');
    OfflineHub.getInstance().mediaReady$.next({
      gen: 0,
      messageKey: 'm',
      urlKey: REMOTE,
      localPath: '',
    });
    await flush();
    fixture.detectChanges();
    expect(audioSrc()).toBe('blob:later');
  });

  it('AC-12.3: tapping play online on a never-downloaded file asks the SDK for a copy, and playback keeps its source', async () => {
    fixture.detectChanges();
    await flush();
    const component = fixture.componentInstance as any;
    const el = { paused: true, play: vi.fn(), pause: vi.fn() } as unknown as HTMLAudioElement;
    component.togglePlay(0, el);
    expect(fake.callsTo('downloadMedia')).toHaveLength(1);
    expect(el.play).toHaveBeenCalled();

    fake.cachedMedia.set(REMOTE, 'blob:done');
    OfflineHub.getInstance().mediaReady$.next({
      gen: 0,
      messageKey: 'm',
      urlKey: REMOTE,
      localPath: '',
    });
    await flush();
    fixture.detectChanges();
    expect(audioSrc()).toBe(REMOTE);
  });

  it('with offline off, tapping play asks the SDK for nothing', async () => {
    fake.setEnabled(false);
    fixture.detectChanges();
    await flush();
    const el = { paused: true, play: vi.fn(), pause: vi.fn() } as unknown as HTMLAudioElement;
    (fixture.componentInstance as any).togglePlay(0, el);
    expect(fake.callsTo('downloadMedia')).toHaveLength(0);
  });

  const fileRow = () => fixture.nativeElement.querySelector('.cometchat-audios-bubble__item--unsupported');
  const failAudio = () => fixture.nativeElement.querySelector('audio')!.dispatchEvent(new Event('error'));

  it('offline, a cached file whose remote URL fails first still plays its cached copy', async () => {
    // Offline, the remote URL fails before the SDK answers with its copy (seen live on Chrome).
    online = false;
    fake.cachedMedia.set(REMOTE, 'blob:song');
    fixture.detectChanges();
    expect(audioSrc()).toBe(REMOTE);
    failAudio();
    fixture.detectChanges();
    expect(fileRow()).not.toBeNull();
    await flush();
    fixture.detectChanges();
    expect(audioSrc()).toBe('blob:song');
    expect(fileRow()).toBeNull();
  });

  it('a cached copy that fails to load still shows the file row', async () => {
    fake.cachedMedia.set(REMOTE, 'blob:song');
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    failAudio();
    fixture.detectChanges();
    expect(audioSrc()).toBeUndefined();
    expect(fileRow()).not.toBeNull();
  });

  it('with offline off, a link that fails to load still shows the file row', async () => {
    fake.setEnabled(false);
    fixture.detectChanges();
    await flush();
    failAudio();
    fixture.detectChanges();
    expect(audioSrc()).toBeUndefined();
    expect(fileRow()).not.toBeNull();
  });

  it('revokes the object URL when destroyed', async () => {
    fake.cachedMedia.set(REMOTE, 'blob:song');
    fixture.detectChanges();
    await flush();
    fixture.destroy();
    expect((URL as any).revokeObjectURL).toHaveBeenCalledWith('blob:song');
  });
});
