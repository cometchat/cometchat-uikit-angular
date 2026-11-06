/**
 * UIKitSettings & UIKitSettingsBuilder Tests
 *
 * Covers construction (bare and from a builder), every getter, the builder's
 * fluent API, the presence-subscription helpers, calling configuration,
 * default values and edge cases.
 *
 * Validates: Requirements 8.1, 8.2, 8.9
 *
 * @module UIKitSettings
 */
import { describe, it, expect } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { UIKitSettings, UIKitSettingsBuilder } from './UIKitSettings';

/**
 * Storage modes as literals rather than `CometChat.StorageMode.*`. The SDK's enum
 * members are not all populated under the test double, so referencing them would
 * compare `undefined` to `undefined` and assert nothing.
 */
const SESSION_STORAGE = 'session' as unknown as CometChat.StorageMode;
const LOCAL_STORAGE = 'local' as unknown as CometChat.StorageMode;

/** A builder with every field populated, for round-trip assertions. */
function fullBuilder(): UIKitSettingsBuilder {
  return new UIKitSettingsBuilder()
    .setAppId('app-123')
    .setRegion('eu')
    .setAuthKey('auth-key-abc')
    .setRoles(['admin', 'moderator'])
    .setAutoEstablishSocketConnection(false)
    .setAdminHost('https://admin.example.com')
    .setClientHost('https://client.example.com')
    .setStorageMode(SESSION_STORAGE)
    .setCallingEnabled(true)
    .setCallAppSettings({ appId: 'app-123' });
}

describe('UIKitSettings', () => {
  // -------------------------------------------------------------------------
  // Default Construction
  // -------------------------------------------------------------------------
  describe('Default construction', () => {
    it('should create an instance with no builder', () => {
      expect(new UIKitSettings()).toBeTruthy();
    });

    it('should default autoEstablishSocketConnection to true', () => {
      expect(new UIKitSettings().isAutoEstablishSocketConnection()).toBe(true);
    });

    it('should default appId to undefined', () => {
      expect(new UIKitSettings().getAppId()).toBeUndefined();
    });

    it('should default region to undefined', () => {
      expect(new UIKitSettings().getRegion()).toBeUndefined();
    });

    it('should default authKey to undefined', () => {
      expect(new UIKitSettings().getAuthKey()).toBeUndefined();
    });

    it('should default callingEnabled to false', () => {
      expect(new UIKitSettings().isCallingEnabled()).toBe(false);
    });

    it('should default callAppSettings to undefined', () => {
      expect(new UIKitSettings().getCallAppSettings()).toBeUndefined();
    });

    it('should default roles to undefined', () => {
      expect(new UIKitSettings().getRoles()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Construction from Builder
  // -------------------------------------------------------------------------
  describe('Construction from builder', () => {
    it('should create settings from a builder via constructor', () => {
      const settings = new UIKitSettings(fullBuilder());
      expect(settings.getAppId()).toBe('app-123');
      expect(settings.getRegion()).toBe('eu');
      expect(settings.getAuthKey()).toBe('auth-key-abc');
    });

    it('should create settings via static fromBuilder method', () => {
      const settings = UIKitSettings.fromBuilder(fullBuilder());
      expect(settings).toBeInstanceOf(UIKitSettings);
      expect(settings.getAppId()).toBe('app-123');
    });

    it('should carry the builder values across both construction paths alike', () => {
      const builder = fullBuilder();
      const viaCtor = new UIKitSettings(builder);
      const viaStatic = UIKitSettings.fromBuilder(builder);

      expect(viaStatic.getAppId()).toBe(viaCtor.getAppId());
      expect(viaStatic.getRegion()).toBe(viaCtor.getRegion());
      expect(viaStatic.getStorageMode()).toBe(viaCtor.getStorageMode());
    });
  });

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------
  describe('Getter methods', () => {
    const settings = new UIKitSettings(fullBuilder());

    it('should return appId via getAppId()', () => {
      expect(settings.getAppId()).toBe('app-123');
    });

    it('should return region via getRegion()', () => {
      expect(settings.getRegion()).toBe('eu');
    });

    it('should return authKey via getAuthKey()', () => {
      expect(settings.getAuthKey()).toBe('auth-key-abc');
    });

    it('should return roles via getRoles()', () => {
      expect(settings.getRoles()).toEqual(['admin', 'moderator']);
    });

    it('should return subscriptionType via getSubscriptionType()', () => {
      const withRoles = new UIKitSettings(
        new UIKitSettingsBuilder().subscribePresenceForRoles(['admin'])
      );
      expect(withRoles.getSubscriptionType()).toBeTruthy();
    });

    it('should return adminHost via getAdminHost()', () => {
      expect(settings.getAdminHost()).toBe('https://admin.example.com');
    });

    it('should return clientHost via getClientHost()', () => {
      expect(settings.getClientHost()).toBe('https://client.example.com');
    });

    it('should return storageMode via getStorageMode()', () => {
      expect(settings.getStorageMode()).toBe(SESSION_STORAGE);
    });

    it('should report the socket-connection flag via isAutoEstablishSocketConnection()', () => {
      expect(settings.isAutoEstablishSocketConnection()).toBe(false);
    });

    it('should report calling via isCallingEnabled()', () => {
      expect(settings.isCallingEnabled()).toBe(true);
    });

    it('should return callAppSettings via getCallAppSettings()', () => {
      expect(settings.getCallAppSettings()).toEqual({ appId: 'app-123' });
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('Edge cases', () => {
    it('should handle builder with no properties set', () => {
      const settings = new UIKitSettings(new UIKitSettingsBuilder());
      expect(settings.getAppId()).toBeUndefined();
      expect(settings.getRegion()).toBeUndefined();
      expect(settings.getRoles()).toBeUndefined();
    });

    it('should handle null-like values gracefully', () => {
      const builder = new UIKitSettingsBuilder();
      builder.appId = undefined;
      builder.region = undefined;
      builder.roles = undefined;

      const settings = new UIKitSettings(builder);
      expect(settings.getAppId()).toBeUndefined();
      expect(settings.getRoles()).toBeUndefined();
    });

    it('should accept an empty roles array', () => {
      const settings = new UIKitSettings(new UIKitSettingsBuilder().setRoles([]));
      expect(settings.getRoles()).toEqual([]);
    });

    it('should accept an empty-string appId without substituting a default', () => {
      const settings = new UIKitSettings(new UIKitSettingsBuilder().setAppId(''));
      expect(settings.getAppId()).toBe('');
    });
  });
});

describe('UIKitSettingsBuilder', () => {
  // -------------------------------------------------------------------------
  // Fluent API
  // -------------------------------------------------------------------------
  describe('Fluent API', () => {
    it('should return the builder instance from setAppId()', () => {
      const b = new UIKitSettingsBuilder();
      expect(b.setAppId('x')).toBe(b);
    });

    it('should return the builder instance from setRegion()', () => {
      const b = new UIKitSettingsBuilder();
      expect(b.setRegion('us')).toBe(b);
    });

    it('should return the builder instance from setAuthKey()', () => {
      const b = new UIKitSettingsBuilder();
      expect(b.setAuthKey('k')).toBe(b);
    });

    it.each([
      ['setRoles', (b: UIKitSettingsBuilder) => b.setRoles(['a'])],
      ['setAutoEstablishSocketConnection', (b: UIKitSettingsBuilder) => b.setAutoEstablishSocketConnection(true)],
      ['setAdminHost', (b: UIKitSettingsBuilder) => b.setAdminHost('h')],
      ['setClientHost', (b: UIKitSettingsBuilder) => b.setClientHost('h')],
      ['setStorageMode', (b: UIKitSettingsBuilder) => b.setStorageMode(LOCAL_STORAGE)],
      ['setCallingEnabled', (b: UIKitSettingsBuilder) => b.setCallingEnabled(true)],
      ['setCallAppSettings', (b: UIKitSettingsBuilder) => b.setCallAppSettings({})],
      ['subscribePresenceForAllUsers', (b: UIKitSettingsBuilder) => b.subscribePresenceForAllUsers()],
      ['subscribePresenceForFriends', (b: UIKitSettingsBuilder) => b.subscribePresenceForFriends()],
      ['subscribePresenceForRoles', (b: UIKitSettingsBuilder) => b.subscribePresenceForRoles(['a'])],
    ])('should return the builder instance from %s()', (_name, call) => {
      const b = new UIKitSettingsBuilder();
      expect(call(b)).toBe(b);
    });

    it('should chain multiple setters and build()', () => {
      const settings = new UIKitSettingsBuilder()
        .setAppId('chained-app')
        .setRegion('in')
        .setAuthKey('chained-key')
        .setCallingEnabled(true)
        .build();

      expect(settings.getAppId()).toBe('chained-app');
      expect(settings.getRegion()).toBe('in');
      expect(settings.getAuthKey()).toBe('chained-key');
      expect(settings.isCallingEnabled()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Individual setters
  // -------------------------------------------------------------------------
  describe('Setters', () => {
    it('should record the admin host', () => {
      expect(new UIKitSettingsBuilder().setAdminHost('https://a').adminHost).toBe('https://a');
    });

    it('should record the client host', () => {
      expect(new UIKitSettingsBuilder().setClientHost('https://c').clientHost).toBe('https://c');
    });

    it('should record the storage mode', () => {
      const b = new UIKitSettingsBuilder().setStorageMode(LOCAL_STORAGE);
      expect(b.storageMode).toBe(LOCAL_STORAGE);
    });

    it('should record the socket-connection flag', () => {
      expect(new UIKitSettingsBuilder().setAutoEstablishSocketConnection(false)
        .autoEstablishSocketConnection).toBe(false);
    });

    it('should record roles', () => {
      expect(new UIKitSettingsBuilder().setRoles(['admin']).roles).toEqual(['admin']);
    });

    it('should record the calling flag', () => {
      expect(new UIKitSettingsBuilder().setCallingEnabled(true).callingEnabled).toBe(true);
    });

    it('should record custom call app settings', () => {
      const cas = { appId: 'x', region: 'eu' };
      expect(new UIKitSettingsBuilder().setCallAppSettings(cas).callAppSettings).toBe(cas);
    });

    it('should let a later call overwrite an earlier one', () => {
      const b = new UIKitSettingsBuilder().setAppId('first').setAppId('second');
      expect(b.appId).toBe('second');
    });
  });

  // -------------------------------------------------------------------------
  // Presence subscription helpers
  // -------------------------------------------------------------------------
  describe('Subscription type helpers', () => {
    it('should set subscriptionType to ALL_USERS', () => {
      const b = new UIKitSettingsBuilder().subscribePresenceForAllUsers();
      expect(b.subscriptionType).toBeTruthy();
      expect(b.subscriptionType).not.toBe(
        new UIKitSettingsBuilder().subscribePresenceForFriends().subscriptionType
      );
    });

    it('should set subscriptionType to FRIENDS', () => {
      expect(new UIKitSettingsBuilder().subscribePresenceForFriends().subscriptionType).toBeTruthy();
    });

    it('should set subscriptionType to ROLES with roles array', () => {
      const b = new UIKitSettingsBuilder().subscribePresenceForRoles(['admin', 'mod']);
      expect(b.subscriptionType).toBeTruthy();
      expect(b.roles).toEqual(['admin', 'mod']);
    });

    it('should give each helper a distinct subscription type', () => {
      const types = new Set([
        new UIKitSettingsBuilder().subscribePresenceForAllUsers().subscriptionType,
        new UIKitSettingsBuilder().subscribePresenceForFriends().subscriptionType,
        new UIKitSettingsBuilder().subscribePresenceForRoles(['a']).subscriptionType,
      ]);
      expect(types.size).toBe(3);
    });

    it('should let a later helper replace an earlier choice', () => {
      const b = new UIKitSettingsBuilder().subscribePresenceForAllUsers().subscribePresenceForFriends();
      expect(b.subscriptionType).toBe(
        new UIKitSettingsBuilder().subscribePresenceForFriends().subscriptionType
      );
    });
  });

  // -------------------------------------------------------------------------
  // Build
  // -------------------------------------------------------------------------
  describe('build()', () => {
    it('should produce a UIKitSettings instance', () => {
      expect(new UIKitSettingsBuilder().build()).toBeInstanceOf(UIKitSettings);
    });

    it('should transfer all configured values to the settings', () => {
      const settings = fullBuilder().build();

      expect(settings.getAppId()).toBe('app-123');
      expect(settings.getRegion()).toBe('eu');
      expect(settings.getAuthKey()).toBe('auth-key-abc');
      expect(settings.getRoles()).toEqual(['admin', 'moderator']);
      expect(settings.isAutoEstablishSocketConnection()).toBe(false);
      expect(settings.getAdminHost()).toBe('https://admin.example.com');
      expect(settings.getClientHost()).toBe('https://client.example.com');
      expect(settings.getStorageMode()).toBe(SESSION_STORAGE);
      expect(settings.isCallingEnabled()).toBe(true);
      expect(settings.getCallAppSettings()).toEqual({ appId: 'app-123' });
    });

    it('should produce an independent settings object on each call', () => {
      const builder = fullBuilder();
      expect(builder.build()).not.toBe(builder.build());
    });

    it('should reflect a change made to the builder after an earlier build', () => {
      const builder = new UIKitSettingsBuilder().setAppId('one');
      const first = builder.build();
      builder.setAppId('two');

      expect(first.getAppId()).toBe('one');
      expect(builder.build().getAppId()).toBe('two');
    });
  });
});
