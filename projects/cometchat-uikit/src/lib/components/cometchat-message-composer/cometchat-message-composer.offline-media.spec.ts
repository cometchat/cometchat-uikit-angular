/**
 * A file picked or dropped while offline (AC-12.4, UIT-MEDIA-03): the tray's
 * upload cannot start, so it goes straight to the SDK's queue. Online, and with
 * offline off, it stages in the tray as today.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { CometChatMessageComposerComponent } from './cometchat-message-composer.component';

function host() {
  return {
    enableMultipleAttachments: true,
    pendingPickerKind: undefined,
    getReceiver: vi.fn(() => null),
    mediaUploadTray: {
      setValidationConfig: vi.fn(),
      setReceiver: vi.fn(),
      stage: vi.fn(() => Promise.resolve()),
    },
    emitError: vi.fn(),
  } as any;
}
const processFiles = (self: any, files: File[]) =>
  (CometChatMessageComposerComponent.prototype as any).processFiles.call(self, files);
const photo = () => new File([new Uint8Array(1)], 'photo.png', { type: 'image/png' });

describe('composer: a file added on the offline path', () => {
  let fake: OfflineSdkFake;
  beforeEach(() => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
  });

  it('not connected: skips the tray and sends directly', () => {
    fake.connected = false;
    const self = host();
    processFiles(self, [photo()]);
    expect(self.mediaUploadTray.stage).not.toHaveBeenCalled();
    expect(self.getReceiver).toHaveBeenCalled();
  });

  it('connected: stages in the tray', () => {
    const self = host();
    processFiles(self, [photo()]);
    expect(self.mediaUploadTray.stage).toHaveBeenCalledTimes(1);
  });

  it('offline off: stages in the tray, whatever the connection', () => {
    fake.setEnabled(false);
    fake.connected = false;
    const self = host();
    processFiles(self, [photo()]);
    expect(self.mediaUploadTray.stage).toHaveBeenCalledTimes(1);
  });
});
