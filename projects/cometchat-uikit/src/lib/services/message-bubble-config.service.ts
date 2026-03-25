import { Injectable, TemplateRef, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Type representing the different parts of a message bubble that can be customized.
 *
 * Each part corresponds to a specific section of the message bubble UI:
 * - `bubbleView`: The entire bubble wrapper view
 * - `contentView`: The main message content area
 * - `bottomView`: Area below the content (e.g., reactions)
 * - `footerView`: Footer area of the bubble
 * - `leadingView`: Leading area (e.g., avatar for incoming messages)
 * - `headerView`: Header area (e.g., sender name)
 * - `statusInfoView`: Status information area (e.g., timestamp, receipts)
 * - `replyView`: Reply preview area for quoted messages
 * - `threadView`: Thread indicator area for messages with replies
 */
export type BubblePart =
  | 'bubbleView'
  | 'contentView'
  | 'bottomView'
  | 'footerView'
  | 'leadingView'
  | 'headerView'
  | 'statusInfoView'
  | 'replyView'
  | 'threadView';

/**
 * Type for message type key combining type and category.
 *
 * Format: "{type}_{category}" e.g., "text_message", "image_message"
 *
 * Standard message type keys:
 * - `text_message`: Text messages
 * - `image_message`: Image messages
 * - `video_message`: Video messages
 * - `audio_message`: Audio messages
 * - `file_message`: File messages
 * - `delete_action`: Deleted messages
 * - `groupMember_action`: Group member action messages
 * - `audio_call`: Audio call messages
 * - `video_call`: Video call messages
 * - `extension_poll_custom`: Poll messages
 * - `extension_sticker_custom`: Sticker messages
 * - `extension_document_custom`: Document messages
 * - `extension_whiteboard_custom`: Whiteboard messages
 * - `meeting_custom`: Meeting messages
 */
export type MessageTypeKey = string;

/**
 * Map of bubble parts to their view templates.
 *
 * Each property corresponds to a customizable section of the message bubble.
 * Set a property to a TemplateRef to customize that section, or null to clear it.
 *
 * @example
 * ```typescript
 * const partMap: BubblePartMap = {
 *   contentView: myCustomContentTemplate,
 *   footerView: myCustomFooterTemplate,
 * };
 * ```
 */
export interface BubblePartMap {
  /** Custom template for the entire bubble wrapper */
  bubbleView?: TemplateRef<any> | null;
  /** Custom template for the main content area */
  contentView?: TemplateRef<any> | null;
  /** Custom template for the bottom area (e.g., reactions) */
  bottomView?: TemplateRef<any> | null;
  /** Custom template for the footer area */
  footerView?: TemplateRef<any> | null;
  /** Custom template for the leading area (e.g., avatar) */
  leadingView?: TemplateRef<any> | null;
  /** Custom template for the header area (e.g., sender name) */
  headerView?: TemplateRef<any> | null;
  /** Custom template for status info (e.g., timestamp, receipts) */
  statusInfoView?: TemplateRef<any> | null;
  /** Custom template for reply preview */
  replyView?: TemplateRef<any> | null;
  /** Custom template for thread indicator */
  threadView?: TemplateRef<any> | null;
}

/**
 * MessageBubbleConfigService
 *
 * Centralized service for configuring message bubble views globally or per message type.
 *
 * ## Overview
 *
 * This service provides a single source of truth for message bubble view configurations
 * in the CometChat Angular UIKit. It allows developers to customize how different parts
 * of message bubbles are rendered, either globally (for all message types) or for specific
 * message types.
 *
 * ## Architecture
 *
 * The service maintains two configuration maps:
 * - **typeViewMap**: Stores type-specific view configurations (e.g., custom content view for text messages)
 * - **globalViewMap**: Stores global view configurations that apply to all message types
 *
 * ### Priority Logic
 *
 * When retrieving a view for a specific message type and bubble part:
 * 1. First, check if a type-specific view is configured
 * 2. If not found, fall back to the global view
 * 3. If neither is configured, return null (use default rendering)
 *
 * ## Usage Patterns
 *
 * ### Pattern 1: Set type-specific view
 *
 * ```typescript
 * // Customize content view for text messages only
 * this.bubbleConfigService.setBubbleView('text_message', {
 *   contentView: this.customTextContentTemplate
 * });
 * ```
 *
 * ### Pattern 2: Set global view
 *
 * ```typescript
 * // Customize footer view for all message types
 * this.bubbleConfigService.setGlobalView('footerView', this.customFooterTemplate);
 * ```
 *
 * ### Pattern 3: Batch configuration
 *
 * ```typescript
 * // Configure multiple message types at once
 * this.bubbleConfigService.setMessageTemplates({
 *   'text_message': { contentView: this.textContentTemplate },
 *   'image_message': { contentView: this.imageContentTemplate },
 * });
 * ```
 *
 * ### Pattern 4: Get configured view
 *
 * ```typescript
 * // Get the configured view (type-specific or global fallback)
 * const contentView = this.bubbleConfigService.getView('text_message', 'contentView');
 * ```
 *
 * ## Multiple Instances (Scoping)
 *
 * This service is `providedIn: 'root'` (singleton by default). All message lists share
 * the same configuration. If you need different bubble customizations for different
 * message lists (e.g., main chat vs. thread panel), create a wrapper component that
 * provides its own instance:
 *
 * ```typescript
 * @Component({
 *   selector: 'app-thread-panel',
 *   providers: [MessageBubbleConfigService], // Scoped instance
 *   template: `<cometchat-message-list ...></cometchat-message-list>`
 * })
 * export class ThreadPanelComponent {
 *   private bubbleConfig = inject(MessageBubbleConfigService); // Local instance
 * }
 * ```
 *
 * @Injectable providedIn: 'root'

 */
@Injectable({
  providedIn: 'root',
})
export class MessageBubbleConfigService {
  // ==================== Private State ====================

  /**
   * Map storing type-specific view configurations.
   *
   * Key: MessageTypeKey (e.g., "text_message", "image_message")
   * Value: BubblePartMap containing templates for each bubble part
   *
   * @private
   * @internal
   */
  private typeViewMap = new Map<MessageTypeKey, BubblePartMap>();

  /**
   * Object storing global view configurations that apply to all message types.
   *
   * These views are used as fallbacks when no type-specific view is configured.
   *
   * @private
   * @internal
   */
  private globalViewMap: BubblePartMap = {};

  /**
   * Reactive signal that increments whenever any configuration changes.
   * Components can read this signal to trigger re-renders when the service is updated.
   *
   * @public
  
   */
  readonly configVersion = signal(0);

  /**
   * Observable that emits whenever any configuration changes.
   * OnPush components should subscribe and call markForCheck() on emission.
   *
   * @public
  
   */
  readonly configChanged$ = new Subject<void>();

  constructor() {
    // Service is ready to use immediately
    // No initialization required
  }

  // ==================== Public Methods ====================

  /**
   * Sets a bubble view for a specific message type.
   *
   * This method allows you to customize how specific parts of the message bubble
   * are rendered for a particular message type. Type-specific views take priority
   * over global views when retrieving configurations.
   *
   * @param messageType - The message type key (e.g., "text_message", "image_message")
   * @param partMap - Map of bubble parts to their view templates
   *
   * @example
   * ```typescript
   * // Customize content view for text messages
   * this.bubbleConfigService.setBubbleView('text_message', {
   *   contentView: this.customTextContentTemplate,
   *   footerView: this.customFooterTemplate,
   * });
   *
   * // Customize multiple parts for image messages
   * this.bubbleConfigService.setBubbleView('image_message', {
   *   contentView: this.imageContentTemplate,
   *   headerView: this.imageHeaderTemplate,
   * });
   * ```
   *
   * @see {@link getView} for retrieving configured views
   * @see {@link BubblePartMap} for available bubble parts
   *
  
   */
  setBubbleView(messageType: MessageTypeKey, partMap: BubblePartMap): void {
    // Get existing configuration for this message type, or create empty object
    const existingConfig = this.typeViewMap.get(messageType) || {};

    // Merge the new part map with existing configuration
    // This allows incremental updates without losing previously set views
    const mergedConfig: BubblePartMap = {
      ...existingConfig,
      ...partMap,
    };

    // Store the merged configuration
    this.typeViewMap.set(messageType, mergedConfig);
    this.configVersion.update(v => v + 1);
    this.configChanged$.next();
  }

  /**
   * Sets a global view that applies to all message types.
   *
   * Global views serve as fallbacks when no type-specific view is configured
   * for a particular message type and bubble part. This is useful for applying
   * consistent customizations across all message types.
   *
   * @param part - The bubble part to set (e.g., "footerView", "statusInfoView")
   * @param view - The template to use, or null to clear the global view for this part
   *
   * @example
   * ```typescript
   * // Set a global footer view for all message types
   * this.bubbleConfigService.setGlobalView('footerView', this.customFooterTemplate);
   *
   * // Set a global status info view
   * this.bubbleConfigService.setGlobalView('statusInfoView', this.customStatusTemplate);
   *
   * // Clear a global view
   * this.bubbleConfigService.setGlobalView('footerView', null);
   * ```
   *
   * @see {@link setGlobalViews} for setting multiple global views at once
   * @see {@link setBubbleView} for setting type-specific views
   * @see {@link getView} for retrieving configured views
   *
  
   */
  setGlobalView(part: BubblePart, view: TemplateRef<any> | null): void {
    this.globalViewMap[part] = view;
    this.configVersion.update(v => v + 1);
    this.configChanged$.next();
  }

  /**
   * Sets multiple global views at once.
   *
   * This method allows batch configuration of global views, which is more
   * convenient when setting up multiple customizations at once. The provided
   * part map is merged with existing global views, allowing incremental updates.
   *
   * @param partMap - Map of bubble parts to their view templates
   *
   * @example
   * ```typescript
   * // Set multiple global views at once
   * this.bubbleConfigService.setGlobalViews({
   *   footerView: this.customFooterTemplate,
   *   statusInfoView: this.customStatusTemplate,
   *   leadingView: this.customAvatarTemplate,
   * });
   *
   * // Clear multiple global views
   * this.bubbleConfigService.setGlobalViews({
   *   footerView: null,
   *   statusInfoView: null,
   * });
   * ```
   *
   * @see {@link setGlobalView} for setting a single global view
   * @see {@link setBubbleView} for setting type-specific views
   * @see {@link getView} for retrieving configured views
   *
  
   */
  setGlobalViews(partMap: BubblePartMap): void {
    // Merge the provided part map with existing global views
    // This allows incremental updates without losing previously set views
    this.globalViewMap = {
      ...this.globalViewMap,
      ...partMap,
    };
    this.configVersion.update(v => v + 1);
    this.configChanged$.next();
  }

  /**
   * Gets the configured view for a specific message type and bubble part.
   *
   * This method implements the priority logic for view resolution:
   * 1. First, check if a type-specific view is configured for the given message type and part
   * 2. If not found, fall back to the global view for that part
   * 3. If neither is configured, return null (component should use default rendering)
   *
   * @param messageType - The message type key (e.g., "text_message", "image_message")
   * @param part - The bubble part to retrieve (e.g., "contentView", "footerView")
   * @returns The configured TemplateRef for the specified part, or null if not configured
   *
   * @example
   * ```typescript
   * // Get content view for text messages
   * const contentView = this.bubbleConfigService.getView('text_message', 'contentView');
   *
   * // Use in component template
   * if (contentView) {
   *   // Use custom template
   * } else {
   *   // Use default rendering
   * }
   * ```
   *
   * @see {@link setBubbleView} for setting type-specific views
   * @see {@link setGlobalView} for setting global views
   *
  
   */
  getView(messageType: MessageTypeKey, part: BubblePart): TemplateRef<any> | null {
    // Step 1: Check for type-specific view
    const typeConfig = this.typeViewMap.get(messageType);
    if (typeConfig && typeConfig[part] !== undefined) {
      // Return the type-specific view (could be a TemplateRef or null if explicitly cleared)
      return typeConfig[part] ?? null;
    }

    // Step 2: Fall back to global view
    if (this.globalViewMap[part] !== undefined) {
      return this.globalViewMap[part] ?? null;
    }

    // Step 3: No configuration found, return null
    return null;
  }

  /**
   * Sets multiple message templates at once.
   *
   * This method allows batch configuration of multiple message types in a single call,
   * which is more efficient and convenient when setting up customizations for multiple
   * message types at once. Each template in the record is merged with any existing
   * configuration for that message type.
   *
   * @param templates - Record of message type keys to their part maps
   *
   * @example
   * ```typescript
   * // Configure multiple message types at once
   * this.bubbleConfigService.setMessageTemplates({
   *   'text_message': {
   *     contentView: this.textContentTemplate,
   *     footerView: this.textFooterTemplate,
   *   },
   *   'image_message': {
   *     contentView: this.imageContentTemplate,
   *     headerView: this.imageHeaderTemplate,
   *   },
   *   'video_message': {
   *     contentView: this.videoContentTemplate,
   *   },
   * });
   * ```
   *
   * @see {@link setBubbleView} for setting a single message type configuration
   * @see {@link clearAll} for clearing all configurations
   *
  
   */
  setMessageTemplates(templates: Record<MessageTypeKey, BubblePartMap>): void {
    if (!templates) return;
    // Iterate over each message type in the provided templates
    for (const messageType of Object.keys(templates)) {
      const partMap = templates[messageType];
      // Use setBubbleView to ensure consistent merging behavior
      this.setBubbleView(messageType, partMap);
    }
  }

  /**
   * Clears all configurations (both type-specific and global views).
   *
   * This method resets the service to its initial state, removing all configured
   * views. After calling this method, `getView()` will return null for all
   * message types and bubble parts until new configurations are set.
   *
   * This is useful when:
   * - Resetting the UI to default rendering
   * - Switching between different configuration presets
   * - Cleaning up before applying a completely new configuration
   *
   * @example
   * ```typescript
   * // Clear all configurations
   * this.bubbleConfigService.clearAll();
   *
   * // After clearing, getView returns null
   * const view = this.bubbleConfigService.getView('text_message', 'contentView');
   * console.log(view); // null
   * ```
   *
   * @see {@link clearType} for clearing a specific message type
   * @see {@link clearGlobalViews} for clearing only global views
   *
  
   */
  clearAll(): void {
    // Clear all type-specific configurations
    this.typeViewMap.clear();

    // Reset global views to empty object
    this.globalViewMap = {};
    this.configVersion.update(v => v + 1);
    this.configChanged$.next();
  }

  /**
   * Clears configuration for a specific message type.
   *
   * This method removes all view configurations for the specified message type,
   * while leaving configurations for other message types and global views intact.
   * After calling this method, `getView()` for the cleared message type will
   * fall back to global views (if configured) or return null.
   *
   * @param messageType - The message type key to clear (e.g., "text_message")
   *
   * @example
   * ```typescript
   * // Clear only text message configuration
   * this.bubbleConfigService.clearType('text_message');
   *
   * // Text messages now use global views or defaults
   * const textView = this.bubbleConfigService.getView('text_message', 'contentView');
   * // Returns global view if set, otherwise null
   *
   * // Other message types are unaffected
   * const imageView = this.bubbleConfigService.getView('image_message', 'contentView');
   * // Returns previously configured view
   * ```
   *
   * @see {@link clearAll} for clearing all configurations
   * @see {@link clearGlobalViews} for clearing only global views
   *
  
   */
  clearType(messageType: MessageTypeKey): void {
    // Remove the configuration for the specified message type
    this.typeViewMap.delete(messageType);
    this.configVersion.update(v => v + 1);
    this.configChanged$.next();
  }

  /**
   * Clears all global views.
   *
   * This method removes all global view configurations while leaving type-specific
   * configurations intact. After calling this method, message types without
   * type-specific configurations will use default rendering.
   *
   * This is useful when:
   * - Removing global customizations while keeping type-specific ones
   * - Resetting to type-specific-only configuration
   *
   * @example
   * ```typescript
   * // Clear all global views
   * this.bubbleConfigService.clearGlobalViews();
   *
   * // Type-specific views are still available
   * const textView = this.bubbleConfigService.getView('text_message', 'contentView');
   * // Returns type-specific view if configured
   *
   * // Global fallback is now null
   * const audioView = this.bubbleConfigService.getView('audio_message', 'footerView');
   * // Returns null if no type-specific view was set
   * ```
   *
   * @see {@link clearAll} for clearing all configurations
   * @see {@link clearType} for clearing a specific message type
   *
  
   */
  clearGlobalViews(): void {
    // Reset global views to empty object
    this.globalViewMap = {};
    this.configVersion.update(v => v + 1);
    this.configChanged$.next();
  }
}
