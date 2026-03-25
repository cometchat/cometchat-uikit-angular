/**
 * CometChatTemplatesService
 *
 * A centralized service for SDK-wide template customization. Register templates once
 * at the SDK level and have them available across all CometChat list components.
 *
 * ### Template Priority
 *
 * `Component @Input > Component-specific service templates > Shared service templates > Default`
 *
 * ### Shared Templates
 *
 * Use `setSharedTemplates()` to set loading/empty/error templates that apply to ALL list
 * components at once. Component-specific templates (e.g. `setUserTemplates()`) override shared.
 *
 * ### Component-Specific Templates
 *
 * Each list component has its own typed template section:
 * - `setConversationTemplates()` — CometChatConversations
 * - `setUserTemplates()` — CometChatUsers
 * - `setGroupTemplates()` — CometChatGroups
 * - `setGroupMemberTemplates()` — CometChatGroupMembers
 * - `setCallLogTemplates()` — CometChatCallLogs
 * - `setMessageListTemplates()` — CometChatMessageList
 *
 * ### Multiple Instances (Scoping)
 *
 * This service is `providedIn: 'root'` (singleton by default). If you need different
 * templates for different instances, create a wrapper component with its own provider:
 *
 * ```typescript
 * @Component({
 *   selector: 'app-secondary-list',
 *   providers: [CometChatTemplatesService],
 *   template: `<cometchat-users ...></cometchat-users>`
 * })
 * export class SecondaryListComponent {
 *   private templates = inject(CometChatTemplatesService);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Set a branded loading spinner for ALL lists
 * templatesService.setSharedTemplates({ loadingView: mySpinner });
 *
 * // Override just the users list empty state
 * templatesService.setUserTemplates({ emptyView: myUsersEmpty });
 *
 * // Set conversation-specific templates
 * templatesService.setConversationTemplates({
 *   conversationItem: myItemTemplate,
 *   subtitleView: mySubtitle
 * });
 * ```
 */
import { Injectable, TemplateRef, signal } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

// ============================================
// Shared Templates (cross-cutting, all lists)
// ============================================

/**
 * Templates that apply to ALL list components as a fallback.
 * Component-specific templates take priority over shared templates.
 */
export interface SharedListTemplates {
  /** Custom loading state template for all lists */
  loadingView?: TemplateRef<void>;
  /** Custom empty state template for all lists */
  emptyView?: TemplateRef<void>;
  /** Custom error state template for all lists */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

// ============================================
// Component-Specific Template Interfaces
// ============================================

/**
 * Templates for CometChatConversations.
 * Includes item-level slots (leading, title, subtitle, trailing) plus state slots.
 */
export interface ConversationTemplates {
  /** Custom template for the entire conversation item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar, status indicator) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section (timestamp, badge) */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatUsers.
 */
export interface UserTemplates {
  /** Custom template for the entire user item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatGroups.
 */
export interface GroupTemplates {
  /** Custom template for the entire group item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatGroupMembers.
 */
export interface GroupMemberTemplates {
  /** Custom template for the entire member item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section (avatar) */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatCallLogs.
 */
export interface CallLogTemplates {
  /** Custom template for the entire call log item */
  itemView?: TemplateRef<any>;
  /** Custom template for the leading section */
  leadingView?: TemplateRef<any>;
  /** Custom template for the title section */
  titleView?: TemplateRef<any>;
  /** Custom template for the subtitle section */
  subtitleView?: TemplateRef<any>;
  /** Custom template for the trailing section */
  trailingView?: TemplateRef<any>;
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
}

/**
 * Templates for CometChatMessageList.
 * Message list has header/footer instead of leading/title/subtitle/trailing.
 */
export interface MessageListTemplates {
  /** Custom template for the loading state */
  loadingView?: TemplateRef<void>;
  /** Custom template for the empty state */
  emptyView?: TemplateRef<void>;
  /** Custom template for the error state */
  errorView?: TemplateRef<{ $implicit: Error }>;
  /** Custom template for the header section */
  headerView?: TemplateRef<any>;
  /** Custom template for the footer section */
  footerView?: TemplateRef<any>;
}

/**
 * Legacy generic interface kept for backward compatibility.
 * Prefer the typed interfaces above for new code.
 */
export interface ListTemplates<T> {
  itemTemplate?: TemplateRef<{ $implicit: T; index: number }>;
  loadingTemplate?: TemplateRef<void>;
  emptyTemplate?: TemplateRef<void>;
  errorTemplate?: TemplateRef<{ $implicit: Error }>;
  headerTemplate?: TemplateRef<void>;
  footerTemplate?: TemplateRef<void>;
}


@Injectable({ providedIn: 'root' })
export class CometChatTemplatesService {
  // ============================================
  // Shared Templates (apply to ALL lists as fallback)
  // ============================================
  private sharedTemplatesSignal = signal<SharedListTemplates>({});
  private sharedTemplatesSubject = new BehaviorSubject<SharedListTemplates>({});
  readonly sharedTemplates = this.sharedTemplatesSignal.asReadonly();
  readonly sharedTemplates$: Observable<SharedListTemplates> =
    this.sharedTemplatesSubject.asObservable();

  // ============================================
  // Conversation Templates
  // ============================================
  private conversationTemplatesSignal = signal<ConversationTemplates>({});
  private conversationTemplatesSubject = new BehaviorSubject<ConversationTemplates>({});
  readonly conversationTemplates = this.conversationTemplatesSignal.asReadonly();
  readonly conversationTemplates$: Observable<ConversationTemplates> =
    this.conversationTemplatesSubject.asObservable();

  // ============================================
  // User Templates
  // ============================================
  private userTemplatesSignal = signal<UserTemplates>({});
  private userTemplatesSubject = new BehaviorSubject<UserTemplates>({});
  readonly userTemplates = this.userTemplatesSignal.asReadonly();
  readonly userTemplates$: Observable<UserTemplates> =
    this.userTemplatesSubject.asObservable();

  // ============================================
  // Group Templates
  // ============================================
  private groupTemplatesSignal = signal<GroupTemplates>({});
  private groupTemplatesSubject = new BehaviorSubject<GroupTemplates>({});
  readonly groupTemplates = this.groupTemplatesSignal.asReadonly();
  readonly groupTemplates$: Observable<GroupTemplates> =
    this.groupTemplatesSubject.asObservable();

  // ============================================
  // Group Member Templates
  // ============================================
  private groupMemberTemplatesSignal = signal<GroupMemberTemplates>({});
  private groupMemberTemplatesSubject = new BehaviorSubject<GroupMemberTemplates>({});
  readonly groupMemberTemplates = this.groupMemberTemplatesSignal.asReadonly();
  readonly groupMemberTemplates$: Observable<GroupMemberTemplates> =
    this.groupMemberTemplatesSubject.asObservable();

  // ============================================
  // Call Log Templates
  // ============================================
  private callLogTemplatesSignal = signal<CallLogTemplates>({});
  private callLogTemplatesSubject = new BehaviorSubject<CallLogTemplates>({});
  readonly callLogTemplates = this.callLogTemplatesSignal.asReadonly();
  readonly callLogTemplates$: Observable<CallLogTemplates> =
    this.callLogTemplatesSubject.asObservable();

  // ============================================
  // Message List Templates
  // ============================================
  private messageListTemplatesSignal = signal<MessageListTemplates>({});
  private messageListTemplatesSubject = new BehaviorSubject<MessageListTemplates>({});
  readonly messageListTemplates = this.messageListTemplatesSignal.asReadonly();
  readonly messageListTemplates$: Observable<MessageListTemplates> =
    this.messageListTemplatesSubject.asObservable();

  // ============================================
  // Legacy Generic List Templates (backward compat)
  // ============================================
  private listTemplatesSignal = signal<ListTemplates<unknown>>({});
  private listTemplatesSubject = new BehaviorSubject<ListTemplates<unknown>>({});
  readonly listTemplates = this.listTemplatesSignal.asReadonly();
  readonly listTemplates$: Observable<ListTemplates<unknown>> =
    this.listTemplatesSubject.asObservable();

  // ============================================
  // Shared Template Methods
  // ============================================

  /**
   * Sets templates that apply to ALL list components as a fallback.
   * Component-specific templates take priority over shared templates.
   *
   * @example
   * ```typescript
   * // Branded loading spinner for every list
   * templatesService.setSharedTemplates({
   *   loadingView: myBrandedSpinner,
   *   errorView: myBrandedError
   * });
   * ```
   */
  setSharedTemplates(templates: Partial<SharedListTemplates>): void {
    const current = this.sharedTemplatesSignal();
    const updated = { ...current, ...templates };
    this.sharedTemplatesSignal.set(updated);
    this.sharedTemplatesSubject.next(updated);
  }

  /** Gets the current shared templates synchronously. */
  getSharedTemplates(): SharedListTemplates {
    return this.sharedTemplatesSignal();
  }

  /** Clears all shared templates, resetting to defaults. */
  clearSharedTemplates(): void {
    this.sharedTemplatesSignal.set({});
    this.sharedTemplatesSubject.next({});
  }

  // ============================================
  // Conversation Template Methods
  // ============================================

  /** Sets the custom template for the entire conversation item. */
  setConversationItemTemplate(template: TemplateRef<any>): void {
    this.updateConversationTemplates({ itemView: template });
  }

  /** Sets the custom template for the leading section (avatar, status indicator). */
  setConversationLeadingTemplate(template: TemplateRef<any>): void {
    this.updateConversationTemplates({ leadingView: template });
  }

  /** Sets the custom template for the title section. */
  setConversationTitleTemplate(template: TemplateRef<any>): void {
    this.updateConversationTemplates({ titleView: template });
  }

  /** Sets the custom template for the subtitle section. */
  setConversationSubtitleTemplate(template: TemplateRef<any>): void {
    this.updateConversationTemplates({ subtitleView: template });
  }

  /** Sets the custom template for the trailing section (timestamp, badge). */
  setConversationTrailingTemplate(template: TemplateRef<any>): void {
    this.updateConversationTemplates({ trailingView: template });
  }

  /** Sets the custom template for the conversation loading state. */
  setConversationLoadingTemplate(template: TemplateRef<void>): void {
    this.updateConversationTemplates({ loadingView: template });
  }

  /** Sets the custom template for the conversation empty state. */
  setConversationEmptyTemplate(template: TemplateRef<void>): void {
    this.updateConversationTemplates({ emptyView: template });
  }

  /** Sets the custom template for the conversation error state. */
  setConversationErrorTemplate(template: TemplateRef<{ $implicit: Error }>): void {
    this.updateConversationTemplates({ errorView: template });
  }

  /** Sets multiple conversation templates at once. */
  setConversationTemplates(templates: Partial<ConversationTemplates>): void {
    this.updateConversationTemplates(templates);
  }

  /** Gets the current conversation templates synchronously. */
  getConversationTemplates(): ConversationTemplates {
    return this.conversationTemplatesSignal();
  }

  /** Clears all conversation templates, resetting to defaults. */
  clearConversationTemplates(): void {
    this.conversationTemplatesSignal.set({});
    this.conversationTemplatesSubject.next({});
  }

  // ============================================
  // User Template Methods
  // ============================================

  /** Sets multiple user templates at once. */
  setUserTemplates(templates: Partial<UserTemplates>): void {
    const current = this.userTemplatesSignal();
    const updated = { ...current, ...templates };
    this.userTemplatesSignal.set(updated);
    this.userTemplatesSubject.next(updated);
  }

  /** Gets the current user templates synchronously. */
  getUserTemplates(): UserTemplates {
    return this.userTemplatesSignal();
  }

  /** Clears all user templates, resetting to defaults. */
  clearUserTemplates(): void {
    this.userTemplatesSignal.set({});
    this.userTemplatesSubject.next({});
  }

  // ============================================
  // Group Template Methods
  // ============================================

  /** Sets multiple group templates at once. */
  setGroupTemplates(templates: Partial<GroupTemplates>): void {
    const current = this.groupTemplatesSignal();
    const updated = { ...current, ...templates };
    this.groupTemplatesSignal.set(updated);
    this.groupTemplatesSubject.next(updated);
  }

  /** Gets the current group templates synchronously. */
  getGroupTemplates(): GroupTemplates {
    return this.groupTemplatesSignal();
  }

  /** Clears all group templates, resetting to defaults. */
  clearGroupTemplates(): void {
    this.groupTemplatesSignal.set({});
    this.groupTemplatesSubject.next({});
  }

  // ============================================
  // Group Member Template Methods
  // ============================================

  /** Sets multiple group member templates at once. */
  setGroupMemberTemplates(templates: Partial<GroupMemberTemplates>): void {
    const current = this.groupMemberTemplatesSignal();
    const updated = { ...current, ...templates };
    this.groupMemberTemplatesSignal.set(updated);
    this.groupMemberTemplatesSubject.next(updated);
  }

  /** Gets the current group member templates synchronously. */
  getGroupMemberTemplates(): GroupMemberTemplates {
    return this.groupMemberTemplatesSignal();
  }

  /** Clears all group member templates, resetting to defaults. */
  clearGroupMemberTemplates(): void {
    this.groupMemberTemplatesSignal.set({});
    this.groupMemberTemplatesSubject.next({});
  }

  // ============================================
  // Call Log Template Methods
  // ============================================

  /** Sets multiple call log templates at once. */
  setCallLogTemplates(templates: Partial<CallLogTemplates>): void {
    const current = this.callLogTemplatesSignal();
    const updated = { ...current, ...templates };
    this.callLogTemplatesSignal.set(updated);
    this.callLogTemplatesSubject.next(updated);
  }

  /** Gets the current call log templates synchronously. */
  getCallLogTemplates(): CallLogTemplates {
    return this.callLogTemplatesSignal();
  }

  /** Clears all call log templates, resetting to defaults. */
  clearCallLogTemplates(): void {
    this.callLogTemplatesSignal.set({});
    this.callLogTemplatesSubject.next({});
  }

  // ============================================
  // Message List Template Methods
  // ============================================

  /** Sets multiple message list templates at once. */
  setMessageListTemplates(templates: Partial<MessageListTemplates>): void {
    const current = this.messageListTemplatesSignal();
    const updated = { ...current, ...templates };
    this.messageListTemplatesSignal.set(updated);
    this.messageListTemplatesSubject.next(updated);
  }

  /** Gets the current message list templates synchronously. */
  getMessageListTemplates(): MessageListTemplates {
    return this.messageListTemplatesSignal();
  }

  /** Clears all message list templates, resetting to defaults. */
  clearMessageListTemplates(): void {
    this.messageListTemplatesSignal.set({});
    this.messageListTemplatesSubject.next({});
  }

  // ============================================
  // Legacy Generic List Template Methods
  // ============================================

  /** @deprecated Use typed methods (setUserTemplates, setGroupTemplates, etc.) instead. */
  getListTemplates(): ListTemplates<unknown> {
    return this.listTemplatesSignal();
  }

  /** @deprecated Use typed methods instead. */
  setListTemplates<T>(templates: Partial<ListTemplates<T>>): void {
    const current = this.listTemplatesSignal();
    const updated = { ...current, ...templates } as ListTemplates<unknown>;
    this.listTemplatesSignal.set(updated);
    this.listTemplatesSubject.next(updated);
  }

  /** @deprecated Use typed clear methods instead. */
  clearListTemplates(): void {
    this.listTemplatesSignal.set({});
    this.listTemplatesSubject.next({});
  }

  // ============================================
  // Bulk Operations
  // ============================================

  /**
   * Clears ALL templates (shared + all component-specific), resetting everything to defaults.
   */
  clearAllTemplates(): void {
    this.clearSharedTemplates();
    this.clearConversationTemplates();
    this.clearUserTemplates();
    this.clearGroupTemplates();
    this.clearGroupMemberTemplates();
    this.clearCallLogTemplates();
    this.clearMessageListTemplates();
    this.clearListTemplates();
  }

  // ============================================
  // Resolved Template Helpers
  // ============================================

  /**
   * Resolves a template for a specific slot using the priority chain:
   * Component-specific > Shared > undefined (component uses its default).
   *
   * Used internally by components in their effectiveXxxView getters.
   *
   * @param componentTemplates - The component-specific templates object
   * @param slot - The template slot name (e.g. 'loadingView', 'emptyView', 'errorView')
   * @returns The resolved TemplateRef or undefined
   */
  resolveTemplate<T extends Record<string, any>>(
    componentTemplates: T,
    slot: keyof T & keyof SharedListTemplates
  ): TemplateRef<any> | undefined {
    return componentTemplates[slot] || this.sharedTemplatesSignal()[slot];
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  private updateConversationTemplates(updates: Partial<ConversationTemplates>): void {
    const current = this.conversationTemplatesSignal();
    const updated = { ...current, ...updates };
    this.conversationTemplatesSignal.set(updated);
    this.conversationTemplatesSubject.next(updated);
  }
}
