import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLocalize } from './resources/CometChatLocalize/cometchat-localize';
import { UIKitSettings } from './UIKitSettings';
import { CometChatSoundManager } from './resources/CometChatSoundManager/CometChatSoundManager';
import { CometChatUIKitLoginListener } from './CometChatUIKitLoginListener';
import { CometChatUIKitUtility } from './CometChatUIKitUtility';
import { ChatSdkEventInitializer } from './utils/ChatSdkEventInitializer';
import { CometChatMessageEvents } from './events/CometChatMessageEvents';
import { MessageStatus } from './Enums/Enums';
import { InitResult, LogoutResult } from './modals/CometChatUIKitInterfaces';
import { CometChatLogger, LogLevel } from './utils/CometChatLogger';
import { CometChatUIKitCalls } from './CometChatCalls';

/**
 * Interface for CometChat UIKit window object.
 * @interface
 */
interface CometChatUiKit {
  name: string;
  version: string;
}

declare global {
  interface Window {
    CometChatUiKit: CometChatUiKit;
  }
}

/**
 * `CometChatUIKit` is a service that provides a dual-API architecture for Angular applications.
 *
 * This service enables developers to initialize and interact with the CometChat SDK both:
 * - Before Angular bootstraps (via static methods in `main.ts`)
 * - Within Angular components (via dependency injection)
 *
 * The dual-API pattern addresses the limitation that Angular's dependency injection is not
 * available at the application entry point, while still providing an idiomatic Angular
 * experience for all subsequent operations.
 *
 * **Singleton Pattern:** This service is provided in root and maintains static state,
 * ensuring that all injected instances share the same underlying state. Multiple
 * component injections will receive the same singleton instance.
 *
 * **Key Features:**
 * - SDK initialization and configuration
 * - User authentication (login/logout)
 * - User management (create/update)
 * - Message sending (text, media, custom)
 * - Reactive state management for logged-in user via RxJS BehaviorSubject
 * - Access to utility services (SoundManager, Localize, DataSource)
 *
 * @example
 * // Static usage in main.ts (before Angular bootstraps)
 * CometChatUIKit.init(uiKitSettings).then(() => {
 *   CometChatUIKit.login('user-uid').then(() => {
 *     bootstrapApplication(AppComponent);
 *   });
 * });
 *
 * @example
 * // Injectable usage in components
 * @Component({...})
 * export class ChatComponent {
 *   constructor(private uiKit: CometChatUIKit) {
 *     const user = this.uiKit.getLoggedInUser();
 *     this.uiKit.loggedInUser$.subscribe(user => console.log(user));
 *   }
 * }
 *
 * @class
 * @injectable providedIn: 'root'
 * @see {@link UIKitSettings} for configuration options
 * @see {@link CometChatSoundManager} for sound management
 * @see {@link CometChatLocalize} for localization
 */
@Injectable({
  providedIn: 'root',
})
export class CometChatUIKit {
  /**
   * The UI Kit settings containing configuration for the CometChat SDK.
   * Stores appId, authKey, region, and other initialization parameters.
   * @private
   * @static
   * @type {UIKitSettings | null}
   */
  private static _uiKitSettings: UIKitSettings | null = null;

  /**
   * BehaviorSubject that holds the currently logged-in user.
   *
   * NOTE: This is an acknowledged exception to the signal-first pattern.
   * Angular's signal() requires an injection context and cannot be used
   * in static class fields. BehaviorSubject provides equivalent semantics
   * (current value + change notification) and is acceptable here.
   *
   * All injectable services MUST use signal() instead. See ChatStateService
   * or ConversationsService for the standard pattern.
   */
  private static _loggedInUser: BehaviorSubject<CometChat.User | null> =
    new BehaviorSubject<CometChat.User | null>(null);

  /**
   * Settings related to conversation updates from the CometChat SDK.
   * @private
   * @static
   * @type {CometChat.ConversationUpdateSettings}
   */
  private static _conversationUpdateSettings: CometChat.ConversationUpdateSettings;

  /**
   * The current theme mode of the UIKit.
   * @private
   * @static
   * @type {'light' | 'dark'}
   * @default 'light'
   */
  private static _themeMode: 'light' | 'dark' = 'light';

  /**
   * The sound manager for handling sound-related functionalities in the UI Kit.
   * Provides access to play notification sounds, incoming call sounds, etc.
   * @static
   * @type {typeof CometChatSoundManager}
   */
  static SoundManager: typeof CometChatSoundManager = CometChatSoundManager;

  /**
   * The localizer for internationalization.
   * Provides access to localization methods for translating UI strings.
   * @static
   * @type {typeof CometChatLocalize}
   */
  static Localize: typeof CometChatLocalize = CometChatLocalize;

  /**
   * Getter for UI Kit settings (for backward compatibility).
   * @static
   * @returns {UIKitSettings | null} The current UI Kit settings or null if not initialized.
   */
  static get uiKitSettings(): UIKitSettings | null {
    return CometChatUIKit._uiKitSettings;
  }

  /**
   * Setter for UI Kit settings (for backward compatibility).
   * @static
   * @param {UIKitSettings | null} value - The UI Kit settings to set.
   */
  static set uiKitSettings(value: UIKitSettings | null) {
    CometChatUIKit._uiKitSettings = value;
  }

  /**
   * Getter for conversation update settings (for backward compatibility).
   * @static
   * @returns {CometChat.ConversationUpdateSettings} The conversation update settings.
   */
  static get conversationUpdateSettings(): CometChat.ConversationUpdateSettings {
    return CometChatUIKit._conversationUpdateSettings;
  }

  /**
   * Setter for conversation update settings (for backward compatibility).
   * @static
   * @param {CometChat.ConversationUpdateSettings} value - The conversation update settings to set.
   */
  static set conversationUpdateSettings(value: CometChat.ConversationUpdateSettings) {
    CometChatUIKit._conversationUpdateSettings = value;
  }

  /**
   * Getter for theme mode (for backward compatibility).
   * @static
   * @returns {'light' | 'dark'} The current theme mode.
   */
  static get themeMode(): 'light' | 'dark' {
    return CometChatUIKit._themeMode;
  }

  /**
   * Setter for theme mode (for backward compatibility).
   * @static
   * @param {'light' | 'dark'} value - The theme mode to set.
   */
  static set themeMode(value: 'light' | 'dark') {
    CometChatUIKit._themeMode = value;
  }

  /**
   * Observable that emits the currently logged-in user.
   * Emits the current user immediately to new subscribers and subsequent changes.
   * Emits null when no user is logged in or after logout.
   * @static
   * @returns {Observable<CometChat.User | null>} Observable of the logged-in user.
   * @example
   * CometChatUIKit.loggedInUser$.subscribe(user => {
   *   if (user) {
   *     console.log('User logged in:', user.getName());
   *   } else {
   *     console.log('No user logged in');
   *   }
   * });
   */
  static get loggedInUser$(): Observable<CometChat.User | null> {
    return CometChatUIKit._loggedInUser.asObservable();
  }

  /**
   * Gets the currently logged-in user synchronously.
   * Returns the current value stored in the BehaviorSubject.
   * @static
   * @returns {CometChat.User | null} The logged-in user or null if not logged in.
   * @example
   * const user = CometChatUIKit.getLoggedInUser();
   * if (user) {
   *   console.log('Current user:', user.getName());
   * }
   */
  static getLoggedInUser(): CometChat.User | null {
    return CometChatUIKit._loggedInUser.getValue();
  }

  // ==================== Instance Methods (Delegate to Static) ====================

  /**
   * Instance method that delegates to the static loggedInUser$ observable.
   * Use this when accessing the service via dependency injection.
   *
   * This getter provides the same observable as the static `CometChatUIKit.loggedInUser$`,
   * allowing components to subscribe to user state changes through the injected service.
   *
   * @returns {Observable<CometChat.User | null>} Observable of the logged-in user.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {
   *     this.uiKit.loggedInUser$.subscribe(user => {
   *       console.log('User state changed:', user);
   *     });
   *   }
   * }
   */
  get loggedInUser$(): Observable<CometChat.User | null> {
    return CometChatUIKit.loggedInUser$;
  }

  /**
   * Instance method that delegates to the static getLoggedInUser method.
   * Use this when accessing the service via dependency injection.
   *
   * This method provides synchronous access to the currently logged-in user,
   * returning the same value as `CometChatUIKit.getLoggedInUser()`.
   *
   * @returns {CometChat.User | null} The logged-in user or null if not logged in.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {
   *     const user = this.uiKit.getLoggedInUser();
   *     if (user) {
   *       console.log('Current user:', user.getName());
   *     }
   *   }
   * }
   */
  getLoggedInUser(): CometChat.User | null {
    return CometChatUIKit.getLoggedInUser();
  }

  /**
   * Initializes the CometChat UI Kit with the provided settings.
   * This method should be called before any other CometChat operations.
   * Can be called from main.ts before Angular bootstraps.
   *
   * @static
   * @param {UIKitSettings | null} uiKitSettings - The settings for initializing the UI Kit.
   * @returns {Promise<InitResult> | undefined} A promise that resolves with an InitResult containing the logged-in user (or null) if initialization is successful, otherwise `undefined`.
   * @example
   * // In main.ts
   * const settings = new UIKitSettingsBuilder()
   *   .setAppId('APP_ID')
   *   .setRegion('REGION')
   *   .setAuthKey('AUTH_KEY')
   *   .build();
   *
   * CometChatUIKit.init(settings).then(result => {
   *   if (result.user) {
   *     console.log('User already logged in:', result.user);
   *   }
   *   bootstrapApplication(AppComponent);
   * });
   */
  static init(uiKitSettings: UIKitSettings | null): Promise<InitResult> | undefined {
    CometChatUIKit._uiKitSettings = uiKitSettings;
    if (!CometChatUIKit.checkAuthSettings()) return undefined;
    const appSettingsBuilder = new CometChat.AppSettingsBuilder();
    if (uiKitSettings!.getRoles()) {
      appSettingsBuilder.subscribePresenceForRoles(uiKitSettings!.getRoles()!);
    } else if (uiKitSettings!.getSubscriptionType() === 'ALL_USERS') {
      appSettingsBuilder.subscribePresenceForAllUsers();
    } else if (uiKitSettings!.getSubscriptionType() === 'FRIENDS') {
      appSettingsBuilder.subscribePresenceForFriends();
    }
    appSettingsBuilder.autoEstablishSocketConnection(
      uiKitSettings!.isAutoEstablishSocketConnection()
    );
    appSettingsBuilder.setRegion(uiKitSettings!.getRegion());
    if (uiKitSettings!.getAdminHost()) {
      appSettingsBuilder.overrideAdminHost(uiKitSettings!.getAdminHost()!);
    }
    if (uiKitSettings!.getClientHost()) {
      appSettingsBuilder.overrideClientHost(uiKitSettings!.getClientHost()!);
    }
    appSettingsBuilder.setStorageMode(uiKitSettings!.getStorageMode() as any);

    const appSettings = appSettingsBuilder.build();
    if (CometChat.setSource) {
      CometChat.setSource('uikit-v5', 'web', 'angular');
    }
    CometChatLocalize.setCurrentLanguage(CometChatLocalize.getBrowserLanguage());
    return new Promise((resolve, reject) => {
      window.CometChatUiKit = {
        name: '@cometchat/chat-uikit-angular',
        version: '5.0.0-beta.1',
      };
      CometChat.init(uiKitSettings?.appId, appSettings)
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

  /**
   * Instance method that delegates to the static init method.
   * Use this when accessing the service via dependency injection.
   *
   * Note: Typically, initialization is done statically in `main.ts` before Angular
   * bootstraps. This instance method is provided for consistency with the dual-API pattern.
   *
   * @param {UIKitSettings | null} uiKitSettings - The settings for initializing the UI Kit.
   * @returns {Promise<InitResult> | undefined} A promise that resolves with an InitResult containing the logged-in user if initialization is successful.
   * @example
   * @Component({...})
   * export class AppComponent {
   *   constructor(private uiKit: CometChatUIKit) {
   *     // Note: Usually init() is called in main.ts, not in components
   *     this.uiKit.init(settings).then(result => console.log(result.user));
   *   }
   * }
   */
  init(uiKitSettings: UIKitSettings | null): Promise<InitResult> | undefined {
    return CometChatUIKit.init(uiKitSettings);
  }

  /**
   * Checks if the CometChat SDK is initialized.
   * @static
   * @returns {boolean} `true` if the SDK is initialized, `false` otherwise.
   * @example
   * if (CometChatUIKit.isInitialized()) {
   *   // SDK is ready, proceed with operations
   * }
   */
  static isInitialized(): boolean {
    try {
      return CometChat.isInitialized();
    } catch (error) {
      CometChatLogger.error('CometChatUIKit', 'isInitialized check failed:', error);
      return false;
    }
  }

  /**
   * Sets the log level for the CometChat UIKit logger.
   * Controls the verbosity of internal logging output.
   *
   * @static
   * @param {LogLevel} level - The desired log level.
   * @example
   * // Only show errors (default)
   * CometChatUIKit.setLogLevel(LogLevel.error);
   *
   * // Show all logs for debugging
   * CometChatUIKit.setLogLevel(LogLevel.debug);
   *
   * // Suppress all logging
   * CometChatUIKit.setLogLevel(LogLevel.none);
   */
  static setLogLevel(level: LogLevel): void {
    CometChatLogger.setLogLevel(level);
  }

  /**
   * Instance method that delegates to the static setLogLevel method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {LogLevel} level - The desired log level.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {
   *     this.uiKit.setLogLevel(LogLevel.debug);
   *   }
   * }
   */
  setLogLevel(level: LogLevel): void {
    CometChatUIKit.setLogLevel(level);
  }

  /**
   * Instance method that delegates to the static isInitialized method.
   * Use this when accessing the service via dependency injection.
   *
   * @returns {boolean} `true` if the SDK is initialized, `false` otherwise.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {
   *     if (this.uiKit.isInitialized()) {
   *       // SDK is ready
   *     }
   *   }
   * }
   */
  isInitialized(): boolean {
    return CometChatUIKit.isInitialized();
  }

  /**
   * Promise that resolves when the Calls SDK has been initialized.
   * Components can await this before using CometChatUIKitCalls methods.
   * @static
   */
  static callingReady: Promise<void> = Promise.resolve();

  /**
   * Returns whether calling features are enabled in the UIKit settings.
   * Components should check this before rendering call-related UI.
   * @static
   * @returns {boolean} `true` if calling was enabled via `UIKitSettingsBuilder.setCallingEnabled(true)`.
   */
  static isCallingEnabled(): boolean {
    return CometChatUIKit._uiKitSettings?.isCallingEnabled() ?? false;
  }

  /**
   * Instance method that delegates to the static isCallingEnabled method.
   * Use this when accessing the service via dependency injection.
   *
   * @returns {boolean} `true` if calling was enabled via `UIKitSettingsBuilder.setCallingEnabled(true)`.
   */
  isCallingEnabled(): boolean {
    return CometChatUIKit.isCallingEnabled();
  }

  /**
   * Performs post-login initialization tasks.
   * Fetches conversation update settings, attaches SDK event listeners,
   * and initializes the Calls SDK only when calling is enabled.
   * @private
   * @static
   */
  private static initiateAfterLogin(): void {
    if (CometChatUIKit._uiKitSettings != null) {
      CometChat.getConversationUpdateSettings().then(
        (res: CometChat.ConversationUpdateSettings) => {
          CometChatUIKit._conversationUpdateSettings = res;
        }
      );
      ChatSdkEventInitializer.attachListeners();
      CometChatUIKitLoginListener.attachListener();
      if (CometChatUIKit.isCallingEnabled()) {
        CometChatUIKit.callingReady = CometChatUIKit.initCalling();
      }
    }
  }

  /**
   * Internal method to initialize the Calls SDK.
   * Called by `initiateAfterLogin` when `callingEnabled` is `true`.
   * @private
   * @static
   */
  private static async initCalling(): Promise<void> {
    try {
      const callsSDK = CometChatUIKitCalls;
      if (callsSDK) {
        const callAppSetting = CometChatUIKit._uiKitSettings?.getCallAppSettings()
          ?? new CometChatUIKitCalls.CallAppSettingsBuilder()
            .setAppId(CometChatUIKit._uiKitSettings?.appId!)
            .setRegion(CometChatUIKit._uiKitSettings?.region!)
            .build();
        return CometChatUIKitCalls.init(callAppSetting).then(
          () => {
            // Calls SDK initialized successfully
          },
          (error: CometChat.CometChatException) => {
            CometChatLogger.error('CometChatUIKit', 'CometChatUIKitCalls initialization failed:', error);
          }
        );
      }
    } catch (e) {
      CometChatLogger.error('CometChatUIKit', 'initCalling error:', e);
    }
  }

  /**
   * Logs in a user with the specified UID.
   * Uses the authKey from UIKitSettings for authentication.
   * If a user is already logged in, returns the existing user without re-authenticating.
   *
   * @static
   * @param {string} uid - The UID of the user to log in.
   * @returns {Promise<CometChat.User>} A promise that resolves with the logged-in user.
   * @throws {string} Rejects with "uiKitSettings not available" if settings are not configured.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on login failure.
   * @example
   * CometChatUIKit.login('user-123').then(user => {
   *   console.log('Logged in as:', user.getName());
   * }).catch(error => {
   *   console.error('Login failed:', error);
   * });
   */
  static login(uid: string): Promise<CometChat.User> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChatUIKit.getLoggedinUser()?.then(user => {
        if (user) {
          CometChatUIKitLoginListener.setLoggedInUser(user);
          CometChatUIKit._loggedInUser.next(user);
          this.initiateAfterLogin();
          return resolve(user);
        } else {
          CometChat.login(uid, CometChatUIKit._uiKitSettings!.authKey!)
            .then((user: CometChat.User) => {
              CometChatUIKitLoginListener.setLoggedInUser(user);
              CometChatUIKit._loggedInUser.next(user);
              CometChatUIKitLoginListener.setLoggedInUser(user);
              this.initiateAfterLogin();
              return resolve(user);
            })
            .catch((error: CometChat.CometChatException) => {
              return reject(error);
            });
        }
      });
    });
  }

  /**
   * Instance method that delegates to the static login method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {string} uid - The UID of the user to log in.
   * @returns {Promise<CometChat.User>} A promise that resolves with the logged-in user.
   * @example
   * @Component({...})
   * export class LoginComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async login(uid: string) {
   *     const user = await this.uiKit.login(uid);
   *     console.log('Logged in:', user.getName());
   *   }
   * }
   */
  login(uid: string): Promise<CometChat.User> {
    return CometChatUIKit.login(uid);
  }

  /**
   * Logs in a user with the specified authentication token.
   * Use this method when implementing custom authentication flows.
   *
   * @static
   * @param {string} authToken - The authentication token for the user.
   * @returns {Promise<CometChat.User>} A promise that resolves with the logged-in user.
   * @throws {string} Rejects with "uiKitSettings not available" if settings are not configured.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on login failure.
   * @example
   * CometChatUIKit.loginWithAuthToken('auth-token-from-server').then(user => {
   *   console.log('Logged in as:', user.getName());
   * });
   */
  static loginWithAuthToken(authToken: string): Promise<CometChat.User> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChat.login(authToken)
        .then((user: CometChat.User) => {
          CometChatUIKitLoginListener.setLoggedInUser(user);
          CometChatUIKit._loggedInUser.next(user);
          this.initiateAfterLogin();
          return resolve(user);
        })
        .catch((error: CometChat.CometChatException) => {
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static loginWithAuthToken method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {string} authToken - The authentication token for the user.
   * @returns {Promise<CometChat.User>} A promise that resolves with the logged-in user.
   * @example
   * @Component({...})
   * export class LoginComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async loginWithToken(token: string) {
   *     const user = await this.uiKit.loginWithAuthToken(token);
   *     console.log('Logged in:', user.getName());
   *   }
   * }
   */
  loginWithAuthToken(authToken: string): Promise<CometChat.User> {
    return CometChatUIKit.loginWithAuthToken(authToken);
  }

  /**
   * Retrieves the currently logged-in user from the CometChat SDK asynchronously.
   * This is an async method that queries the SDK directly.
   *
   * **Note:** For synchronous access to the cached user, use `getLoggedInUser()` instead.
   * This method (`getLoggedinUser`) queries the SDK and updates the internal cache.
   *
   * @static
   * @returns {Promise<CometChat.User | null>} A promise that resolves with the logged-in user or `null` if no user is logged in.
   * @throws {string} Rejects with "uiKitSettings not available" if settings are not configured.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on failure.
   * @example
   * // Async SDK query
   * CometChatUIKit.getLoggedinUser().then(user => {
   *   if (user) {
   *     console.log('User from SDK:', user.getName());
   *   }
   * });
   *
   * // vs. Synchronous cached access
   * const cachedUser = CometChatUIKit.getLoggedInUser();
   *
   * @see {@link getLoggedInUser} for synchronous cached access
   */
  static getLoggedinUser(): Promise<CometChat.User | null> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');

      CometChat.getLoggedinUser()
        .then((user: CometChat.User | null) => {
          if (user) {
            CometChatUIKitLoginListener.setLoggedInUser(user);
            CometChatUIKit._loggedInUser.next(user);
          }
          return resolve(user);
        })
        .catch((error: CometChat.CometChatException) => {
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static getLoggedinUser method.
   * Use this when accessing the service via dependency injection.
   *
   * **Note:** This is the async version that queries the SDK. For synchronous
   * access to the cached user, use `getLoggedInUser()` instead.
   *
   * @returns {Promise<CometChat.User | null>} A promise that resolves with the logged-in user.
   * @see {@link getLoggedInUser} for synchronous cached access
   */
  getLoggedinUser(): Promise<CometChat.User | null> {
    return CometChatUIKit.getLoggedinUser();
  }

  /**
   * Creates a new user in CometChat with the specified details.
   *
   * This method requires valid UIKitSettings with an authKey to be configured
   * before calling. Use this to programmatically create user accounts.
   *
   * @static
   * @param {CometChat.User} user - The user object containing details for the new user.
   *                                Must include at minimum a UID.
   * @returns {Promise<CometChat.User>} A promise that resolves with the created user object.
   * @throws {string} Rejects with "uiKitSettings not available" if settings are not configured.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on creation failure.
   * @example
   * const user = new CometChat.User('user-123');
   * user.setName('John Doe');
   *
   * CometChatUIKit.createUser(user).then(createdUser => {
   *   console.log('User created:', createdUser.getName());
   * }).catch(error => {
   *   console.error('User creation failed:', error);
   * });
   *
   * @see {@link UIKitSettings} for configuration requirements
   * @see {@link updateUser} for updating existing users
   *
   * _Requirements: 6.1, 6.3, 6.4_
   */
  static createUser(user: CometChat.User): Promise<CometChat.User> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChat.createUser(user, CometChatUIKit.uiKitSettings!.authKey!)
        .then((user: CometChat.User) => {
          return resolve(user);
        })
        .catch((error: CometChat.CometChatException) => {
          return reject(error);
        });
    });
  }

  /**
   * Updates an existing user's details in CometChat.
   *
   * This method requires valid UIKitSettings with an authKey to be configured
   * before calling. Use this to programmatically update user account information.
   *
   * @static
   * @param {CometChat.User} user - The user object containing updated details.
   *                                Must include the UID of the user to update.
   * @returns {Promise<CometChat.User>} A promise that resolves with the updated user object.
   * @throws {string} Rejects with "uiKitSettings not available" if settings are not configured.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on update failure.
   * @example
   * const user = new CometChat.User('user-123');
   * user.setName('Jane Doe');
   * user.setAvatar('https://example.com/avatar.png');
   *
   * CometChatUIKit.updateUser(user).then(updatedUser => {
   *   console.log('User updated:', updatedUser.getName());
   * }).catch(error => {
   *   console.error('User update failed:', error);
   * });
   *
   * @see {@link UIKitSettings} for configuration requirements
   * @see {@link createUser} for creating new users
   *
   * _Requirements: 6.2, 6.3, 6.4_
   */
  static updateUser(user: CometChat.User): Promise<CometChat.User> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) return reject('uiKitSettings not available');
      CometChat.updateUser(user, CometChatUIKit.uiKitSettings!.authKey!)
        .then((user: CometChat.User) => {
          return resolve(user);
        })
        .catch((error: CometChat.CometChatException) => {
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static createUser method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {CometChat.User} user - The user object containing details for the new user.
   * @returns {Promise<CometChat.User>} A promise that resolves with the created user object.
   * @example
   * @Component({...})
   * export class UserManagementComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async createNewUser(uid: string, name: string) {
   *     const user = new CometChat.User(uid);
   *     user.setName(name);
   *     const created = await this.uiKit.createUser(user);
   *     console.log('Created:', created.getName());
   *   }
   * }
   */
  createUser(user: CometChat.User): Promise<CometChat.User> {
    return CometChatUIKit.createUser(user);
  }

  /**
   * Instance method that delegates to the static updateUser method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {CometChat.User} user - The user object containing updated details.
   * @returns {Promise<CometChat.User>} A promise that resolves with the updated user object.
   * @example
   * @Component({...})
   * export class UserManagementComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async updateUserName(uid: string, newName: string) {
   *     const user = new CometChat.User(uid);
   *     user.setName(newName);
   *     const updated = await this.uiKit.updateUser(user);
   *     console.log('Updated:', updated.getName());
   *   }
   * }
   */
  updateUser(user: CometChat.User): Promise<CometChat.User> {
    return CometChatUIKit.updateUser(user);
  }

  /**
   * Logs out the current user.
   * Clears the stored logged-in user and emits null through the observable.
   *
   * @static
   * @returns {Promise<LogoutResult>} A promise that resolves with a LogoutResult containing a success message upon successful logout.
   * @throws {{ code: string, message: string }} Rejects with error object if UIKitSettings is not available.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on logout failure.
   * @example
   * CometChatUIKit.logout().then(result => {
   *   console.log('Logged out successfully:', result.message);
   * }).catch(error => {
   *   console.error('Logout failed:', error);
   * });
   */
  static logout(): Promise<LogoutResult> {
    return new Promise((resolve, reject) => {
      if (!CometChatUIKit.checkAuthSettings()) {
        const error = {
          code: 'ERROR_UIKIT_NOT_INITIALISED',
          message: 'UIKItSettings not available',
        };
        return reject(error);
      }
      CometChat.logout()
        .then((message: object) => {
          ChatSdkEventInitializer.detachListeners();
          CometChatUIKitLoginListener.removeLoggedInUser();
          CometChatUIKit._loggedInUser.next(null);
          return resolve({ message: (message as { message?: string })?.message || 'Logout successful' });
        })
        .catch((error: CometChat.CometChatException) => {
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static logout method.
   * Use this when accessing the service via dependency injection.
   *
   * @returns {Promise<LogoutResult>} A promise that resolves with a LogoutResult containing a success message upon successful logout.
   * @example
   * @Component({...})
   * export class HeaderComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async logout() {
   *     const result = await this.uiKit.logout();
   *     console.log('User logged out:', result.message);
   *   }
   * }
   */
  logout(): Promise<LogoutResult> {
    return CometChatUIKit.logout();
  }

  /**
   * Validates that the UI Kit settings are properly configured before performing operations.
   * This method acts as a guard for operations that require valid settings (login, logout,
   * createUser, updateUser, etc.).
   *
   * @static
   * @returns {boolean} `true` if UI Kit settings are available and contain a valid appId,
   *                    `false` if settings are null or appId is missing.
   * @example
   * if (!CometChatUIKit.checkAuthSettings()) {
   *   console.error('UIKit settings not configured');
   *   return;
   * }
   * // Proceed with operation
   */
  static checkAuthSettings(): boolean {
    if (CometChatUIKit.uiKitSettings == null) {
      return false;
    }

    if (CometChatUIKit.uiKitSettings!.appId == null) {
      return false;
    }

    return true;
  }

  /**
   * Sends a text message and emits message events for progress tracking.
   *
   * This method sets the `sentAt` timestamp and generates a `muid` (message unique ID)
   * if not already provided. It emits events through `CometChatMessageEvents` to track
   * the message sending progress:
   * - `inprogress` event before sending
   * - `success` event on successful send
   * - `error` event on failure (with error metadata attached to the message)
   *
   * @static
   * @param {CometChat.TextMessage} message - The text message to be sent.
   * @returns {Promise<CometChat.BaseMessage>} A promise that resolves with the sent message on success.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on send failure.
   * @example
   * const textMessage = new CometChat.TextMessage(
   *   'receiver-uid',
   *   'Hello, World!',
   *   CometChat.RECEIVER_TYPE.USER
   * );
   *
   * CometChatUIKit.sendTextMessage(textMessage).then(sentMessage => {
   *   console.log('Message sent:', sentMessage);
   * }).catch(error => {
   *   console.error('Send failed:', error);
   * });
   *
   * @see {@link CometChatMessageEvents} for subscribing to message events
   *
   * _Requirements: 7.1, 7.4, 7.5, 7.6_
   */
  static sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
    return new Promise((resolve, reject) => {
      message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
      if (!message?.getMuid()) {
        message.setMuid(CometChatUIKitUtility.ID());
      }
      CometChatMessageEvents.ccMessageSent.next({
        message: message,
        status: MessageStatus.inprogress,
      });

      CometChat.sendMessage(message)
        .then((message: CometChat.BaseMessage) => {
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.success,
          });
          return resolve(message);
        })
        .catch((error: CometChat.CometChatException) => {
          message.setMetadata({ error });
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.error,
          });
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static sendTextMessage method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {CometChat.TextMessage} message - The text message to be sent.
   * @returns {Promise<CometChat.BaseMessage>} A promise that resolves with the sent message.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async sendMessage(receiverId: string, text: string) {
   *     const message = new CometChat.TextMessage(
   *       receiverId, text, CometChat.RECEIVER_TYPE.USER
   *     );
   *     const sent = await this.uiKit.sendTextMessage(message);
   *     console.log('Sent:', sent);
   *   }
   * }
   */
  sendTextMessage(message: CometChat.TextMessage): Promise<CometChat.BaseMessage> {
    return CometChatUIKit.sendTextMessage(message);
  }

  /**
   * Sends a media message (image, video, audio, file) and emits message events for progress tracking.
   *
   * This method sets the `sentAt` timestamp and generates a `muid` (message unique ID)
   * if not already provided. It emits events through `CometChatMessageEvents` to track
   * the message sending progress:
   * - `inprogress` event before sending
   * - `success` event on successful send
   * - `error` event on failure (with error metadata attached to the message)
   *
   * @static
   * @param {CometChat.MediaMessage} message - The media message to be sent.
   * @returns {Promise<CometChat.BaseMessage>} A promise that resolves with the sent message on success.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on send failure.
   * @example
   * const mediaMessage = new CometChat.MediaMessage(
   *   'receiver-uid',
   *   file,
   *   CometChat.MESSAGE_TYPE.IMAGE,
   *   CometChat.RECEIVER_TYPE.USER
   * );
   *
   * CometChatUIKit.sendMediaMessage(mediaMessage).then(sentMessage => {
   *   console.log('Media sent:', sentMessage);
   * }).catch(error => {
   *   console.error('Send failed:', error);
   * });
   *
   * @see {@link CometChatMessageEvents} for subscribing to message events
   *
   * _Requirements: 7.2, 7.4, 7.5, 7.6_
   */
  static sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> {
    message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
    if (!message?.getMuid()) {
      message.setMuid(CometChatUIKitUtility.ID());
    }
    return new Promise((resolve, reject) => {
      CometChatMessageEvents.ccMessageSent.next({
        message: message,
        status: MessageStatus.inprogress,
      });

      CometChat.sendMediaMessage(message)
        .then((message: CometChat.BaseMessage) => {
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.success,
          });
          return resolve(message);
        })
        .catch((error: CometChat.CometChatException) => {
          message.setMetadata({ error });
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.error,
          });
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static sendMediaMessage method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {CometChat.MediaMessage} message - The media message to be sent.
   * @returns {Promise<CometChat.BaseMessage>} A promise that resolves with the sent message.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async sendImage(receiverId: string, file: File) {
   *     const message = new CometChat.MediaMessage(
   *       receiverId, file, CometChat.MESSAGE_TYPE.IMAGE, CometChat.RECEIVER_TYPE.USER
   *     );
   *     const sent = await this.uiKit.sendMediaMessage(message);
   *     console.log('Sent:', sent);
   *   }
   * }
   */
  sendMediaMessage(message: CometChat.MediaMessage): Promise<CometChat.BaseMessage> {
    return CometChatUIKit.sendMediaMessage(message);
  }

  /**
   * Sends a custom message with custom data and emits message events for progress tracking.
   *
   * This method sets the `sentAt` timestamp and generates a `muid` (message unique ID)
   * if not already provided. It emits events through `CometChatMessageEvents` to track
   * the message sending progress:
   * - `inprogress` event before sending
   * - `success` event on successful send
   * - `error` event on failure (with error metadata attached to the message)
   *
   * @static
   * @param {CometChat.CustomMessage} message - The custom message to be sent.
   * @returns {Promise<CometChat.BaseMessage>} A promise that resolves with the sent message on success.
   * @throws {CometChat.CometChatException} Rejects with SDK exception on send failure.
   * @example
   * const customMessage = new CometChat.CustomMessage(
   *   'receiver-uid',
   *   CometChat.RECEIVER_TYPE.USER,
   *   'custom-type',
   *   { key: 'value' }
   * );
   *
   * CometChatUIKit.sendCustomMessage(customMessage).then(sentMessage => {
   *   console.log('Custom message sent:', sentMessage);
   * }).catch(error => {
   *   console.error('Send failed:', error);
   * });
   *
   * @see {@link CometChatMessageEvents} for subscribing to message events
   *
   * _Requirements: 7.3, 7.4, 7.5, 7.6_
   */
  static sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
    return new Promise((resolve, reject) => {
      message.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
      if (!message?.getMuid()) {
        message.setMuid(CometChatUIKitUtility.ID());
      }
      CometChatMessageEvents.ccMessageSent.next({
        message: message,
        status: MessageStatus.inprogress,
      });

      CometChat.sendCustomMessage(message)
        .then((message: CometChat.BaseMessage) => {
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.success,
          });
          return resolve(message);
        })
        .catch((error: CometChat.CometChatException) => {
          message.setMetadata({ error });
          CometChatMessageEvents.ccMessageSent.next({
            message: message,
            status: MessageStatus.error,
          });
          return reject(error);
        });
    });
  }

  /**
   * Instance method that delegates to the static sendCustomMessage method.
   * Use this when accessing the service via dependency injection.
   *
   * @param {CometChat.CustomMessage} message - The custom message to be sent.
   * @returns {Promise<CometChat.BaseMessage>} A promise that resolves with the sent message.
   * @example
   * @Component({...})
   * export class ChatComponent {
   *   constructor(private uiKit: CometChatUIKit) {}
   *
   *   async sendCustomData(receiverId: string, data: object) {
   *     const message = new CometChat.CustomMessage(
   *       receiverId, CometChat.RECEIVER_TYPE.USER, 'custom-type', data
   *     );
   *     const sent = await this.uiKit.sendCustomMessage(message);
   *     console.log('Sent:', sent);
   *   }
   * }
   */
  sendCustomMessage(message: CometChat.CustomMessage): Promise<CometChat.BaseMessage> {
    return CometChatUIKit.sendCustomMessage(message);
  }
}
