vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChatFileBubbleComponent } from './cometchat-file-bubble.component';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';

const REMOTE = 'https://cdn.example.com/report.pdf';
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function fileMessage(): any {
  return {
    getAttachments: () => [
      { url: REMOTE, name: 'report.pdf', mimeType: 'application/pdf', size: 2048 },
    ],
    getCaption: () => '',
  };
}

/** Offline file bubbles: Download uses the cached copy; a never-downloaded file says when it is available. */
describe('CometChatFileBubbleComponent offline media', () => {
  let fake: OfflineSdkFake;
  let fixture: ComponentFixture<CometChatFileBubbleComponent>;
  let online: boolean;

  beforeEach(async () => {
    fake = installOfflineSdk();
    online = true;
    (URL as any).revokeObjectURL = vi.fn();
    // The SDK's connection state (never navigator.onLine, README P3).
    Object.defineProperty(fake, 'connected', { get: () => online, configurable: true });
    await TestBed.configureTestingModule({
      imports: [CometChatFileBubbleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatFileBubbleComponent);
    fixture.componentRef.setInput('message', fileMessage());
  });
  afterEach(() => {
    fake.restore();
    vi.restoreAllMocks();
    OfflineHub.resetForTests();
  });

  const settle = async () => {
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
  };
  const download = (): HTMLElement | null =>
    fixture.nativeElement.querySelector('button.cometchat-file-bubble__download');

  it('keeps Download for a cached file', async () => {
    fake.cachedMedia.set(REMOTE, 'blob:report');
    await settle();
    expect((fixture.componentInstance as any).attachments[0].url).toBe('blob:report');
    expect(download()).not.toBeNull();
  });

  it('shows "Available when online" and disables Download for a never-downloaded file while offline', async () => {
    online = false;
    await settle();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Available when online');
    expect(download()).toBeNull();
  });

  it('offers Download again when the SDK finishes the download', async () => {
    online = false;
    await settle();
    fake.cachedMedia.set(REMOTE, 'blob:report');
    OfflineHub.getInstance().mediaReady$.next({
      gen: 0,
      messageKey: 'm',
      urlKey: REMOTE,
      localPath: '',
    });
    await flush();
    fixture.detectChanges();
    expect(download()).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Available when online');
  });

  it('is unchanged with offline off', async () => {
    fake.setEnabled(false);
    online = false;
    await settle();
    expect(download()).not.toBeNull();
    expect(fake.callsTo('getCachedMediaObjectURL')).toHaveLength(0);
  });
});
