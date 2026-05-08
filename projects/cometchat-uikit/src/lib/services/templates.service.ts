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
 * @example
 * ```typescript
 * // Set a branded loading spinner for ALL lists
 * templatesService.setSharedTemplates({ loadingView: mySpinner });
 *
 * // Override just the users list empty state
 * templatesService.setUserTemplates({ emptyView: myUsersEmpty });
 * ```
 */
import { Injectable, TemplateRef, DestroyRef, signal, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';

// Re-export all types for backward compatibility
export type {
  SharedListTemplates,
  ConversationTemplates,
  UserTemplates,
  GroupTemplates,
  GroupMemberTemplates,
  CallLogTemplates,
  MessageListTemplates,
  SearchTemplates,
  ListTemplates,
} from './templates.types';

import {
  SharedListTemplates,
  ConversationTemplates,
  UserTemplates,
  GroupTemplates,
  GroupMemberTemplates,
  CallLogTemplates,
  MessageListTemplates,
  SearchTemplates,
  ListTemplates,
} from './templates.types';

@Injectable({ providedIn: 'root' })
export class CometChatTemplatesService {
  private readonly _destroyRef = inject(DestroyRef);

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
  // Search Templates
  // ============================================
  private searchTemplatesSignal = signal<SearchTemplates>({});
  private searchTemplatesSubject = new BehaviorSubject<SearchTemplates>({});
  readonly searchTemplates = this.searchTemplatesSignal.asReadonly();
  readonly searchTemplates$: Observable<SearchTemplates> =
    this.searchTemplatesSubject.asObservable();

  // ============================================
  // Legacy Generic List Templates (backward compat)
  // ============================================
  private listTemplatesSignal = signal<ListTemplates<unknown>>({});
  private listTemplatesSubject = new BehaviorSubject<ListTemplates<unknown>>({});
  readonly listTemplates = this.listTemplatesSignal.asReadonly();
  readonly listTemplates$: Observable<ListTemplates<unknown>> =
    this.listTemplatesSubject.asObservable();

  constructor() {
    this._destroyRef.onDestroy(() => this._completeAllSubjects());
  }

  // ============================================
  // Shared Template Methods
  // ============================================

  /**
   * Sets templates that apply to ALL list components as a fallback.
   * Component-specific templates take priority over shared templates.
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

  setConversationItemTemplate(template: TemplateRef<any>): void { this.updateConversationTemplates({ itemView: template }); }
  setConversationLeadingTemplate(template: TemplateRef<any>): void { this.updateConversationTemplates({ leadingView: template }); }
  setConversationTitleTemplate(template: TemplateRef<any>): void { this.updateConversationTemplates({ titleView: template }); }
  setConversationSubtitleTemplate(template: TemplateRef<any>): void { this.updateConversationTemplates({ subtitleView: template }); }
  setConversationTrailingTemplate(template: TemplateRef<any>): void { this.updateConversationTemplates({ trailingView: template }); }
  setConversationLoadingTemplate(template: TemplateRef<void>): void { this.updateConversationTemplates({ loadingView: template }); }
  setConversationEmptyTemplate(template: TemplateRef<void>): void { this.updateConversationTemplates({ emptyView: template }); }
  setConversationErrorTemplate(template: TemplateRef<{ $implicit: Error }>): void { this.updateConversationTemplates({ errorView: template }); }

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

  setUserTemplates(templates: Partial<UserTemplates>): void {
    const updated = { ...this.userTemplatesSignal(), ...templates };
    this.userTemplatesSignal.set(updated);
    this.userTemplatesSubject.next(updated);
  }
  getUserTemplates(): UserTemplates { return this.userTemplatesSignal(); }
  clearUserTemplates(): void { this.userTemplatesSignal.set({}); this.userTemplatesSubject.next({}); }

  // ============================================
  // Group Template Methods
  // ============================================

  setGroupTemplates(templates: Partial<GroupTemplates>): void {
    const updated = { ...this.groupTemplatesSignal(), ...templates };
    this.groupTemplatesSignal.set(updated);
    this.groupTemplatesSubject.next(updated);
  }
  getGroupTemplates(): GroupTemplates { return this.groupTemplatesSignal(); }
  clearGroupTemplates(): void { this.groupTemplatesSignal.set({}); this.groupTemplatesSubject.next({}); }

  // ============================================
  // Group Member Template Methods
  // ============================================

  setGroupMemberTemplates(templates: Partial<GroupMemberTemplates>): void {
    const updated = { ...this.groupMemberTemplatesSignal(), ...templates };
    this.groupMemberTemplatesSignal.set(updated);
    this.groupMemberTemplatesSubject.next(updated);
  }
  getGroupMemberTemplates(): GroupMemberTemplates { return this.groupMemberTemplatesSignal(); }
  clearGroupMemberTemplates(): void { this.groupMemberTemplatesSignal.set({}); this.groupMemberTemplatesSubject.next({}); }

  // ============================================
  // Call Log Template Methods
  // ============================================

  setCallLogTemplates(templates: Partial<CallLogTemplates>): void {
    const updated = { ...this.callLogTemplatesSignal(), ...templates };
    this.callLogTemplatesSignal.set(updated);
    this.callLogTemplatesSubject.next(updated);
  }
  getCallLogTemplates(): CallLogTemplates { return this.callLogTemplatesSignal(); }
  clearCallLogTemplates(): void { this.callLogTemplatesSignal.set({}); this.callLogTemplatesSubject.next({}); }

  // ============================================
  // Message List Template Methods
  // ============================================

  setMessageListTemplates(templates: Partial<MessageListTemplates>): void {
    const updated = { ...this.messageListTemplatesSignal(), ...templates };
    this.messageListTemplatesSignal.set(updated);
    this.messageListTemplatesSubject.next(updated);
  }
  getMessageListTemplates(): MessageListTemplates { return this.messageListTemplatesSignal(); }
  clearMessageListTemplates(): void { this.messageListTemplatesSignal.set({}); this.messageListTemplatesSubject.next({}); }

  // ============================================
  // Search Template Methods
  // ============================================

  setSearchTemplates(templates: Partial<SearchTemplates>): void {
    const updated = { ...this.searchTemplatesSignal(), ...templates };
    this.searchTemplatesSignal.set(updated);
    this.searchTemplatesSubject.next(updated);
  }
  getSearchTemplates(): SearchTemplates { return this.searchTemplatesSignal(); }
  clearSearchTemplates(): void { this.searchTemplatesSignal.set({}); this.searchTemplatesSubject.next({}); }

  // ============================================
  // Legacy Generic List Template Methods
  // ============================================

  /** @deprecated Use typed methods (setUserTemplates, setGroupTemplates, etc.) instead. */
  getListTemplates(): ListTemplates<unknown> { return this.listTemplatesSignal(); }

  /** @deprecated Use typed methods instead. */
  setListTemplates<T>(templates: Partial<ListTemplates<T>>): void {
    const updated = { ...this.listTemplatesSignal(), ...templates } as ListTemplates<unknown>;
    this.listTemplatesSignal.set(updated);
    this.listTemplatesSubject.next(updated);
  }

  /** @deprecated Use typed clear methods instead. */
  clearListTemplates(): void { this.listTemplatesSignal.set({}); this.listTemplatesSubject.next({}); }

  // ============================================
  // Bulk Operations
  // ============================================

  /** Clears ALL templates (shared + all component-specific), resetting everything to defaults. */
  clearAllTemplates(): void {
    this.clearSharedTemplates();
    this.clearConversationTemplates();
    this.clearUserTemplates();
    this.clearGroupTemplates();
    this.clearGroupMemberTemplates();
    this.clearCallLogTemplates();
    this.clearMessageListTemplates();
    this.clearSearchTemplates();
    this.clearListTemplates();
  }

  // ============================================
  // Resolved Template Helpers
  // ============================================

  /**
   * Resolves a template for a specific slot using the priority chain:
   * Component-specific > Shared > undefined (component uses its default).
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

  private _completeAllSubjects(): void {
    this.sharedTemplatesSubject.complete();
    this.conversationTemplatesSubject.complete();
    this.userTemplatesSubject.complete();
    this.groupTemplatesSubject.complete();
    this.groupMemberTemplatesSubject.complete();
    this.callLogTemplatesSubject.complete();
    this.messageListTemplatesSubject.complete();
    this.searchTemplatesSubject.complete();
    this.listTemplatesSubject.complete();
  }
}
