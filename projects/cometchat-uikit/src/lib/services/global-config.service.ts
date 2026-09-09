import { InjectionToken } from '@angular/core';
import { CometChatTextFormatter } from '../formatters';

/**
 * Interface defining all global configuration properties.
 * All properties are optional (undefined means no global override).
 *
 * This interface is used with the COMETCHAT_GLOBAL_CONFIG InjectionToken
 * to provide centralized configuration management for UIKit components.
 * Components can read these values and apply them using a priority system
 * where @Input values take precedence over global config values.
 *
 * @example
 * ```typescript
 * // In app.config.ts or app.module.ts
 * import { COMETCHAT_GLOBAL_CONFIG, GlobalConfig } from '@cometchat/chat-uikit-angular';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: COMETCHAT_GLOBAL_CONFIG,
 *       useValue: {
 *         hideReceipts: true,
 *         hideUserStatus: true,
 *         showSearchBar: false,
 *         disableSoundForMessages: true
 *       } as GlobalConfig
 *     }
 *   ]
 * };
 * ```
 */
export interface GlobalConfig {
  /** Hide read receipts across all components */
  hideReceipts?: boolean;
  /** Hide error states across all components */
  hideError?: boolean;
  /** Hide user online/offline status indicators */
  hideUserStatus?: boolean;
  /** Hide group type badges (public/private/password) */
  hideGroupType?: boolean;
  /** Show scrollbar in list components */
  showScrollbar?: boolean;
  /** Show search bar in list components */
  showSearchBar?: boolean;
  /** Disable sound notifications for messages */
  disableSoundForMessages?: boolean;
  /** Text formatters for message rendering */
  textFormatters?: CometChatTextFormatter[];
  /** Disable right-click context menu across components */
  disableDefaultContextMenu?: boolean;
  /** Disable sound for incoming/outgoing calls */
  disableSoundForCalls?: boolean;
  /** Custom sound URL for calls */
  customSoundForCalls?: string;
  /** Custom sound URL for messages */
  customSoundForMessages?: string;
  /** Hide avatar across components */
  hideAvatar?: boolean;
  /**
   * Enable the thread follow/unfollow surfaces — the control in the thread
   * header and the `Follow thread` option in the message action sheet.
   *
   * Defaults to **off**: there is no capability flag on the app settings a
   * client could feature-detect from, so whether the backend has the threads
   * endpoints deployed is something only the integrator knows. When off,
   * neither surface renders and no thread request is made, whatever the
   * per-component `hideThreadSubscription*` flags say.
   */
  enableThreadSubscription?: boolean;
  /**
   * Force the Pin / Save surfaces on or off, overriding the app-level feature
   * flags the Chat SDK reports.
   *
   * Leave unset in production: the SDK's `isPinMessageEnabled()` /
   * `isSaveMessageEnabled()` read the app's own settings, which is the right
   * source of truth. This exists because those flags are provisioned
   * server-side — so before they are turned on for an app there is no way to
   * develop or demo against the feature at all, and "flag off" is
   * indistinguishable from "not built".
   */
  enablePinMessage?: boolean;
  enableSaveMessage?: boolean;
  /**
   * Custom session settings object for call components (call buttons, call logs, etc.).
   * Pass a plain v5 SessionSettings object — the v4 CallSettingsBuilder is no longer used.
   * @example
   * { sessionType: 'VIDEO', layout: 'TILE', startAudioMuted: false }
   */
  callSettingsBuilder?: Record<string, any>;
}

/**
 * InjectionToken for providing global configuration at application bootstrap.
 *
 * Use this token to declaratively configure CometChat UIKit components
 * in your application's providers array. The configuration is static
 * and set once at application startup.
 *
 * Priority System:
 * 1. @Input value (if explicitly set on component)
 * 2. Global config value (from this token)
 * 3. Component's internal default value
 *
 * @example
 * ```typescript
 * // In app.config.ts (standalone)
 * import { COMETCHAT_GLOBAL_CONFIG } from '@cometchat/chat-uikit-angular';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: COMETCHAT_GLOBAL_CONFIG,
 *       useValue: {
 *         hideReceipts: true,
 *         hideUserStatus: true,
 *         showSearchBar: false,
 *         disableSoundForMessages: true
 *       }
 *     }
 *   ]
 * };
 * ```
 *
 * @example
 * ```typescript
 * // In app.module.ts (NgModule)
 * @NgModule({
 *   providers: [
 *     {
 *       provide: COMETCHAT_GLOBAL_CONFIG,
 *       useValue: {
 *         hideReceipts: true,
 *         showSearchBar: false
 *       }
 *     }
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // Using factory for dynamic configuration
 * {
 *   provide: COMETCHAT_GLOBAL_CONFIG,
 *   useFactory: (envService: EnvironmentService) => ({
 *     hideReceipts: envService.isProduction,
 *     showSearchBar: true
 *   }),
 *   deps: [EnvironmentService]
 * }
 * ```
 */
export const COMETCHAT_GLOBAL_CONFIG = new InjectionToken<Partial<GlobalConfig>>(
  'COMETCHAT_GLOBAL_CONFIG'
);
