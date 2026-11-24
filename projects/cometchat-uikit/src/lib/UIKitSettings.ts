import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Offline support settings, passed through unchanged to the Chat SDK's
 * `AppSettingsBuilder.setOfflineConfig()`.
 *
 * Declared structurally so the kit's public types never depend on an SDK
 * release that has offline support. It lists exactly the options the SDK's
 * `OfflineConfig` has, with no catch-all, so a misspelled option (for example
 * `enable` for `enabled`) is a compile error instead of leaving offline off.
 * Offline support needs a Chat SDK with offline support (4.3.1 or later); on an
 * older SDK, 4.3.0 included, this setting has no effect.
 * Leaving it unset keeps offline support off.
 */
export interface CometChatOfflineConfig {
  enabled?: boolean;
  cacheDurationDays?: number;
  maxStorageSize?: number;
  maxMessagesPerConversation?: number;
  maxConversations?: number;
  maxPendingMessages?: number;
  autoSendPendingOnReconnect?: boolean;
  pendingQueueOverflowPolicy?: string;
  mediaCaching?: string;
  maxMediaCacheSize?: number;
  maxSnapshotQueries?: number;
  snapshotTtlDays?: number;
  encryption?: boolean;
  encryptionFailureBehavior?: string;
  debugTracing?: boolean;
}

/**
 * Represents the settings required to initialize the CometChat UIKit.
 * Use `UIKitSettingsBuilder` to create an instance of this class.
 *
 * @example
 * const settings = new UIKitSettingsBuilder()
 *   .setAppId('YOUR_APP_ID')
 *   .setRegion('us')
 *   .setAuthKey('YOUR_AUTH_KEY')
 *   .build();
 *
 * CometChatUIKit.init(settings);
 */
export class UIKitSettings {
  appId?: string;
  region?: string;
  subscriptionType?: string;
  autoEstablishSocketConnection: boolean;
  authKey?: string;
  roles?: string[];
  adminHost?: string;
  clientHost?: string;
  storageMode: CometChat.StorageMode;
  /**
   * Whether calling features (voice/video) are enabled.
   * When `false` (default), the Calls SDK is not initialized and
   * call buttons are hidden across all components.
   * @default false
   */
  callingEnabled: boolean;

  /**
   * Custom CallAppSettings to use when initializing the Calls SDK.
   * If not provided, the UIKit builds default settings from appId and region.
   * Typed as `any` because `@cometchat/calls-sdk-javascript` is an optional dependency.
   */
  callAppSettings?: any;

  /**
   * Offline support settings handed to the Chat SDK at init. Absent by
   * default, which leaves offline support off.
   */
  offlineConfig?: CometChatOfflineConfig;

  /**
   * Creates a new UIKitSettings instance.
   * Prefer using UIKitSettingsBuilder for a fluent API.
   */
  constructor(builder?: UIKitSettingsBuilder) {
    if (builder) {
      this.appId = builder.appId;
      this.region = builder.region;
      this.subscriptionType = builder.subscriptionType;
      this.autoEstablishSocketConnection = builder.autoEstablishSocketConnection ?? true;
      this.authKey = builder.authKey;
      this.adminHost = builder.adminHost;
      this.clientHost = builder.clientHost;
      this.roles = builder.roles;
      this.storageMode = builder.storageMode ?? CometChat.StorageMode.LOCAL;
      this.callingEnabled = builder.callingEnabled ?? false;
      this.callAppSettings = builder.callAppSettings;
      this.offlineConfig = builder.offlineConfig;
    } else {
      this.autoEstablishSocketConnection = true;
      this.storageMode = CometChat.StorageMode.LOCAL;
      this.callingEnabled = false;
    }
  }

  static fromBuilder(builder: UIKitSettingsBuilder): UIKitSettings {
    return new UIKitSettings(builder);
  }

  getAppId(): string | undefined {
    return this.appId;
  }
  getRegion(): string | undefined {
    return this.region;
  }
  getRoles(): string[] | undefined {
    return this.roles;
  }
  getSubscriptionType(): string | undefined {
    return this.subscriptionType;
  }
  getAuthKey(): string | undefined {
    return this.authKey;
  }
  isAutoEstablishSocketConnection(): boolean {
    return this.autoEstablishSocketConnection;
  }
  getAdminHost(): string | undefined {
    return this.adminHost;
  }
  getClientHost(): string | undefined {
    return this.clientHost;
  }
  getStorageMode(): CometChat.StorageMode {
    return this.storageMode;
  }
  isCallingEnabled(): boolean {
    return this.callingEnabled;
  }
  getCallAppSettings(): any | undefined {
    return this.callAppSettings;
  }
  getOfflineConfig(): CometChatOfflineConfig | undefined {
    return this.offlineConfig;
  }
}

/**
 * Builder class for creating UIKitSettings instances.
 * Provides a fluent API for configuring CometChat UIKit settings.
 *
 * @example
 * const settings = new UIKitSettingsBuilder()
 *   .setAppId('YOUR_APP_ID')
 *   .setRegion('us')
 *   .setAuthKey('YOUR_AUTH_KEY')
 *   .build();
 */
export class UIKitSettingsBuilder {
  appId?: string;
  region?: string;
  subscriptionType?: string;
  roles?: string[];
  autoEstablishSocketConnection?: boolean;
  authKey?: string;
  adminHost?: string;
  clientHost?: string;
  storageMode?: CometChat.StorageMode;
  callingEnabled?: boolean;
  callAppSettings?: any;
  offlineConfig?: CometChatOfflineConfig;

  build(): UIKitSettings {
    return UIKitSettings.fromBuilder(this);
  }

  setAppId(appId: string): UIKitSettingsBuilder {
    this.appId = appId;
    return this;
  }

  setRegion(region: string): UIKitSettingsBuilder {
    this.region = region;
    return this;
  }

  setAuthKey(authKey: string): UIKitSettingsBuilder {
    this.authKey = authKey;
    return this;
  }

  subscribePresenceForAllUsers(): UIKitSettingsBuilder {
    this.subscriptionType = 'ALL_USERS';
    return this;
  }

  subscribePresenceForFriends(): UIKitSettingsBuilder {
    this.subscriptionType = 'FRIENDS';
    return this;
  }

  subscribePresenceForRoles(roles: string[]): UIKitSettingsBuilder {
    this.subscriptionType = 'ROLES';
    this.roles = roles;
    return this;
  }

  setRoles(roles: string[]): UIKitSettingsBuilder {
    this.roles = roles;
    return this;
  }

  setAutoEstablishSocketConnection(autoEstablish: boolean): UIKitSettingsBuilder {
    this.autoEstablishSocketConnection = autoEstablish;
    return this;
  }

  setAdminHost(adminHost: string): UIKitSettingsBuilder {
    this.adminHost = adminHost;
    return this;
  }

  setClientHost(clientHost: string): UIKitSettingsBuilder {
    this.clientHost = clientHost;
    return this;
  }

  setStorageMode(storageMode: CometChat.StorageMode): UIKitSettingsBuilder {
    this.storageMode = storageMode;
    return this;
  }

  /**
   * Enables or disables calling features (voice/video).
   * When `true`, the Calls SDK is initialized after login and call buttons
   * become visible in components like MessageHeader and CallLogs.
   * @default false
   */
  setCallingEnabled(enabled: boolean): UIKitSettingsBuilder {
    this.callingEnabled = enabled;
    return this;
  }

  /**
   * Sets a custom `CallAppSettings` object to use when initializing the Calls SDK.
   * If not set, the UIKit builds default settings from `appId` and `region`.
   *
   * Build the settings using `CometChatUIKitCalls.CallAppSettingsBuilder`.
   *
   * @example
   * import { CometChatUIKitCalls } from '@cometchat/calls-sdk-javascript';
   *
   * const callAppSettings = new CometChatUIKitCalls.CallAppSettingsBuilder()
   *   .setAppId('APP_ID')
   *   .setRegion('REGION')
   *   .build();
   *
   * const settings = new UIKitSettingsBuilder()
   *   .setAppId('APP_ID')
   *   .setRegion('REGION')
   *   .setCallingEnabled(true)
   *   .setCallAppSettings(callAppSettings)
   *   .build();
   */
  setCallAppSettings(callAppSettings: any): UIKitSettingsBuilder {
    this.callAppSettings = callAppSettings;
    return this;
  }

  /**
   * Turns on the Chat SDK's offline support (cached reads, a durable outbox,
   * catch-up sync) and the kit's offline UI. The config is passed to the SDK
   * as is. Requires a Chat SDK with offline support; on an older SDK it is
   * ignored and the kit behaves as before.
   *
   * @example
   * new UIKitSettingsBuilder()
   *   .setAppId('APP_ID')
   *   .setRegion('REGION')
   *   .setOfflineConfig({ enabled: true })
   *   .build();
   */
  setOfflineConfig(config: CometChatOfflineConfig): UIKitSettingsBuilder {
    this.offlineConfig = config;
    return this;
  }
}
