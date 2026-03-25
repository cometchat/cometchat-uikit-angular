import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// jsdom polyfills — APIs missing from jsdom that Angular components use.
// Must be defined BEFORE any Angular code loads.
// ---------------------------------------------------------------------------

// IntersectionObserver (275+ test failures without this)
// IMPORTANT: Disable zone.js patching of IntersectionObserver BEFORE zone.js loads.
// Zone.js's patchClass() wraps the constructor and proxies methods, but it discovers
// methods by iterating over `new OriginalClass(function(){})`. Our mock constructor
// signature is (callback, options), causing zone.js to create a broken proxy.
globalThis.__Zone_disable_IntersectionObserver = true;

if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(callback, options) {
      this._callback = callback;
      this._options = options;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

// ResizeObserver (102+ test failures without this)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this._callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// matchMedia (63+ test failures without this)
if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// scrollIntoView / scrollTo / focus — not implemented in jsdom (53+ uncaught exceptions)
if (typeof Element !== 'undefined') {
  if (typeof Element.prototype.scrollIntoView === 'undefined') {
    Element.prototype.scrollIntoView = function () {};
  }
  if (typeof Element.prototype.scrollTo === 'undefined') {
    Element.prototype.scrollTo = function () {};
  }
}


// ---------------------------------------------------------------------------
// Mock @cometchat/calls-sdk-javascript BEFORE zone.js or Angular loads.
//
// The real Calls SDK references JitsiMeetJS which is not available in jsdom.
// ---------------------------------------------------------------------------
vi.mock('@cometchat/calls-sdk-javascript', () => {
  const CallSettingsBuilder = vi.fn().mockImplementation(function () {
    this.enableDefaultLayout = vi.fn().mockReturnThis();
    this.setIsAudioOnlyCall = vi.fn().mockReturnThis();
    this.setCallListener = vi.fn().mockReturnThis();
    this.build = vi.fn().mockReturnValue({});
  });

  const OngoingCallListener = vi.fn().mockImplementation(function (callbacks) {
    this.callbacks = callbacks;
  });

  return {
    CometChatCalls: {
      init: vi.fn().mockResolvedValue(undefined),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      startSession: vi.fn(),
      endSession: vi.fn(),
      CallSettingsBuilder,
      OngoingCallListener,
    },
  };
});

// ---------------------------------------------------------------------------
// Mock @cometchat/chat-sdk-javascript BEFORE zone.js or Angular loads.
//
// Preserves real SDK model constructors (User, Group, TextMessage, etc.)
// but replaces CometChat static methods that require init/login.
// Per-test installSDKMocks() overrides these with richer defaults.
// ---------------------------------------------------------------------------
vi.mock('@cometchat/chat-sdk-javascript', async (importOriginal) => {
  const actual = await importOriginal();

  // Shallow-copy CometChat so we can override static methods
  const MockCometChat = { ...actual.CometChat };

  // Override static methods that require SDK init / login
  MockCometChat.init = vi.fn().mockResolvedValue(true);
  MockCometChat.isInitialized = vi.fn().mockReturnValue(true);
  MockCometChat.login = vi.fn().mockResolvedValue(null);
  MockCometChat.logout = vi.fn().mockResolvedValue({});
  MockCometChat.getLoggedinUser = vi.fn().mockResolvedValue(null);
  MockCometChat.getLoggedInUser = vi.fn().mockResolvedValue(null);
  MockCometChat.getConnectionStatus = vi.fn().mockReturnValue('connected');
  MockCometChat.setSource = vi.fn();
  MockCometChat.setDemoMetaInfo = vi.fn();

  // Listener registration/removal — no-ops that don't require init
  MockCometChat.addMessageListener = vi.fn();
  MockCometChat.addCallListener = vi.fn();
  MockCometChat.addUserListener = vi.fn();
  MockCometChat.addGroupListener = vi.fn();
  MockCometChat.addConnectionListener = vi.fn();
  MockCometChat.addLoginListener = vi.fn();
  MockCometChat.removeMessageListener = vi.fn();
  MockCometChat.removeCallListener = vi.fn();
  MockCometChat.removeUserListener = vi.fn();
  MockCometChat.removeGroupListener = vi.fn();
  MockCometChat.removeConnectionListener = vi.fn();
  MockCometChat.removeLoginListener = vi.fn();

  // Messaging
  MockCometChat.sendMessage = vi.fn().mockImplementation(async (msg) => {
    // Simulate SDK behavior: set sentAt if not already set
    if (msg && typeof msg.setSentAt === 'function' && !msg.getSentAt()) {
      msg.setSentAt(Math.floor(Date.now() / 1000));
    }
    if (msg && typeof msg.setId === 'function' && !msg.getId()) {
      msg.setId(Date.now());
    }
    return msg;
  });
  MockCometChat.sendMediaMessage = vi.fn().mockImplementation(async (msg) => {
    if (msg && typeof msg.setSentAt === 'function' && !msg.getSentAt()) {
      msg.setSentAt(Math.floor(Date.now() / 1000));
    }
    if (msg && typeof msg.setId === 'function' && !msg.getId()) {
      msg.setId(Date.now());
    }
    return msg;
  });
  MockCometChat.sendCustomMessage = vi.fn().mockImplementation(async (msg) => {
    if (msg && typeof msg.setSentAt === 'function' && !msg.getSentAt()) {
      msg.setSentAt(Math.floor(Date.now() / 1000));
    }
    return msg;
  });
  MockCometChat.editMessage = vi.fn().mockResolvedValue({});
  MockCometChat.deleteMessage = vi.fn().mockResolvedValue({});
  MockCometChat.markAsRead = vi.fn().mockResolvedValue(undefined);
  MockCometChat.markAsDelivered = vi.fn().mockResolvedValue(undefined);
  MockCometChat.markConversationAsRead = vi.fn().mockResolvedValue(undefined);
  MockCometChat.startTyping = vi.fn();
  MockCometChat.endTyping = vi.fn();

  // Users
  MockCometChat.getUser = vi.fn().mockResolvedValue(null);
  MockCometChat.blockUsers = vi.fn().mockResolvedValue([]);
  MockCometChat.unblockUsers = vi.fn().mockResolvedValue([]);

  // Groups
  MockCometChat.getGroup = vi.fn().mockResolvedValue(null);
  MockCometChat.joinGroup = vi.fn().mockResolvedValue(null);
  MockCometChat.leaveGroup = vi.fn().mockResolvedValue(true);
  MockCometChat.kickGroupMember = vi.fn().mockResolvedValue(true);
  MockCometChat.banGroupMember = vi.fn().mockResolvedValue(true);
  MockCometChat.unbanGroupMember = vi.fn().mockResolvedValue(true);
  MockCometChat.updateGroupMemberScope = vi.fn().mockResolvedValue(true);
  MockCometChat.transferGroupOwnership = vi.fn().mockResolvedValue('success');
  MockCometChat.createGroup = vi.fn().mockResolvedValue(null);
  MockCometChat.updateGroup = vi.fn().mockResolvedValue(null);
  MockCometChat.deleteGroup = vi.fn().mockResolvedValue(true);

  // Conversations
  MockCometChat.getConversation = vi.fn().mockResolvedValue(null);
  MockCometChat.deleteConversation = vi.fn().mockResolvedValue(undefined);
  MockCometChat.tagConversation = vi.fn().mockResolvedValue(undefined);

  // Messages (additional)
  MockCometChat.getMessageDetails = vi.fn().mockResolvedValue(null);
  MockCometChat.getMessageReceipts = vi.fn().mockResolvedValue([]);
  MockCometChat.getUnreadMessageCount = vi.fn().mockResolvedValue({});

  // Calls
  MockCometChat.initiateCall = vi.fn().mockImplementation(async (call) => call);
  MockCometChat.acceptCall = vi.fn().mockResolvedValue({});
  MockCometChat.rejectCall = vi.fn().mockResolvedValue({});
  MockCometChat.endCall = vi.fn().mockResolvedValue({});
  MockCometChat.clearActiveCall = vi.fn();
  MockCometChat.getActiveCall = vi.fn().mockReturnValue(null);

  // Reactions
  MockCometChat.addReaction = vi.fn().mockResolvedValue({});
  MockCometChat.removeReaction = vi.fn().mockResolvedValue({});

  // AI / Extensions
  MockCometChat.getConversationStarter = vi.fn().mockResolvedValue([]);
  MockCometChat.getSmartReplies = vi.fn().mockResolvedValue({});
  MockCometChat.getConversationSummary = vi.fn().mockResolvedValue('');
  MockCometChat.askBot = vi.fn().mockResolvedValue('');
  MockCometChat.isAIFeatureEnabled = vi.fn().mockResolvedValue(false);
  MockCometChat.isExtensionEnabled = vi.fn().mockResolvedValue(false);
  MockCometChat.callExtension = vi.fn().mockResolvedValue({});

  // Connection & Settings
  MockCometChat.getAppSettings = vi.fn().mockResolvedValue({});
  MockCometChat.isFeatureEnabled = vi.fn().mockResolvedValue(true);
  MockCometChat.connect = vi.fn();
  MockCometChat.disconnect = vi.fn();

  // ---------------------------------------------------------------------------
  // Mock Request Builders — replace real SDK builders that call the network.
  // Each builder preserves the fluent API (setters return `this`) and
  // build() returns a request with a mock fetchNext/fetchPrevious.
  // Per-test overrides can be done via vi.spyOn on the built request.
  // ---------------------------------------------------------------------------

  function createFluentBuilder(extraRequestMethods) {
    return function MockBuilder() {
      const request = { fetchNext: vi.fn().mockResolvedValue([]), ...extraRequestMethods };
      return new Proxy({}, {
        get(target, prop) {
          if (prop === 'build') return vi.fn().mockReturnValue(request);
          if (prop === '__mockRequest') return request;
          // All setter methods return `this` for fluent chaining
          if (typeof prop === 'string') {
            if (!target[prop]) target[prop] = vi.fn().mockReturnThis();
            return target[prop];
          }
          return undefined;
        }
      });
    };
  }

  MockCometChat.ConversationsRequestBuilder = createFluentBuilder();
  MockCometChat.UsersRequestBuilder = createFluentBuilder();
  MockCometChat.GroupsRequestBuilder = createFluentBuilder();
  MockCometChat.GroupMembersRequestBuilder = createFluentBuilder();
  MockCometChat.BannedMembersRequestBuilder = createFluentBuilder();
  MockCometChat.BlockedUsersRequestBuilder = createFluentBuilder();
  MockCometChat.ReactionsRequestBuilder = createFluentBuilder();
  MockCometChat.MessagesRequestBuilder = createFluentBuilder({
    fetchPrevious: vi.fn().mockResolvedValue([]),
  });

  // AppSettingsBuilder — used in test-setup and some services
  MockCometChat.AppSettingsBuilder = function MockAppSettingsBuilder() {
    return new Proxy({}, {
      get(target, prop) {
        if (prop === 'build') return vi.fn().mockReturnValue({});
        if (typeof prop === 'string') {
          if (!target[prop]) target[prop] = vi.fn().mockReturnThis();
          return target[prop];
        }
        return undefined;
      }
    });
  };

  return { ...actual, CometChat: MockCometChat };
});

// ---------------------------------------------------------------------------
// Zone.js + Angular TestBed via @analogjs/vitest-angular.
//
// NOTE: This file MUST be .mjs so the Angular compiler plugin skips it.
// The plugin's regex /\.[cm]?(ts)[^x]?\??/ matches .ts but not .mjs.
//
// Skip Zone.js / TestBed setup when running in node environment
// (scripts/__tests__/ use `// @vitest-environment node`).
// ---------------------------------------------------------------------------
if (typeof window !== 'undefined') {
  await import('@analogjs/vitest-angular/setup-zone');
  const { setupTestBed } = await import('@analogjs/vitest-angular/setup-testbed');
  setupTestBed({ zoneless: false });
}
