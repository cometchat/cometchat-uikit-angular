import { CometChat } from '@cometchat/chat-sdk-javascript';

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
}
