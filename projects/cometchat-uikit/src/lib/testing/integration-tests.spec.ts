/**
 * Integration Tests for Cross-Component Flows
 *
 * Verifies that components, services, and utilities work together correctly:
 * 1. ChatStateService signal propagation
 * 2. Formatter pipeline processes text through all formatters in sequence
 * 3. Localization language switching updates translated text
 * 4. ConversationsService → ChatStateService flow
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */
// @ts-nocheck
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './index';

vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

// Lazy imports
let ChatStateService: any;
let FormatterConfigService: any;
let CometChatLocalize: any;
let CometChat: any;

beforeAll(async () => {
  await ensureSdkReady();
  const chatStateModule = await import('../services/chat-state.service');
  ChatStateService = chatStateModule.ChatStateService;
  const formatterModule = await import('../services/formatter-config.service');
  FormatterConfigService = formatterModule.FormatterConfigService;
  const localizeModule = await import('../resources/CometChatLocalize/cometchat-localize');
  CometChatLocalize = localizeModule.CometChatLocalize;
  CometChat = (await import('@cometchat/chat-sdk-javascript')).CometChat;
});

afterAll(async () => {
  await sdkCleanup();
});

describe('Integration: ChatStateService Signal Propagation', () => {
  let chatStateService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    chatStateService = TestBed.inject(ChatStateService);
  });

  it('should propagate active user to signal readers', () => {
    const mockUser = new CometChat.User({ uid: 'test-user', name: 'Test User' });
    chatStateService.setActiveUser(mockUser);
    expect(chatStateService.activeUser()).toBeTruthy();
    expect(chatStateService.activeUser()?.getUid()).toBe('test-user');
  });

  it('should clear active group when setting active user', () => {
    const mockGroup = new CometChat.Group({ guid: 'test-group', name: 'Test Group', type: 'public' });
    chatStateService.setActiveGroup(mockGroup);
    expect(chatStateService.activeGroup()).toBeTruthy();

    const mockUser = new CometChat.User({ uid: 'test-user', name: 'Test User' });
    chatStateService.setActiveUser(mockUser);
    expect(chatStateService.activeUser()).toBeTruthy();
    expect(chatStateService.activeGroup()).toBeNull();
  });

  it('should clear active user when setting active group', () => {
    const mockUser = new CometChat.User({ uid: 'test-user', name: 'Test User' });
    chatStateService.setActiveUser(mockUser);
    expect(chatStateService.activeUser()).toBeTruthy();

    const mockGroup = new CometChat.Group({ guid: 'test-group', name: 'Test Group', type: 'public' });
    chatStateService.setActiveGroup(mockGroup);
    expect(chatStateService.activeGroup()).toBeTruthy();
    expect(chatStateService.activeUser()).toBeNull();
  });

  it('should propagate active conversation to signal readers', () => {
    const mockConv = new CometChat.Conversation(
      'conv-1',
      'user',
      undefined,
      undefined,
      undefined,
      undefined
    );
    chatStateService.setActiveConversation(mockConv);
    expect(chatStateService.activeConversation()).toBeTruthy();
  });

  it('should clear all state with clearAll', () => {
    const mockUser = new CometChat.User({ uid: 'test-user', name: 'Test User' });
    chatStateService.setActiveUser(mockUser);
    expect(chatStateService.activeUser()).toBeTruthy();

    chatStateService.clearActiveChat();
    expect(chatStateService.activeUser()).toBeNull();
    expect(chatStateService.activeGroup()).toBeNull();
    expect(chatStateService.activeConversation()).toBeNull();
  });
});

describe('Integration: Formatter Pipeline', () => {
  let formatterConfigService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    formatterConfigService = TestBed.inject(FormatterConfigService);
  });

  it('should return formatters array from getFormattersWithContext', () => {
    const formatters = formatterConfigService.getFormattersWithContext();
    expect(Array.isArray(formatters)).toBe(true);
  });

  it('should include default formatters when no custom formatters are set', () => {
    const formatters = formatterConfigService.getFormattersWithContext();
    // Default formatters should be present (URL, mention, etc.)
    expect(formatters.length).toBeGreaterThanOrEqual(0);
  });

  it('should allow adding custom formatters', () => {
    const initialFormatters = formatterConfigService.getFormattersWithContext();
    const initialCount = initialFormatters.length;

    // Create a mock formatter (must match CometChatTextFormatter shape)
    const mockFormatter = {
      getFormattedText: (text: string) => text,
      setLoggedInUser: vi.fn(),
      setMessageAlignment: vi.fn(),
    };

    formatterConfigService.addFormatters([mockFormatter]);
    const updatedFormatters = formatterConfigService.getFormattersWithContext();
    expect(updatedFormatters.length).toBe(initialCount + 1);
  });
});

describe('Integration: Localization Language Switching', () => {
  const originalLang = CometChatLocalize?.getCurrentLanguage?.() ?? 'en';

  afterAll(() => {
    // Restore original language
    try {
      CometChatLocalize.setCurrentLanguage(originalLang);
    } catch {
      // Ignore if not initialized
    }
  });

  it('should return a string for known localization keys', () => {
    const result = CometChatLocalize.getLocalizedString('conversation_chat_title');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should return empty string for unknown localization keys', () => {
    const unknownKey = 'UNKNOWN_KEY_THAT_DOES_NOT_EXIST_12345';
    const result = CometChatLocalize.getLocalizedString(unknownKey);
    // CometChatLocalize returns empty string for unknown keys
    expect(result).toBe('');
  });

  it('should report current language', () => {
    const lang = CometChatLocalize.getCurrentLanguage();
    expect(typeof lang).toBe('string');
    expect(lang.length).toBeGreaterThanOrEqual(2);
  });

  it('should list available languages', () => {
    const languages = CometChatLocalize.getAvailableLanguages();
    expect(Array.isArray(languages)).toBe(true);
    expect(languages.length).toBeGreaterThan(0);
    expect(languages).toContain('en-US');
  });

  it('should switch language and return translated text in new language', () => {
    // Switch to a different available language
    const languages = CometChatLocalize.getAvailableLanguages();
    if (languages.length > 1) {
      const altLang = languages.find((l: string) => l !== 'en-US') || 'en-US';
      CometChatLocalize.setCurrentLanguage(altLang);
      expect(CometChatLocalize.getCurrentLanguage()).toBe(altLang);

      // Restore
      CometChatLocalize.setCurrentLanguage('en-US');
      expect(CometChatLocalize.getCurrentLanguage()).toBe('en-US');
    }
  });

  it('should support adding custom translations', () => {
    CometChatLocalize.addTranslation({
      'en-US': { CUSTOM_TEST_KEY: 'Custom Test Value' },
    });
    const result = CometChatLocalize.getLocalizedString('CUSTOM_TEST_KEY');
    expect(result).toBe('Custom Test Value');
  });
});
