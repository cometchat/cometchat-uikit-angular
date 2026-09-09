import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CometChat, CometChatSettings } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from './resources/CometChatLocalize/cometchat-localize';
import { UIKitSettings, UIKitSettingsBuilder } from './UIKitSettings';
import { CometChatSoundManager } from './resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatUIKitLoginListener } from './CometChatUIKitLoginListener';
import { ChatSdkEventInitializer } from './utils/ChatSdkEventInitializer';
import { InitResult, LogoutResult } from './modals/CometChatUIKitInterfaces';
import { CometChatLogger, LogLevel } from './utils/CometChatLogger';
import { CometChatUIKitCalls, getCometChatCalls } from './CometChatCalls';
import {
  sendTextMessage,
  sendMediaMessage,
  sendCustomMessage,
  createUser,
  updateUser,
} from './cometchat-uikit.utils';

// Re-export types for backward compatibility
export type { CometChatUiKitWindow } from './cometchat-uikit.types';

// Window type augmentation
declare global {
  interface Window {
    CometChatUiKit: { name: string; version: string };
  }
}

/**
 * `CometChatUIKit` provides a dual-API architecture for Angular applications.
 *
 * Enables SDK initialization and interaction both before Angular bootstraps
 * (via static methods in `main.ts`) and within Angular components (via DI).
 *
 * @example
 * // Static usage in main.ts
 * CometChatUIKit.init(settings).then(() => bootstrapApplication(AppComponent));
 *
 * @example
 * // Injectable usage in components
 * constructor(private uiKit: CometChatUIKit) {
 *   this.uiKit.loggedInUser$.subscribe(user => CometChatLogger.info(user));
 * }
 */
@Injectable({ providedIn: 'root' })
export class CometChatUIKit {
  private static _uiKitSettings: UIKitSettings | null = null;
  private static _loggedInUser: BehaviorSubject<CometChat.User | null> =
    new BehaviorSubject<CometChat.User | null>(null);
  private static _conversationUpdateSettings: CometChat.ConversationUpdateSettings;
  private static _themeMode: 'light' | 'dark' = 'light';
  /**
   * Parsed `cometchat-settings.json` captured when the kit was initialized via
   * `initFromSettings()`. Non-null only on the AI agent / skills path — it is
   * what tells `initCalling()` to route the Calls SDK through its own
   * `initFromSettings()` so `integrationSource = "ai-agent"` propagates to the
   * Calls SDK the same way it already does for the Chat SDK.
   */
  private static _cometChatSettings: CometChatSettings | null = null;

  static SoundManager: typeof CometChatSoundManager = CometChatSoundManager;
  static Localize: typeof CometChatLocalize = CometChatLocalize;
  static callingReady: Promise<void> = Promise.resolve();

  // ── Settings Accessors ────────────────────────────────────────────────────

  static get uiKitSettings(): UIKitSettings | null { return CometChatUIKit._uiKitSettings; }
  static set uiKitSettings(value: UIKitSettings | null) { CometChatUIKit._uiKitSettings = value; }
  static get conversationUpdateSettings(): CometChat.ConversationUpdateSettings { return CometChatUIKit._conversationUpdateSettings; }
  static set conversationUpdateSettings(value: CometChat.ConversationUpdateSettings) { CometChatUIKit._conversationUpdateSettings = value; }
  static get themeMode(): 'light' | 'dark' { return CometChatUIKit._themeMode; }
  static set themeMode(value: 'light' | 'dark') { CometChatUIKit._themeMode = value; }

  // ── User State ────────────────────────────────────────────────────────────

  static get loggedInUser$(): Observable<CometChat.User | null> {
    return CometChatUIKit._loggedInUser.asObservable();
  }
  get loggedInUser$(): Observable<CometChat.User | null> { return CometChatUIKit.loggedInUser$; }

  static getLoggedInUser(): CometChat.User | null { return CometChatUIKit._loggedInUser.getValue(); }
  getLoggedInUser(): CometChat.User | null { return CometChatUIKit.getLoggedInUser(); }

  // ── Initialization ────────────────────────────────────────────────────────

  static init(uiKitSettings: UIKitSettings | null): Promise<InitResult> | undefined {
    CometChatUIKit._uiKitSettings = uiKitSettings;
    // Plain developer path — the Calls SDK must go through plain init() too.
    CometChatUIKit._cometChatSettings = null;
    if (!CometChatUIKit.checkAuthSettings()) return undefined;
    const builder = new CometChat.AppSettingsBuilder();
    if (uiKitSettings!.getRoles()) { builder.subscribePresenceForRoles(uiKitSettings!.getRoles()!); }
    else if (uiKitSettings!.getSubscriptionType() === 'ALL_USERS') { builder.subscribePresenceForAllUsers(); }
    else if (uiKitSettings!.getSubscriptionType() === 'FRIENDS') { builder.subscribePresenceForFriends(); }
    builder.autoEstablishSocketConnection(uiKitSettings!.isAutoEstablishSocketConnection());
    builder.setRegion(uiKitSettings!.getRegion());
    if (uiKitSettings!.getAdminHost()) { builder.overrideAdminHost(uiKitSettings!.getAdminHost()!); }
    if (uiKitSettings!.getClientHost()) { builder.overrideClientHost(uiKitSettings!.getClientHost()!); }
    builder.setStorageMode(uiKitSettings!.getStorageMode() as any);
    const appSettings = builder.build();
    if (CometChat.setSource) { CometChat.setSource('uikit-v5', 'web', 'angular'); }
    CometChatLocalize.setCurrentLanguage(CometChatLocalize.getBrowserLanguage());
    return new Promise((resolve, reject) => {
      window.CometChatUiKit = { name: '@cometchat/chat-uikit-angular', version: '5.2.1' };
      CometChat.init(uiKitSettings?.appId, appSettings)
        .then(() => {
          CometChat.getLoggedinUser()
            .then((user: CometChat.User | null) => {
              if (user) { CometChatUIKitLoginListener.setLoggedInUser(user); CometChatUIKit._loggedInUser.next(user); this.initiateAfterLogin(); }
              return resolve({ user });
            })
            .catch((error: CometChat.CometChatException) => { CometChatLogger.error('CometChatUIKit', 'Initialization failed:', error); return reject(error); });
        })
        .catch((error: CometChat.CometChatException) => reject(error));
    });
  }
  init(uiKitSettings: UIKitSettings | null): Promise<InitResult> | undefined { return CometChatUIKit.init(uiKitSettings); }

  /**
   * File-based init for AI agent skills.
   * Accepts a parsed `cometchat-settings.json` object and delegates to the
   * Chat SDK's file-based init, which internally sets
   * `integrationSource = "ai-agent"` for telemetry. The same settings object is
   * retained so that, when calling is enabled, the Calls SDK is initialized via
   * `CometChatCalls.initFromSettings()` and reports the same source.
   *
   * This method is independent of `init()` — it does NOT call `init()`.
   * It builds UIKitSettings internally so login/createUser/updateUser keep working.
   *
   * @internal — excluded from public API docs
   */
  static initFromSettings(settings: CometChatSettings): Promise<InitResult> {
    // Extract UIKit-specific config from the settings JSON
    const authKey = settings.credentials?.authKey;
    const subscribeAll = settings.uiKit?.['subscribePresenceForAllUsers'] ?? true;
    // Calling stays opt-in on this path too — enabled only when the settings
    // file declares a `callsSDK` block, matching the React UI Kit's key.
    const callingEnabled = !!settings.uiKit?.['callsSDK'];

    // Build UIKitSettings so downstream code (login, enableCalling, etc.) works unchanged
    const builder = new UIKitSettingsBuilder()
      .setAppId(settings.appId)
      .setRegion(settings.region);
    if (authKey) { builder.setAuthKey(authKey); }
    if (subscribeAll) { builder.subscribePresenceForAllUsers(); }
    if (callingEnabled) { builder.setCallingEnabled(true); }
    CometChatUIKit._uiKitSettings = builder.build();

    // Retained for the Calls SDK: initCalling() uses its presence to pick
    // CometChatCalls.initFromSettings() over plain CometChatCalls.init().
    CometChatUIKit._cometChatSettings = settings;

    // Set source for telemetry
    if (CometChat.setSource) { CometChat.setSource('uikit-v5', 'web', 'angular'); }
    CometChatLocalize.setCurrentLanguage(CometChatLocalize.getBrowserLanguage());

    // CRITICAL: Call CometChat.initFromSettings() (NOT CometChat.init()).
    // This is the SDK's file-based init path which sets
    // integrationSource = "ai-agent" for telemetry.
    return new Promise((resolve, reject) => {
      window.CometChatUiKit = { name: '@cometchat/chat-uikit-angular', version: '5.2.1' };

      CometChat.initFromSettings(settings)
        .then(() => {
          CometChat.getLoggedinUser()
            .then((user: CometChat.User | null) => {
              if (user) {
                CometChatUIKitLoginListener.setLoggedInUser(user);
                CometChatUIKit._loggedInUser.next(user);
                this.initiateAfterLogin();
              }
              return resolve({ user });
            })
            .catch((error: CometChat.CometChatException) => {
              CometChatLogger.error('CometChatUIKit', 'Initialization failed:', error);
              return reject(error);
            });
        })
        .catch((error: CometChat.CometChatException) => {
          return reject(error);
        });
    });
  }

  static isInitialized(): boolean {
    try { return CometChat.isInitialized(); } catch (error) { CometChatLogger.error('CometChatUIKit', 'isInitialized check failed:', error); return false; }
  }
  isInitialized(): boolean { return CometChatUIKit.isInitialized(); }

  static setLogLevel(level: LogLevel): void { CometChatLogger.setLogLevel(level); }
  setLogLevel(level: LogLevel): void { CometChatUIKit.setLogLevel(level); }

  static isCallingEnabled(): boolean { return CometChatUIKit._uiKitSettings?.isCallingEnabled() ?? false; }
  isCallingEnabled(): boolean { return CometChatUIKit.isCallingEnabled(); }

  // ── Post-Login Setup ──────────────────────────────────────────────────────

  private static initiateAfterLogin(): void {
    if (CometChatUIKit._uiKitSettings != null) {
      CometChat.getConversationUpdateSettings().then((res: CometChat.ConversationUpdateSettings) => {
        CometChatUIKit._conversationUpdateSettings = res;
      });
      ChatSdkEventInitializer.attachListeners();
      CometChatUIKitLoginListener.attachListener();
      if (CometChatUIKit.isCallingEnabled()) { CometChatUIKit.callingReady = CometChatUIKit.initCalling(); }
    }
  }

  private static async initCalling(): Promise<void> {
    try {
      const callsSDK = await getCometChatCalls();
      if (callsSDK) {
        const settings = CometChatUIKit._cometChatSettings;
        // On the AI agent / skills path (`initFromSettings`) route the Calls SDK
        // through its own file-based init so it reports
        // `integrationSource = "ai-agent"`, mirroring the Chat SDK. Requires
        // @cometchat/calls-sdk-javascript >= 5.0.3 — older versions fall back to
        // plain init(), since the Calls SDK is an optional peer dependency.
        const initCallsSDK: Promise<unknown> =
          settings && typeof callsSDK.initFromSettings === 'function'
            ? callsSDK.initFromSettings(settings)
            : callsSDK.init(
              CometChatUIKit._uiKitSettings?.getCallAppSettings()
              ?? new callsSDK.CallAppSettingsBuilder()
                .setAppId(CometChatUIKit._uiKitSettings?.appId!)
                .setRegion(CometChatUIKit._uiKitSettings?.region!)
                .build()
            );
        initCallsSDK.then(
          (result: any) => {
            // The Calls SDK reports validation failures in the resolved value
            // instead of rejecting, so surface those too.
            if (result?.success === false) { CometChatLogger.error('CometChatUIKit', 'CometChatUIKitCalls initialization failed:', result.error); }
          },
          (error: CometChat.CometChatException) => { CometChatLogger.error('CometChatUIKit', 'CometChatUIKitCalls initialization failed:', error); }
        );
        const user = CometChatUIKit.getLoggedInUser();
        if (user) {
          // Required: without this the Calls SDK initialises but never establishes a
          // session, so every call fails.
          //
          // Known interaction, not yet fixed: `loginWithAuthToken` ends in the Calls
          // SDK's `saveUser()`, which writes the `${appId}:common_store/user` key the
          // Chat SDK owns and `CometChat.onStorageEvent` watches. A background tab
          // sees that write and the Chat SDK's own login write as two separate storage
          // events, and opens a WebSocket for each — the first torn down mid-handshake
          // by the second. The write is unconditional, so it happens even with no
          // cached user. Fixing it belongs in the Calls SDK or in how the two SDKs
          // share that key; disabling this call is not a fix, it just removes calling.
          await CometChatUIKitCalls.loginWithAuthToken(user.getAuthToken()).catch(
            (error: CometChat.CometChatException) => { CometChatLogger.error('CometChatUIKit', 'CometChatUIKitCalls login failed:', error); }
          );
        }
      }
    } catch (e) { CometChatLogger.error('CometChatUIKit', 'initCalling error:', e); }
  }

  // ── Authentication ────────────────────────────────────────────────────────

  static login(uid: string): Promise<CometChat.User> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChatUIKit.getLoggedinUser()?.then(user => {
        if (user) {
          CometChatUIKitLoginListener.setLoggedInUser(user); CometChatUIKit._loggedInUser.next(user);
          this.initiateAfterLogin(); return resolve(user);
        }
        CometChat.login(uid, CometChatUIKit._uiKitSettings!.authKey!)
          .then((user: CometChat.User) => {
            CometChatUIKitLoginListener.setLoggedInUser(user); CometChatUIKit._loggedInUser.next(user);
            this.initiateAfterLogin(); return resolve(user);
          })
          .catch((error: CometChat.CometChatException) => reject(error));
      });
    });
  }
  login(uid: string): Promise<CometChat.User> { return CometChatUIKit.login(uid); }

  static loginWithAuthToken(authToken: string): Promise<CometChat.User> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChat.login(authToken)
        .then((user: CometChat.User) => {
          CometChatUIKitLoginListener.setLoggedInUser(user); CometChatUIKit._loggedInUser.next(user);
          this.initiateAfterLogin(); return resolve(user);
        })
        .catch((error: CometChat.CometChatException) => reject(error));
    });
  }
  loginWithAuthToken(authToken: string): Promise<CometChat.User> { return CometChatUIKit.loginWithAuthToken(authToken); }

  static getLoggedinUser(): Promise<CometChat.User | null> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChat.getLoggedinUser()
        .then((user: CometChat.User | null) => {
          if (user) { CometChatUIKitLoginListener.setLoggedInUser(user); CometChatUIKit._loggedInUser.next(user); }
          return resolve(user);
        })
        .catch((error: CometChat.CometChatException) => reject(error));
    });
  }
  getLoggedinUser(): Promise<CometChat.User | null> { return CometChatUIKit.getLoggedinUser(); }

  static logout(): Promise<LogoutResult> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) {
        return reject({ code: 'ERROR_UIKIT_NOT_INITIALISED', message: 'UIKItSettings not available' });
      }
      CometChat.logout()
        .then((message: object) => {
          ChatSdkEventInitializer.detachListeners();
          CometChatUIKitLoginListener.removeLoggedInUser();
          CometChatUIKit._loggedInUser.next(null);
          return resolve({ message: (message as { message?: string })?.message || 'Logout successful' });
        })
        .catch((error: CometChat.CometChatException) => reject(error));
    });
  }
  logout(): Promise<LogoutResult> { return CometChatUIKit.logout(); }

  static checkAuthSettings(): boolean {
    return CometChatUIKit.uiKitSettings != null && CometChatUIKit.uiKitSettings!.appId != null;
  }

  // ── User Management ───────────────────────────────────────────────────────

  static createUser(user: CometChat.User): Promise<CometChat.User> {
    if (!CometChatUIKit.checkAuthSettings()) return Promise.reject('uiKitSettings not available');
    return createUser(user, CometChatUIKit.uiKitSettings!.authKey!);
  }
  createUser(user: CometChat.User): Promise<CometChat.User> { return CometChatUIKit.createUser(user); }

  static updateUser(user: CometChat.User): Promise<CometChat.User> {
    if (!CometChatUIKit.checkAuthSettings()) return Promise.reject('uiKitSettings not available');
    return updateUser(user, CometChatUIKit.uiKitSettings!.authKey!);
  }
  updateUser(user: CometChat.User): Promise<CometChat.User> { return CometChatUIKit.updateUser(user); }

  // ── Message Sending ───────────────────────────────────────────────────────

  static sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
    return sendTextMessage(message);
  }
  sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> { return CometChatUIKit.sendTextMessage(message); }

  static sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> {
    return sendMediaMessage(message);
  }
  sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> { return CometChatUIKit.sendMediaMessage(message); }

  static sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
    return sendCustomMessage(message);
  }
  sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> { return CometChatUIKit.sendCustomMessage(message); }
}
