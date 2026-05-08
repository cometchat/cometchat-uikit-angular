/**
 * Mock Service Providers for Testing
 *
 * Pre-configured provider arrays for use in TestBed.configureTestingModule().
 * Provides mocks for localization, chat state, and conversations services.
 *
 * @module testing/mock-providers-services
 * _Requirements: 15.5_
 */

import { Pipe, PipeTransform, Provider, signal } from '@angular/core';
import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { Observable, of } from 'rxjs';

import { TranslatePipe } from '../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../resources/CometChatLocalize/cometchat-localize';
import { ChatStateService } from '../services/chat-state.service';
import { ConversationsService } from '../services/conversations.service';
import {
  createMockUser,
  createMockGroup,
  createMockConversation,
} from './mock-sdk';

// ─── Mock TranslatePipe ───

/**
 * Mock TranslatePipe that returns the key as-is (or with params appended).
 */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class MockTranslatePipe implements PipeTransform {
  transform(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    if (params) {
      const paramStr = Object.entries(params)
        .map(([k, v]) => `${k}=${v}`)
        .join(',');
      return `${key}[${paramStr}]`;
    }
    return key;
  }
}

// ─── Mock ChatStateService ───

/**
 * Creates a mock ChatStateService with controllable signals and observables.
 */
export function createMockChatStateService(): MockChatStateServiceType {
  const activeUserSignal = signal<CometChat.User | null>(null);
  const activeGroupSignal = signal<CometChat.Group | null>(null);
  const activeConversationSignal = signal<CometChat.Conversation | null>(null);

  return {
    activeUser: activeUserSignal.asReadonly(),
    activeGroup: activeGroupSignal.asReadonly(),
    activeConversation: activeConversationSignal.asReadonly(),

    activeUser$: of(null) as Observable<CometChat.User | null>,
    activeGroup$: of(null) as Observable<CometChat.Group | null>,
    activeConversation$: of(null) as Observable<CometChat.Conversation | null>,

    setActiveUser: vi.fn((user: CometChat.User | null) => {
      activeUserSignal.set(user);
      activeGroupSignal.set(null);
    }),
    setActiveGroup: vi.fn((group: CometChat.Group | null) => {
      activeGroupSignal.set(group);
      activeUserSignal.set(null);
    }),
    setActiveConversation: vi.fn((conversation: CometChat.Conversation | null) => {
      activeConversationSignal.set(conversation);
    }),

    getActiveUser: vi.fn(() => activeUserSignal()),
    getActiveGroup: vi.fn(() => activeGroupSignal()),
    getActiveConversation: vi.fn(() => activeConversationSignal()),
    getActiveChatEntity: vi.fn(() => activeUserSignal() ?? activeGroupSignal() ?? null),

    clearActiveChat: vi.fn(() => {
      activeUserSignal.set(null);
      activeGroupSignal.set(null);
      activeConversationSignal.set(null);
    }),
  };
}

/** Type for the mock ChatStateService */
export interface MockChatStateServiceType {
  activeUser: ReturnType<typeof signal<CometChat.User | null>>['asReadonly'] extends () => infer R
    ? R
    : never;
  activeGroup: ReturnType<typeof signal<CometChat.Group | null>>['asReadonly'] extends () => infer R
    ? R
    : never;
  activeConversation: ReturnType<
    typeof signal<CometChat.Conversation | null>
  >['asReadonly'] extends () => infer R
    ? R
    : never;
  activeUser$: Observable<CometChat.User | null>;
  activeGroup$: Observable<CometChat.Group | null>;
  activeConversation$: Observable<CometChat.Conversation | null>;
  setActiveUser: ReturnType<typeof vi.fn>;
  setActiveGroup: ReturnType<typeof vi.fn>;
  setActiveConversation: ReturnType<typeof vi.fn>;
  getActiveUser: ReturnType<typeof vi.fn>;
  getActiveGroup: ReturnType<typeof vi.fn>;
  getActiveConversation: ReturnType<typeof vi.fn>;
  getActiveChatEntity: ReturnType<typeof vi.fn>;
  clearActiveChat: ReturnType<typeof vi.fn>;
}

// ─── Mock ConversationsService ───

/**
 * Creates a minimal mock ConversationsService.
 */
export function createMockConversationsService(): Record<string, any> {
  return {
    setActiveConversation: vi.fn(),
    getConversations: vi.fn(() => []),
    fetchConversations: vi.fn(() => Promise.resolve()),
    fetchNextConversations: vi.fn(() => Promise.resolve(false)),
    deleteConversation: vi.fn(() => Promise.resolve()),
    searchConversations: vi.fn(),
    updateConversationList: vi.fn(),
    removeConversation: vi.fn(),
    findConversation: vi.fn(() => null),
    replaceConversation: vi.fn(() => false),
    moveConversationToTop: vi.fn(() => false),
    insertConversationAt: vi.fn(),
    getConversationIndex: vi.fn(() => -1),
    updateConversationUnreadCount: vi.fn(),
    updateConversationReadStatus: vi.fn(),
    cleanup: vi.fn(),
    removeListeners: vi.fn(),
    clearError: vi.fn(),
    setConversationsRequestBuilder: vi.fn(),
  };
}

// ─── Provider Arrays ───

/**
 * Mock providers for localization (TranslatePipe + CometChatLocalize).
 */
export const MOCK_LOCALIZE_PROVIDERS: Provider[] = [
  { provide: TranslatePipe, useClass: MockTranslatePipe },
];

/**
 * Mock providers for ChatStateService and its ConversationsService dependency.
 */
export const MOCK_CHAT_STATE_PROVIDERS: Provider[] = [
  { provide: ConversationsService, useFactory: createMockConversationsService },
  { provide: ChatStateService, useFactory: createMockChatStateService },
];

/**
 * Sets up CometChatLocalize.getLocalizedString to return the key as-is.
 */
export function mockCometChatLocalize() {
  return vi.spyOn(CometChatLocalize, 'getLocalizedString').mockImplementation((key: string) => key);
}
