vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatAudioBubbleComponent } from './cometchat-audio-bubble.component';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';

const REMOTE = 'https://cdn.example.com/voice.mp3';
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function audioMessage(): any {
  return {
    getAttachments: () => [{ url: REMOTE, name: 'voice.mp3', mimeType: 'audio/mpeg', size: 5 }],
    getCaption: () => '',
    getData: () => ({}),
  };
}

/** AC-12.3 on the waveform audio bubble: a tap keeps a copy, playback is never rebuilt. */
describe('CometChatAudioBubbleComponent offline media', () => {
  let fake: OfflineSdkFake;
  let fixture: ComponentFixture<CometChatAudioBubbleComponent>;

  const player = () => ({
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    destroy: vi.fn(),
    unAll: vi.fn(),
  });
  const ready = async () => {
    const component = fixture.componentInstance as any;
    // No real WaveSurfer in jsdom: a test player stands in for the one the bubble would build.
    vi.spyOn(component, 'initializeAllWaveSurfers').mockImplementation(() => undefined);
    fixture.componentRef.setInput('message', audioMessage());
    fixture.detectChanges();
    await flush();
    const state = component.getAudioState(0);
    state.waveSurfer = player();
    state.isLoading = false;
    return { component, state };
  };

  beforeEach(async () => {
    fake = installOfflineSdk();
    (URL as any).revokeObjectURL = vi.fn();
    await TestBed.configureTestingModule({
      imports: [CometChatAudioBubbleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatAudioBubbleComponent);
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
    OfflineHub.resetForTests();
  });

  it('AC-12.3: tapping play online on a never-downloaded audio asks the SDK for a copy, once', async () => {
    const { component, state } = await ready();
    component.onPlayPause(0);
    expect(fake.callsTo('downloadMedia')).toHaveLength(1);
    expect(state.waveSurfer.play).toHaveBeenCalled();
  });

  it('does not rebuild a playing waveform when the download finishes', async () => {
    const { component, state } = await ready();
    component.onPlayPause(0);
    await flush();
    const playing = state.waveSurfer;
    expect(state.isPlaying).toBe(true);

    fake.cachedMedia.set(REMOTE, 'blob:done');
    OfflineHub.getInstance().mediaReady$.next({
      gen: 0,
      messageKey: 'm',
      urlKey: REMOTE,
      localPath: '',
    });
    await flush();
    expect(component.getAudioState(0).waveSurfer).toBe(playing);
    expect(playing.destroy).not.toHaveBeenCalled();
    expect(component.attachments[0].url).toBe(REMOTE);
  });

  it('does not rebuild a playing waveform when the connection changes', async () => {
    const { component, state } = await ready();
    component.onPlayPause(0);
    await flush();
    const playing = state.waveSurfer;
    component.offlineMedia.lastOnResolved(); // what the connection watcher calls
    await flush();
    expect(component.getAudioState(0).waveSurfer).toBe(playing);
    expect(playing.destroy).not.toHaveBeenCalled();
  });

  it('with offline off, tapping play asks the SDK for nothing', async () => {
    fake.setEnabled(false);
    const { component } = await ready();
    component.onPlayPause(0);
    expect(fake.callsTo('downloadMedia')).toHaveLength(0);
  });
});
