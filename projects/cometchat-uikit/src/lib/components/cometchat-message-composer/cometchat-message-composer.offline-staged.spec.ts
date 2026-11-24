/**
 * Staged attachments with offline support on: every file is handed to the SDK as soon as the
 * one before it is pending (Android `handedOff`), not after each one is answered. A send queued
 * behind an unsent message gets no answer for a long time, so waiting stacked ~15 s per file.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageComposerComponent } from './cometchat-message-composer.component';
import { CometChatFullScreenViewerComponent } from '../base-elements/cometchat-fullscreen-viewer';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import { MessageComposerService } from '../../services/message-composer.service';
import { installOfflineSdk, OfflineSdkFake, offlineMessage } from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';

function tile(type: 'image' | 'file', name: string) {
  const attachment = new (CometChat as any).Attachment({
    name,
    url: `https://x/${name}`,
    mimeType: 'image/png',
    extension: 'png',
    size: 1,
  });
  return { type, attachment, status: 'done' };
}

describe('staged attachments, offline on: hand-off at pending', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    OfflineHub.getInstance().start();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('starts the second file while the first is only pending', async () => {
    const tiles = [tile('image', 'a.png'), tile('file', 'b.pdf')];
    const stub = {
      tiles: signal([]),
      hasTiles: signal(true),
      aggregate: signal({ loaded: 0, total: 0, percent: 0 }),
      notice: signal<string | null>(null),
      canSend: signal(true),
      getSuccessfulAttachments: vi.fn(() => []),
      getSuccessfulTiles: vi.fn(() => tiles),
      getBatchId: vi.fn(() => 'batch-1'),
      setValidationConfig: vi.fn(),
      stage: vi.fn(),
      getMaxCount: vi.fn(async () => 10),
      remainingSlots: vi.fn(async () => 10),
      cancel: vi.fn(),
      remove: vi.fn(),
      retry: vi.fn(),
      clearAll: vi.fn(),
      reset: vi.fn(),
    };
    await TestBed.configureTestingModule({ imports: [CometChatMessageComposerComponent] })
      .overrideComponent(CometChatMessageComposerComponent, {
        set: {
          providers: [{ provide: MediaUploadTrayService, useValue: stub }, MessageComposerService],
        },
      })
      .overrideComponent(CometChatFullScreenViewerComponent, {
        set: { template: '<div></div>', styles: [] },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(CometChatMessageComposerComponent);
    const component = fixture.componentInstance as any;
    component.user = new CometChat.User('peer');
    fixture.detectChanges();

    // Each send is accepted (pending) and then silent: it waits behind an unsent message.
    for (const id of ['L1', 'L2']) {
      fake.scriptSend((listener, message) =>
        listener.onMessagePending(
          offlineMessage(message, { localMessageId: id, status: 'PENDING' })
        )
      );
    }
    const done = component.sendStagedMessage();
    // Only macrotasks pass, nowhere near the 15 s bound.
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fake.callsTo('sendMediaMessage')).toHaveLength(2);
    await done;
    expect(component.isSendingStaged()).toBe(false);
  });
});
