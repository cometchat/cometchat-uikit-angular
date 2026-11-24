/** The one place the kit asks the SDK whether offline support is on. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk } from '../../testing/offline-sdk-fake';
import { hasSdkFunction, isOfflineOn, sdkConnected } from './offline-gate';
import { OfflineHub } from './offline-hub';

describe('offline gate', () => {
  const sdk = CometChat as any;
  const saved = {
    isOfflineEnabled: Object.getOwnPropertyDescriptor(sdk, 'isOfflineEnabled'),
    getConnectionStatus: Object.getOwnPropertyDescriptor(sdk, 'getConnectionStatus'),
    OfflineCacheResetReason: Object.getOwnPropertyDescriptor(sdk, 'OfflineCacheResetReason'),
  };
  // The 4.3.1 enum (the SDK release the kit needs); 4.3.0 has the same enum without SCHEMA_RESET.
  const resetReasons431 = {
    KEY_LOST: 'KEY_LOST',
    WRONG_KEY: 'WRONG_KEY',
    CORRUPTED: 'CORRUPTED',
    ESCALATED: 'ESCALATED',
    ENCRYPTION_CHANGED: 'ENCRYPTION_CHANGED',
    SCHEMA_RESET: 'SCHEMA_RESET',
  };
  const { SCHEMA_RESET: _absentIn430, ...resetReasons430 } = resetReasons431;
  beforeEach(() => {
    sdk.OfflineCacheResetReason = resetReasons431;
  });
  afterEach(() => {
    for (const [name, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(sdk, name, descriptor);
      else delete sdk[name];
    }
  });

  it('is off on an SDK that has no isOfflineEnabled', () => {
    delete sdk.isOfflineEnabled;
    expect(isOfflineOn()).toBe(false);
    expect(hasSdkFunction('isOfflineEnabled')).toBe(false);
  });

  it('is on only when the SDK answers exactly true, read fresh every time', () => {
    let answer: unknown = true;
    sdk.isOfflineEnabled = () => answer;
    expect(isOfflineOn()).toBe(true);
    expect(hasSdkFunction('isOfflineEnabled')).toBe(true);
    answer = 'yes';
    expect(isOfflineOn()).toBe(false);
    answer = false;
    expect(isOfflineOn()).toBe(false);
  });

  it('is off when the SDK call throws', () => {
    sdk.isOfflineEnabled = () => {
      throw new Error('boom');
    };
    expect(isOfflineOn()).toBe(false);
  });

  it('sdkConnected compares the connection status with the connected value', () => {
    sdk.getConnectionStatus = () => 'connected';
    expect(sdkConnected()).toBe(true);
    sdk.getConnectionStatus = () => 'disconnected';
    expect(sdkConnected()).toBe(false);
    delete sdk.getConnectionStatus;
    expect(sdkConnected()).toBe(false);
  });

  describe('SDK floor: offline needs Chat SDK 4.3.1', () => {
    it('stays off on a 4.3.0-shaped SDK, whose isOfflineEnabled answers true', () => {
      sdk.isOfflineEnabled = () => true;
      sdk.OfflineCacheResetReason = resetReasons430;
      expect(isOfflineOn()).toBe(false);
    });

    it('stays off when the SDK has no OfflineCacheResetReason at all', () => {
      sdk.isOfflineEnabled = () => true;
      delete sdk.OfflineCacheResetReason;
      expect(isOfflineOn()).toBe(false);
    });

    it('is on with a 4.3.1-shaped SDK', () => {
      sdk.isOfflineEnabled = () => true;
      sdk.OfflineCacheResetReason = resetReasons431;
      expect(isOfflineOn()).toBe(true);
    });

    describe('the hub', () => {
      beforeEach(() => OfflineHub.resetForTests());
      afterEach(() => OfflineHub.resetForTests());

      it('registers no SDK listener on a 4.3.0-shaped SDK', () => {
        const fake = installOfflineSdk();
        try {
          sdk.OfflineCacheResetReason = resetReasons430;
          OfflineHub.getInstance().start();
          expect(fake.callsTo('addOfflineMessageListener')).toEqual([]);
          expect(fake.callsTo('addSyncListener')).toEqual([]);
          expect(fake.callsTo('addOfflineCacheResetListener')).toEqual([]);
        } finally {
          fake.restore();
        }
      });

      it('registers its listeners on a 4.3.1-shaped SDK', () => {
        const fake = installOfflineSdk();
        try {
          OfflineHub.getInstance().start();
          expect(fake.callsTo('addOfflineMessageListener')).toHaveLength(1);
          expect(fake.callsTo('addOfflineCacheResetListener')).toHaveLength(1);
        } finally {
          fake.restore();
        }
      });
    });
  });
});
