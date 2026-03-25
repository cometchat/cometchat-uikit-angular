/**
 * Property-Based Tests for CometChatMessageHeader — Summary Integration
 *
 * **Feature: ai-features**
 *
 * Tests the message header's conversation summary integration:
 * - Property 2: Summary generation message count passthrough
 * - Property 3: Summary receiver derivation
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================

vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {},
  };
});

// ==================== Imports ====================

import * as fc from 'fast-check';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { signal, EventEmitter } from '@angular/core';
import { CometChatUIEvents, IPanel } from '../../../events/CometChatUIEvents';
import { PanelAlignment } from '../../../Enums/Enums';
import { CometChatMessageHeaderComponent } from '../cometchat-message-header.component';
import { Subscription } from 'rxjs';

// ==================== Generators ====================

/**
 * Generates positive integers for summaryGenerationMessageCount.
 * The SDK expects a positive integer for lastNMessages.
 */
const positiveInteger = fc.integer({ min: 1, max: 100_000 });

/**
 * Generates non-empty alphanumeric strings for user UIDs.
 */
const userUid = fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/);

/**
 * Generates non-empty alphanumeric strings for group GUIDs.
 */
const groupGuid = fc.stringMatching(/^[a-zA-Z0-9_-]{1,30}$/);

// ==================== Helpers ====================

/**
 * Creates a minimal CometChatMessageHeaderComponent instance with just enough
 * wiring to test `handleSummaryClick()` → `triggerSummaryGeneration()`.
 *
 * We bypass Angular DI by using Object.create and manually initializing the
 * signals and properties that `triggerSummaryGeneration` depends on:
 *   - `currentUser` / `currentGroup` signals (protected)
 *   - `summaryGenerationMessageCount` input
 *   - `conversationSummaryClick` EventEmitter
 */
function createMinimalComponent(): CometChatMessageHeaderComponent {
  const instance = Object.create(
    CometChatMessageHeaderComponent.prototype
  ) as CometChatMessageHeaderComponent;

  // Initialize the protected signals that triggerSummaryGeneration reads
  (instance as any).currentUser = signal<CometChat.User | null>(null);
  (instance as any).currentGroup = signal<CometChat.Group | null>(null);

  // Initialize the EventEmitter for backward-compat output
  (instance as any).conversationSummaryClick = new EventEmitter();

  // Set default summaryGenerationMessageCount
  (instance as any).summaryGenerationMessageCount = 1000;

  return instance;
}

// ==================== Tests ====================

describe('Feature: ai-features, Property 2: Summary generation message count passthrough', () => {
  let panelSub: Subscription;
  let getConversationSummarySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getConversationSummarySpy = vi
      .spyOn(CometChat, 'getConversationSummary')
      .mockResolvedValue('mock summary');
  });

  afterEach(() => {
    panelSub?.unsubscribe();
    getConversationSummarySpy?.mockRestore();
  });

  /**
   * **Validates: Requirements 2.4**
   *
   * For any positive integer `summaryGenerationMessageCount`, the SDK call
   * receives that value as `lastNMessages`.
   */
  it('should pass summaryGenerationMessageCount as lastNMessages to the SDK call', async () => {
    const component = createMinimalComponent();

    await fc.assert(
      fc.asyncProperty(positiveInteger, async messageCount => {
        getConversationSummarySpy.mockClear();

        // Configure the component with the generated message count
        (component as any).summaryGenerationMessageCount = messageCount;

        // Set a user so triggerSummaryGeneration doesn't bail out
        const user = new CometChat.User('test-uid');
        user.setName('Test User');
        (component as any).currentUser.set(user);

        // Capture the panel event
        let capturedPanel: IPanel | null = null;
        panelSub = CometChatUIEvents.ccShowPanel.subscribe(panel => {
          capturedPanel = panel;
        });

        // Trigger summary generation via the public method
        component.handleSummaryClick();

        // The panel event should have been emitted synchronously
        expect(capturedPanel).not.toBeNull();
        expect(capturedPanel!.position).toBe(PanelAlignment.messageListFooter);

        // Call the getConversationSummary callback to trigger the SDK call
        await capturedPanel!.configuration.getConversationSummary();

        // Verify the SDK was called with the correct lastNMessages
        expect(getConversationSummarySpy).toHaveBeenCalledOnce();
        const callArgs = getConversationSummarySpy.mock.calls[0];
        expect(callArgs[2]).toEqual({ lastNMessages: messageCount });

        panelSub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: ai-features, Property 3: Summary receiver derivation', () => {
  let panelSub: Subscription;
  let getConversationSummarySpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getConversationSummarySpy = vi
      .spyOn(CometChat, 'getConversationSummary')
      .mockResolvedValue('mock summary');
  });

  afterEach(() => {
    panelSub?.unsubscribe();
    getConversationSummarySpy?.mockRestore();
  });

  /**
   * **Validates: Requirements 2.5**
   *
   * For any configured user, the SDK call uses the user's UID as receiverId
   * and 'user' as receiverType.
   */
  it('should use user UID and receiver type "user" when a user is configured', async () => {
    const component = createMinimalComponent();

    await fc.assert(
      fc.asyncProperty(userUid, async uid => {
        getConversationSummarySpy.mockClear();

        // Configure with a user
        const user = new CometChat.User(uid);
        user.setName('Test User');
        (component as any).currentUser.set(user);
        (component as any).currentGroup.set(null);

        let capturedPanel: IPanel | null = null;
        panelSub = CometChatUIEvents.ccShowPanel.subscribe(panel => {
          capturedPanel = panel;
        });

        component.handleSummaryClick();

        expect(capturedPanel).not.toBeNull();

        await capturedPanel!.configuration.getConversationSummary();

        expect(getConversationSummarySpy).toHaveBeenCalledOnce();
        const callArgs = getConversationSummarySpy.mock.calls[0];
        expect(callArgs[0]).toBe(uid);
        expect(callArgs[1]).toBe('user');

        panelSub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 2.5**
   *
   * For any configured group, the SDK call uses the group's GUID as receiverId
   * and 'group' as receiverType.
   */
  it('should use group GUID and receiver type "group" when a group is configured', async () => {
    const component = createMinimalComponent();

    await fc.assert(
      fc.asyncProperty(groupGuid, async guid => {
        getConversationSummarySpy.mockClear();

        // Configure with a group (no user)
        const group = new CometChat.Group(guid, 'Test Group', CometChat.GROUP_TYPE.PUBLIC);
        (component as any).currentUser.set(null);
        (component as any).currentGroup.set(group);

        let capturedPanel: IPanel | null = null;
        panelSub = CometChatUIEvents.ccShowPanel.subscribe(panel => {
          capturedPanel = panel;
        });

        component.handleSummaryClick();

        expect(capturedPanel).not.toBeNull();

        await capturedPanel!.configuration.getConversationSummary();

        expect(getConversationSummarySpy).toHaveBeenCalledOnce();
        const callArgs = getConversationSummarySpy.mock.calls[0];
        expect(callArgs[0]).toBe(guid);
        expect(callArgs[1]).toBe('group');

        panelSub.unsubscribe();
      }),
      { numRuns: 100 }
    );
  });
});
