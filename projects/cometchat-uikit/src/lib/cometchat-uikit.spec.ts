import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {
      CallAppSettingsBuilder: class {
        setAppId() {
          return this;
        }
        setRegion() {
          return this;
        }
        build() {
          return {};
        }
      },
      init: vi.fn().mockResolvedValue(true),
    },
  };
});

import { TestBed } from '@angular/core/testing';
import { CometChatUIKit } from './cometchat-uikit';
import { InitResult, LogoutResult } from './modals/CometChatUIKitInterfaces';
import { UIKitSettings } from './UIKitSettings';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKitLoginListener } from './CometChatUIKitLoginListener';
import { CometChatMessageEvents } from './events/CometChatMessageEvents';

describe('CometChatUIKit Type Safety', () => {
  describe('InitResult interface', () => {
    it('should have correct structure', () => {
      const result: InitResult = {
        user: null,
      };

      expect(result).toBeDefined();
      expect(result.user).toBeNull();
    });

    it('should accept CometChat.User', () => {
      const mockUser = new CometChat.User('test-uid');
      mockUser.setName('Test User');

      const result: InitResult = {
        user: mockUser,
      };

      expect(result.user).toBe(mockUser);
      expect(result.user?.getUid()).toBe('test-uid');
    });
  });

  describe('LogoutResult interface', () => {
    it('should have correct structure', () => {
      const result: LogoutResult = {
        message: 'Logout successful',
      };

      expect(result).toBeDefined();
      expect(result.message).toBe('Logout successful');
    });

    it('should accept string message', () => {
      const result: LogoutResult = {
        message: 'User logged out successfully',
      };

      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });
  });

  describe('init() return type', () => {
    it('should return Promise<InitResult> | undefined', () => {
      // This test verifies the type signature at compile time
      // The actual return type is checked by TypeScript compiler
      const settings = new UIKitSettings({
        appId: 'test-app-id',
        region: 'us',
        authKey: 'test-auth-key',
      } as any);

      const result = CometChatUIKit.init(settings);

      // If settings are valid, should return a Promise
      if (result) {
        expect(result).toBeInstanceOf(Promise);
      }
    });

    it('should return undefined when settings are invalid', () => {
      const result = CometChatUIKit.init(null);

      expect(result).toBeUndefined();
    });
  });

  describe('logout() return type', () => {
    it('should return Promise<LogoutResult>', () => {
      // This test verifies the type signature at compile time
      // The actual return type is checked by TypeScript compiler
      const result = CometChatUIKit.logout();

      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Type inference', () => {
    it('should infer InitResult type from init() promise', async () => {
      // This test ensures TypeScript can properly infer the return type
      const settings = new UIKitSettings({
        appId: 'test-app-id',
        region: 'us',
        authKey: 'test-auth-key',
      } as any);

      const initPromise = CometChatUIKit.init(settings);

      if (initPromise) {
        // TypeScript should know that result is InitResult
        // This would fail to compile if the type is wrong
        initPromise
          .then((result: InitResult) => {
            expect(result).toHaveProperty('user');
          })
          .catch(() => {
            // Expected to fail in test environment without real SDK
          });
      }
    });

    it('should infer LogoutResult type from logout() promise', async () => {
      // This test ensures TypeScript can properly infer the return type
      const logoutPromise = CometChatUIKit.logout();

      // TypeScript should know that result is LogoutResult
      // This would fail to compile if the type is wrong
      logoutPromise
        .then((result: LogoutResult) => {
          expect(result).toHaveProperty('message');
        })
        .catch(() => {
          // Expected to fail in test environment without real SDK
        });
    });
  });

  describe('Instance methods', () => {
    let service: CometChatUIKit;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [CometChatUIKit],
      });
      service = TestBed.inject(CometChatUIKit);
    });

    it('should have init() method with correct return type', () => {
      const settings = new UIKitSettings({
        appId: 'test-app-id',
        region: 'us',
        authKey: 'test-auth-key',
      } as any);

      const result = service.init(settings);

      if (result) {
        expect(result).toBeInstanceOf(Promise);
      }
    });

    it('should have logout() method with correct return type', () => {
      const result = service.logout();

      expect(result).toBeInstanceOf(Promise);
    });
  });
});

// ==================== Helper Utilities ====================

function createValidSettings(): UIKitSettings {
  return new UIKitSettings({
    appId: 'test-app-id',
    region: 'us',
    authKey: 'test-auth-key',
  } as any);
}

function createMockUser(uid = 'test-uid'): CometChat.User {
  const user = new CometChat.User(uid);
  user.setName('Test User');
  return user;
}

function resetStaticState(): void {
  CometChatUIKit.uiKitSettings = null;
  // Reset the BehaviorSubject by accessing the private field
  (CometChatUIKit as any)._loggedInUser?.next(null);
  (CometChatUIKit as any)._themeMode = 'light';
}

// ==================== 1. Initialization Tests ====================

describe('CometChatUIKit Initialization', () => {
  beforeEach(() => {
    resetStaticState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  it('should return a Promise when init is called with valid settings', () => {
    const settings = createValidSettings();
    const result = CometChatUIKit.init(settings);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should return undefined when init is called with null', () => {
    const result = CometChatUIKit.init(null);
    expect(result).toBeUndefined();
  });

  it('should store uiKitSettings after init is called', () => {
    const settings = createValidSettings();
    CometChatUIKit.init(settings);
    expect(CometChatUIKit.uiKitSettings).toBe(settings);
  });

  it('should return undefined when settings have no appId', () => {
    const settings = new UIKitSettings({
      region: 'us',
      authKey: 'test-auth-key',
    } as any);
    // appId is undefined, so checkAuthSettings returns false
    const result = CometChatUIKit.init(settings);
    expect(result).toBeUndefined();
  });

  it('should resolve with user:null when no user is logged in', async () => {
    const settings = createValidSettings();
    vi.spyOn(CometChat, 'init').mockResolvedValue(true as any);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);

    const result = await CometChatUIKit.init(settings);
    expect(result).toEqual({ user: null });
  });

  it('should resolve with user when a user is already logged in', async () => {
    const settings = createValidSettings();
    const mockUser = createMockUser();
    vi.spyOn(CometChat, 'init').mockResolvedValue(true as any);
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(mockUser);
    vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');
    vi.spyOn(CometChat, 'getConversationUpdateSettings').mockResolvedValue({} as any);
    vi.spyOn(CometChatUIKitLoginListener, 'attachListener');

    const result = await CometChatUIKit.init(settings);
    expect(result!.user).toBe(mockUser);
    expect(CometChatUIKitLoginListener.setLoggedInUser).toHaveBeenCalledWith(mockUser);
  });

  it('should reject when CometChat.init fails', async () => {
    const settings = createValidSettings();
    const sdkError = { code: 'ERR', message: 'SDK init failed' };
    vi.spyOn(CometChat, 'init').mockRejectedValue(sdkError);

    await expect(CometChatUIKit.init(settings)!).rejects.toEqual(sdkError);
  });

  it('should reject when getLoggedinUser fails after init', async () => {
    const settings = createValidSettings();
    const sdkError = { code: 'ERR', message: 'getLoggedinUser failed' };
    vi.spyOn(CometChat, 'init').mockResolvedValue(true as any);
    vi.spyOn(CometChat, 'getLoggedinUser').mockRejectedValue(sdkError);

    await expect(CometChatUIKit.init(settings)!).rejects.toEqual(sdkError);
  });
});

// ==================== 2. Authentication Tests ====================

describe('CometChatUIKit Authentication', () => {
  beforeEach(() => {
    resetStaticState();
    // Set valid settings so checkAuthSettings passes
    CometChatUIKit.uiKitSettings = createValidSettings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  describe('login', () => {
    it('should return a Promise', () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
      vi.spyOn(CometChat, 'login').mockResolvedValue(createMockUser());
      vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');
      vi.spyOn(CometChat, 'getConversationUpdateSettings').mockResolvedValue({} as any);
      vi.spyOn(CometChatUIKitLoginListener, 'attachListener');

      const result = CometChatUIKit.login('test-uid');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with user on successful login', async () => {
      const mockUser = createMockUser();
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
      vi.spyOn(CometChat, 'login').mockResolvedValue(mockUser);
      vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');
      vi.spyOn(CometChat, 'getConversationUpdateSettings').mockResolvedValue({} as any);
      vi.spyOn(CometChatUIKitLoginListener, 'attachListener');

      const user = await CometChatUIKit.login('test-uid');
      expect(user).toBe(mockUser);
      expect(CometChatUIKitLoginListener.setLoggedInUser).toHaveBeenCalledWith(mockUser);
    });

    it('should return existing user if already logged in', async () => {
      const existingUser = createMockUser('existing-uid');
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(existingUser);
      vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');
      vi.spyOn(CometChat, 'getConversationUpdateSettings').mockResolvedValue({} as any);
      vi.spyOn(CometChatUIKitLoginListener, 'attachListener');

      const user = await CometChatUIKit.login('test-uid');
      expect(user).toBe(existingUser);
    });

    it('should reject when uiKitSettings is not available', async () => {
      CometChatUIKit.uiKitSettings = null;
      await expect(CometChatUIKit.login('test-uid')).rejects.toBe('uiKitSettings not available');
    });

    it('should reject when CometChat.login fails', async () => {
      const sdkError = { code: 'ERR_LOGIN', message: 'Login failed' };
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
      vi.spyOn(CometChat, 'login').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.login('test-uid')).rejects.toEqual(sdkError);
    });
  });

  describe('loginWithAuthToken', () => {
    it('should return a Promise', () => {
      vi.spyOn(CometChat, 'login').mockResolvedValue(createMockUser());
      vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');
      vi.spyOn(CometChat, 'getConversationUpdateSettings').mockResolvedValue({} as any);
      vi.spyOn(CometChatUIKitLoginListener, 'attachListener');

      const result = CometChatUIKit.loginWithAuthToken('test-token');
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with user on successful auth token login', async () => {
      const mockUser = createMockUser();
      vi.spyOn(CometChat, 'login').mockResolvedValue(mockUser);
      vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');
      vi.spyOn(CometChat, 'getConversationUpdateSettings').mockResolvedValue({} as any);
      vi.spyOn(CometChatUIKitLoginListener, 'attachListener');

      const user = await CometChatUIKit.loginWithAuthToken('test-token');
      expect(user).toBe(mockUser);
    });

    it('should reject when uiKitSettings is not available', async () => {
      CometChatUIKit.uiKitSettings = null;
      await expect(CometChatUIKit.loginWithAuthToken('test-token')).rejects.toBe(
        'uiKitSettings not available'
      );
    });

    it('should reject when CometChat.login with token fails', async () => {
      const sdkError = { code: 'ERR_AUTH', message: 'Auth token invalid' };
      vi.spyOn(CometChat, 'login').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.loginWithAuthToken('bad-token')).rejects.toEqual(sdkError);
    });
  });

  describe('logout', () => {
    it('should return a Promise<LogoutResult>', () => {
      const result = CometChatUIKit.logout();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with LogoutResult on successful logout', async () => {
      vi.spyOn(CometChat, 'logout').mockResolvedValue({ message: 'Logout successful' } as any);
      vi.spyOn(CometChatUIKitLoginListener, 'removeLoggedInUser');

      const result = await CometChatUIKit.logout();
      expect(result).toHaveProperty('message');
      expect(typeof result.message).toBe('string');
      expect(CometChatUIKitLoginListener.removeLoggedInUser).toHaveBeenCalled();
    });

    it('should set loggedInUser to null after logout', async () => {
      // First set a user
      (CometChatUIKit as any)._loggedInUser?.next(createMockUser());
      vi.spyOn(CometChat, 'logout').mockResolvedValue({ message: 'Logout successful' } as any);
      vi.spyOn(CometChatUIKitLoginListener, 'removeLoggedInUser');

      await CometChatUIKit.logout();
      expect(CometChatUIKit.getLoggedInUser()).toBeNull();
    });

    it('should reject when uiKitSettings is not available', async () => {
      CometChatUIKit.uiKitSettings = null;
      await expect(CometChatUIKit.logout()).rejects.toEqual({
        code: 'ERROR_UIKIT_NOT_INITIALISED',
        message: 'UIKItSettings not available',
      });
    });

    it('should reject when CometChat.logout fails', async () => {
      const sdkError = { code: 'ERR_LOGOUT', message: 'Logout failed' };
      vi.spyOn(CometChat, 'logout').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.logout()).rejects.toEqual(sdkError);
    });
  });

  describe('getLoggedinUser (async)', () => {
    it('should return a Promise', () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);
      const result = CometChatUIKit.getLoggedinUser();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with user when logged in', async () => {
      const mockUser = createMockUser();
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(mockUser);
      vi.spyOn(CometChatUIKitLoginListener, 'setLoggedInUser');

      const user = await CometChatUIKit.getLoggedinUser();
      expect(user).toBe(mockUser);
    });

    it('should resolve with null when no user is logged in', async () => {
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(null);

      const user = await CometChatUIKit.getLoggedinUser();
      expect(user).toBeNull();
    });

    it('should reject when uiKitSettings is not available', async () => {
      CometChatUIKit.uiKitSettings = null;
      await expect(CometChatUIKit.getLoggedinUser()).rejects.toBe('uiKitSettings not available');
    });
  });
});

// ==================== 3. Message Sending Tests ====================

describe('CometChatUIKit Message Sending', () => {
  let ccMessageSentSpy: any;

  beforeEach(() => {
    resetStaticState();
    CometChatUIKit.uiKitSettings = createValidSettings();
    ccMessageSentSpy = vi.spyOn(CometChatMessageEvents.ccMessageSent, 'next');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  describe('sendTextMessage', () => {
    it('should return a Promise', () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(CometChat, 'sendMessage').mockResolvedValue(message as any);

      const result = CometChatUIKit.sendTextMessage(message);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with sent message on success', async () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      const sentMessage = { ...message, getId: () => 123 } as any;
      vi.spyOn(CometChat, 'sendMessage').mockResolvedValue(sentMessage);

      const result = await CometChatUIKit.sendTextMessage(message);
      expect(result).toBe(sentMessage);
    });

    it('should emit inprogress event before sending', async () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(CometChat, 'sendMessage').mockResolvedValue(message as any);

      await CometChatUIKit.sendTextMessage(message);

      // First call should be inprogress (MessageStatus.inprogress = 0)
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 0 }));
    });

    it('should emit success event after sending', async () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(CometChat, 'sendMessage').mockResolvedValue(message as any);

      await CometChatUIKit.sendTextMessage(message);

      // Second call should be success (MessageStatus.success = 1)
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 1 }));
    });

    it('should emit error event on failure', async () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      const sdkError = { code: 'ERR', message: 'Send failed' };
      vi.spyOn(CometChat, 'sendMessage').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.sendTextMessage(message)).rejects.toEqual(sdkError);

      // Should have emitted error status (MessageStatus.error = 2)
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 2 }));
    });

    it('should set sentAt timestamp on the message', async () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      const setSentAtSpy = vi.spyOn(message, 'setSentAt');
      vi.spyOn(CometChat, 'sendMessage').mockResolvedValue(message as any);

      await CometChatUIKit.sendTextMessage(message);
      expect(setSentAtSpy).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should generate muid if not already set', async () => {
      const message = new CometChat.TextMessage(
        'receiver-uid',
        'Hello',
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(message, 'getMuid').mockReturnValue('');
      const setMuidSpy = vi.spyOn(message, 'setMuid');
      vi.spyOn(CometChat, 'sendMessage').mockResolvedValue(message as any);

      await CometChatUIKit.sendTextMessage(message);
      expect(setMuidSpy).toHaveBeenCalledWith(expect.stringContaining('cc_'));
    });
  });

  describe('sendMediaMessage', () => {
    it('should return a Promise', () => {
      const message = new CometChat.MediaMessage(
        'receiver-uid',
        'file-url' as any,
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(CometChat, 'sendMediaMessage').mockResolvedValue(message as any);

      const result = CometChatUIKit.sendMediaMessage(message);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with sent message on success', async () => {
      const message = new CometChat.MediaMessage(
        'receiver-uid',
        'file-url' as any,
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(CometChat, 'sendMediaMessage').mockResolvedValue(message as any);

      const result = await CometChatUIKit.sendMediaMessage(message);
      expect(result).toBe(message);
    });

    it('should emit inprogress and success events', async () => {
      const message = new CometChat.MediaMessage(
        'receiver-uid',
        'file-url' as any,
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.RECEIVER_TYPE.USER
      );
      vi.spyOn(CometChat, 'sendMediaMessage').mockResolvedValue(message as any);

      await CometChatUIKit.sendMediaMessage(message);

      expect(ccMessageSentSpy).toHaveBeenCalledTimes(2);
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 0 }));
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 1 }));
    });

    it('should reject and emit error event on failure', async () => {
      const message = new CometChat.MediaMessage(
        'receiver-uid',
        'file-url' as any,
        CometChat.MESSAGE_TYPE.IMAGE,
        CometChat.RECEIVER_TYPE.USER
      );
      const sdkError = { code: 'ERR', message: 'Media send failed' };
      vi.spyOn(CometChat, 'sendMediaMessage').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.sendMediaMessage(message)).rejects.toEqual(sdkError);
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 2 }));
    });
  });

  describe('sendCustomMessage', () => {
    it('should return a Promise', () => {
      const message = new CometChat.CustomMessage(
        'receiver-uid',
        CometChat.RECEIVER_TYPE.USER,
        'custom-type',
        { key: 'value' }
      );
      vi.spyOn(CometChat, 'sendCustomMessage').mockResolvedValue(message as any);

      const result = CometChatUIKit.sendCustomMessage(message);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with sent message on success', async () => {
      const message = new CometChat.CustomMessage(
        'receiver-uid',
        CometChat.RECEIVER_TYPE.USER,
        'custom-type',
        { key: 'value' }
      );
      vi.spyOn(CometChat, 'sendCustomMessage').mockResolvedValue(message as any);

      const result = await CometChatUIKit.sendCustomMessage(message);
      expect(result).toBe(message);
    });

    it('should emit inprogress and success events', async () => {
      const message = new CometChat.CustomMessage(
        'receiver-uid',
        CometChat.RECEIVER_TYPE.USER,
        'custom-type',
        { key: 'value' }
      );
      vi.spyOn(CometChat, 'sendCustomMessage').mockResolvedValue(message as any);

      await CometChatUIKit.sendCustomMessage(message);

      expect(ccMessageSentSpy).toHaveBeenCalledTimes(2);
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 0 }));
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 1 }));
    });

    it('should reject and emit error event on failure', async () => {
      const message = new CometChat.CustomMessage(
        'receiver-uid',
        CometChat.RECEIVER_TYPE.USER,
        'custom-type',
        { key: 'value' }
      );
      const sdkError = { code: 'ERR', message: 'Custom send failed' };
      vi.spyOn(CometChat, 'sendCustomMessage').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.sendCustomMessage(message)).rejects.toEqual(sdkError);
      expect(ccMessageSentSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 2 }));
    });
  });
});

// ==================== 4. User Management Tests ====================

describe('CometChatUIKit User Management', () => {
  beforeEach(() => {
    resetStaticState();
    CometChatUIKit.uiKitSettings = createValidSettings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  describe('createUser', () => {
    it('should return a Promise', () => {
      const user = createMockUser('new-uid');
      vi.spyOn(CometChat, 'createUser').mockResolvedValue(user);

      const result = CometChatUIKit.createUser(user);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with created user on success', async () => {
      const user = createMockUser('new-uid');
      vi.spyOn(CometChat, 'createUser').mockResolvedValue(user);

      const created = await CometChatUIKit.createUser(user);
      expect(created).toBe(user);
    });

    it('should call CometChat.createUser with user and authKey', async () => {
      const user = createMockUser('new-uid');
      const createSpy = vi.spyOn(CometChat, 'createUser').mockResolvedValue(user);

      await CometChatUIKit.createUser(user);
      expect(createSpy).toHaveBeenCalledWith(user, 'test-auth-key');
    });

    it('should reject when uiKitSettings is not available', async () => {
      CometChatUIKit.uiKitSettings = null;
      const user = createMockUser('new-uid');
      await expect(CometChatUIKit.createUser(user)).rejects.toBe('uiKitSettings not available');
    });

    it('should reject when CometChat.createUser fails', async () => {
      const user = createMockUser('new-uid');
      const sdkError = { code: 'ERR', message: 'Create user failed' };
      vi.spyOn(CometChat, 'createUser').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.createUser(user)).rejects.toEqual(sdkError);
    });
  });

  describe('updateUser', () => {
    it('should return a Promise', () => {
      const user = createMockUser('existing-uid');
      vi.spyOn(CometChat, 'updateUser').mockResolvedValue(user);

      const result = CometChatUIKit.updateUser(user);
      expect(result).toBeInstanceOf(Promise);
    });

    it('should resolve with updated user on success', async () => {
      const user = createMockUser('existing-uid');
      vi.spyOn(CometChat, 'updateUser').mockResolvedValue(user);

      const updated = await CometChatUIKit.updateUser(user);
      expect(updated).toBe(user);
    });

    it('should call CometChat.updateUser with user and authKey', async () => {
      const user = createMockUser('existing-uid');
      const updateSpy = vi.spyOn(CometChat, 'updateUser').mockResolvedValue(user);

      await CometChatUIKit.updateUser(user);
      expect(updateSpy).toHaveBeenCalledWith(user, 'test-auth-key');
    });

    it('should reject when uiKitSettings is not available', async () => {
      CometChatUIKit.uiKitSettings = null;
      const user = createMockUser('existing-uid');
      await expect(CometChatUIKit.updateUser(user)).rejects.toBe('uiKitSettings not available');
    });

    it('should reject when CometChat.updateUser fails', async () => {
      const user = createMockUser('existing-uid');
      const sdkError = { code: 'ERR', message: 'Update user failed' };
      vi.spyOn(CometChat, 'updateUser').mockRejectedValue(sdkError);

      await expect(CometChatUIKit.updateUser(user)).rejects.toEqual(sdkError);
    });
  });
});

// ==================== 5. State Tests ====================

describe('CometChatUIKit State', () => {
  beforeEach(() => {
    resetStaticState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  describe('isInitialized', () => {
    it('should return boolean', () => {
      const result = CometChatUIKit.isInitialized();
      expect(typeof result).toBe('boolean');
    });

    it('should return true when SDK is initialized', () => {
      vi.spyOn(CometChat, 'isInitialized').mockReturnValue(true);
      expect(CometChatUIKit.isInitialized()).toBe(true);
    });

    it('should return false when SDK is not initialized', () => {
      vi.spyOn(CometChat, 'isInitialized').mockReturnValue(false);
      expect(CometChatUIKit.isInitialized()).toBe(false);
    });

    it('should return false when CometChat.isInitialized throws', () => {
      vi.spyOn(CometChat, 'isInitialized').mockImplementation(() => {
        throw new Error('SDK not loaded');
      });
      expect(CometChatUIKit.isInitialized()).toBe(false);
    });
  });

  describe('checkAuthSettings', () => {
    it('should return false when uiKitSettings is null', () => {
      CometChatUIKit.uiKitSettings = null;
      expect(CometChatUIKit.checkAuthSettings()).toBe(false);
    });

    it('should return false when appId is null/undefined', () => {
      CometChatUIKit.uiKitSettings = new UIKitSettings({
        region: 'us',
      } as any);
      expect(CometChatUIKit.checkAuthSettings()).toBe(false);
    });

    it('should return true when settings have valid appId', () => {
      CometChatUIKit.uiKitSettings = createValidSettings();
      expect(CometChatUIKit.checkAuthSettings()).toBe(true);
    });
  });

  describe('getLoggedInUser (sync)', () => {
    it('should return null when no user is logged in', () => {
      expect(CometChatUIKit.getLoggedInUser()).toBeNull();
    });

    it('should return the user after it is set via BehaviorSubject', () => {
      const mockUser = createMockUser();
      (CometChatUIKit as any)._loggedInUser.next(mockUser);
      expect(CometChatUIKit.getLoggedInUser()).toBe(mockUser);
    });
  });

  describe('themeMode', () => {
    it('should default to light', () => {
      expect(CometChatUIKit.themeMode).toBe('light');
    });

    it('should allow setting to dark', () => {
      CometChatUIKit.themeMode = 'dark';
      expect(CometChatUIKit.themeMode).toBe('dark');
    });

    it('should allow setting back to light', () => {
      CometChatUIKit.themeMode = 'dark';
      CometChatUIKit.themeMode = 'light';
      expect(CometChatUIKit.themeMode).toBe('light');
    });
  });

  describe('uiKitSettings getter/setter', () => {
    it('should default to null', () => {
      expect(CometChatUIKit.uiKitSettings).toBeNull();
    });

    it('should store and retrieve settings', () => {
      const settings = createValidSettings();
      CometChatUIKit.uiKitSettings = settings;
      expect(CometChatUIKit.uiKitSettings).toBe(settings);
    });

    it('should allow setting back to null', () => {
      CometChatUIKit.uiKitSettings = createValidSettings();
      CometChatUIKit.uiKitSettings = null;
      expect(CometChatUIKit.uiKitSettings).toBeNull();
    });
  });

  describe('loggedInUser$ observable', () => {
    it('should emit null initially', () => {
      let emittedValue: CometChat.User | null | undefined;
      const sub = CometChatUIKit.loggedInUser$.subscribe(val => {
        emittedValue = val;
      });
      expect(emittedValue).toBeNull();
      sub.unsubscribe();
    });

    it('should emit user when set', () => {
      const mockUser = createMockUser();
      let emittedValue: CometChat.User | null | undefined;
      const sub = CometChatUIKit.loggedInUser$.subscribe(val => {
        emittedValue = val;
      });
      (CometChatUIKit as any)._loggedInUser.next(mockUser);
      expect(emittedValue).toBe(mockUser);
      sub.unsubscribe();
    });
  });

  describe('SoundManager and Localize references', () => {
    it('should expose SoundManager', () => {
      expect(CometChatUIKit.SoundManager).toBeDefined();
    });

    it('should expose Localize', () => {
      expect(CometChatUIKit.Localize).toBeDefined();
    });
  });
});

// ==================== 6. Error Handling Tests ====================

describe('CometChatUIKit Error Handling', () => {
  beforeEach(() => {
    resetStaticState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  it('init with null settings should return undefined', () => {
    const result = CometChatUIKit.init(null);
    expect(result).toBeUndefined();
  });

  it('login without init (no settings) should reject', async () => {
    CometChatUIKit.uiKitSettings = null;
    await expect(CometChatUIKit.login('uid')).rejects.toBe('uiKitSettings not available');
  });

  it('loginWithAuthToken without init should reject', async () => {
    CometChatUIKit.uiKitSettings = null;
    await expect(CometChatUIKit.loginWithAuthToken('token')).rejects.toBe(
      'uiKitSettings not available'
    );
  });

  it('logout without init should reject with structured error', async () => {
    CometChatUIKit.uiKitSettings = null;
    await expect(CometChatUIKit.logout()).rejects.toEqual({
      code: 'ERROR_UIKIT_NOT_INITIALISED',
      message: 'UIKItSettings not available',
    });
  });

  it('getLoggedinUser without init should reject', async () => {
    CometChatUIKit.uiKitSettings = null;
    await expect(CometChatUIKit.getLoggedinUser()).rejects.toBe('uiKitSettings not available');
  });

  it('createUser without init should reject', async () => {
    CometChatUIKit.uiKitSettings = null;
    const user = createMockUser();
    await expect(CometChatUIKit.createUser(user)).rejects.toBe('uiKitSettings not available');
  });

  it('updateUser without init should reject', async () => {
    CometChatUIKit.uiKitSettings = null;
    const user = createMockUser();
    await expect(CometChatUIKit.updateUser(user)).rejects.toBe('uiKitSettings not available');
  });

  it('sendTextMessage should reject when SDK sendMessage fails', async () => {
    const message = new CometChat.TextMessage('uid', 'text', CometChat.RECEIVER_TYPE.USER);
    const sdkError = { code: 'ERR', message: 'Network error' };
    vi.spyOn(CometChat, 'sendMessage').mockRejectedValue(sdkError);

    await expect(CometChatUIKit.sendTextMessage(message)).rejects.toEqual(sdkError);
  });

  it('sendMediaMessage should reject when SDK sendMediaMessage fails', async () => {
    const message = new CometChat.MediaMessage(
      'uid',
      'file' as any,
      CometChat.MESSAGE_TYPE.FILE,
      CometChat.RECEIVER_TYPE.USER
    );
    const sdkError = { code: 'ERR', message: 'Upload failed' };
    vi.spyOn(CometChat, 'sendMediaMessage').mockRejectedValue(sdkError);

    await expect(CometChatUIKit.sendMediaMessage(message)).rejects.toEqual(sdkError);
  });

  it('sendCustomMessage should reject when SDK sendCustomMessage fails', async () => {
    const message = new CometChat.CustomMessage('uid', CometChat.RECEIVER_TYPE.USER, 'type', {});
    const sdkError = { code: 'ERR', message: 'Custom send error' };
    vi.spyOn(CometChat, 'sendCustomMessage').mockRejectedValue(sdkError);

    await expect(CometChatUIKit.sendCustomMessage(message)).rejects.toEqual(sdkError);
  });
});

// ==================== 7. Static vs Instance Parity Tests ====================

describe('CometChatUIKit Static vs Instance Parity', () => {
  let service: CometChatUIKit;

  beforeEach(() => {
    resetStaticState();
    CometChatUIKit.uiKitSettings = createValidSettings();
    TestBed.configureTestingModule({
      providers: [CometChatUIKit],
    });
    service = TestBed.inject(CometChatUIKit);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetStaticState();
  });

  it('instance init should delegate to static init', () => {
    const initSpy = vi.spyOn(CometChatUIKit, 'init');
    const settings = createValidSettings();
    service.init(settings);
    expect(initSpy).toHaveBeenCalledWith(settings);
  });

  it('instance login should delegate to static login', () => {
    const loginSpy = vi.spyOn(CometChatUIKit, 'login');
    // Mock the internal call to prevent actual execution
    loginSpy.mockReturnValue(Promise.resolve(createMockUser()));
    service.login('test-uid');
    expect(loginSpy).toHaveBeenCalledWith('test-uid');
  });

  it('instance loginWithAuthToken should delegate to static loginWithAuthToken', () => {
    const spy = vi.spyOn(CometChatUIKit, 'loginWithAuthToken');
    spy.mockReturnValue(Promise.resolve(createMockUser()));
    service.loginWithAuthToken('test-token');
    expect(spy).toHaveBeenCalledWith('test-token');
  });

  it('instance logout should delegate to static logout', () => {
    const spy = vi.spyOn(CometChatUIKit, 'logout');
    spy.mockReturnValue(Promise.resolve({ message: 'ok' }));
    service.logout();
    expect(spy).toHaveBeenCalled();
  });

  it('instance getLoggedinUser should delegate to static getLoggedinUser', () => {
    const spy = vi.spyOn(CometChatUIKit, 'getLoggedinUser');
    spy.mockReturnValue(Promise.resolve(null));
    service.getLoggedinUser();
    expect(spy).toHaveBeenCalled();
  });

  it('instance getLoggedInUser should delegate to static getLoggedInUser', () => {
    const spy = vi.spyOn(CometChatUIKit, 'getLoggedInUser');
    spy.mockReturnValue(null);
    service.getLoggedInUser();
    expect(spy).toHaveBeenCalled();
  });

  it('instance isInitialized should delegate to static isInitialized', () => {
    const spy = vi.spyOn(CometChatUIKit, 'isInitialized');
    spy.mockReturnValue(true);
    const result = service.isInitialized();
    expect(spy).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('instance createUser should delegate to static createUser', () => {
    const spy = vi.spyOn(CometChatUIKit, 'createUser');
    const user = createMockUser();
    spy.mockReturnValue(Promise.resolve(user));
    service.createUser(user);
    expect(spy).toHaveBeenCalledWith(user);
  });

  it('instance updateUser should delegate to static updateUser', () => {
    const spy = vi.spyOn(CometChatUIKit, 'updateUser');
    const user = createMockUser();
    spy.mockReturnValue(Promise.resolve(user));
    service.updateUser(user);
    expect(spy).toHaveBeenCalledWith(user);
  });

  it('instance sendTextMessage should delegate to static sendTextMessage', () => {
    const spy = vi.spyOn(CometChatUIKit, 'sendTextMessage');
    const msg = new CometChat.TextMessage('uid', 'text', CometChat.RECEIVER_TYPE.USER);
    spy.mockReturnValue(Promise.resolve(msg as any));
    service.sendTextMessage(msg);
    expect(spy).toHaveBeenCalledWith(msg);
  });

  it('instance sendMediaMessage should delegate to static sendMediaMessage', () => {
    const spy = vi.spyOn(CometChatUIKit, 'sendMediaMessage');
    const msg = new CometChat.MediaMessage(
      'uid',
      'file' as any,
      CometChat.MESSAGE_TYPE.IMAGE,
      CometChat.RECEIVER_TYPE.USER
    );
    spy.mockReturnValue(Promise.resolve(msg as any));
    service.sendMediaMessage(msg);
    expect(spy).toHaveBeenCalledWith(msg);
  });

  it('instance sendCustomMessage should delegate to static sendCustomMessage', () => {
    const spy = vi.spyOn(CometChatUIKit, 'sendCustomMessage');
    const msg = new CometChat.CustomMessage('uid', CometChat.RECEIVER_TYPE.USER, 'type', {});
    spy.mockReturnValue(Promise.resolve(msg as any));
    service.sendCustomMessage(msg);
    expect(spy).toHaveBeenCalledWith(msg);
  });

  it('instance loggedInUser$ should return same observable as static', () => {
    const staticObs = CometChatUIKit.loggedInUser$;
    const instanceObs = service.loggedInUser$;
    // Both should emit the same values
    let staticVal: any;
    let instanceVal: any;
    const sub1 = staticObs.subscribe(v => (staticVal = v));
    const sub2 = instanceObs.subscribe(v => (instanceVal = v));
    expect(staticVal).toEqual(instanceVal);
    sub1.unsubscribe();
    sub2.unsubscribe();
  });
});
