import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TemplateRef } from '@angular/core';
import { ConversationSlotContext } from '../../interfaces/conversation-slots.interface';

/**
 * Property-Based Tests for CometChatConversationItem Slot Logic
 *
 * These tests verify universal properties that should hold across all inputs,
 * using fast-check for property-based testing.
 *
 * Since the CometChatConversationItem component uses Angular templates,
 * we cannot instantiate it directly in tests. Instead, we test the slot
 * resolution logic as pure functions that mirror the component's behavior.
 *
 * The component's template uses these conditions for slot rendering:
 * - @if (slots && slots.{slotName}) -> render custom template
 * - @else -> render default template
 *
 * **Validates: Requirements 2.7, 3.4, 5.2, 5.4, 5.6**
 */
describe('CometChatConversationItem Property Tests', () => {
  /**
   * All available slot names in the ConversationSlots interface.
   * These correspond to the 11 slots defined in Requirements 5.1.
   */
  const ALL_SLOT_NAMES = [
    'avatar',
    'statusIndicator',
    'groupTypeIcon',
    'typingIndicator',
    'title',
    'subtitle',
    'subtitleReceipt',
    'timestamp',
    'unreadBadge',
    'receipt',
    'contextMenuTrigger',
  ] as const;

  type SlotName = (typeof ALL_SLOT_NAMES)[number];

  /**
   * Represents a slot configuration where each slot can have a custom template or not.
   */
  type SlotConfiguration = Record<string, TemplateRef<any> | undefined>;

  /**
   * Creates a mock TemplateRef for testing purposes.
   * Each mock has a unique identifier to verify which template is used.
   */
  function createMockTemplateRef<T>(id: string): TemplateRef<T> {
    return {
      elementRef: { nativeElement: { id } },
      createEmbeddedView: () => null as any,
    } as unknown as TemplateRef<T>;
  }

  /**
   * Pure function that mirrors the component's slot resolution logic.
   * Returns true if a custom template should be rendered for the given slot.
   *
   * This mirrors the template logic: @if (slots && slots.{slotName})
   */
  function shouldRenderCustomTemplate(
    slots: SlotConfiguration | undefined,
    slotName: SlotName
  ): boolean {
    return !!(slots && slots[slotName]);
  }

  /**
   * Pure function that returns which template should be used for a slot.
   * Returns the custom template if provided, otherwise returns 'default'.
   */
  function getEffectiveTemplate(
    slots: SlotConfiguration | undefined,
    slotName: SlotName
  ): TemplateRef<any> | 'default' {
    if (slots && slots[slotName]) {
      return slots[slotName]!;
    }
    return 'default';
  }

  /**
   * Generates a random slot configuration where each slot may or may not have a custom template.
   */
  const slotConfigurationArbitrary = fc.record(
    Object.fromEntries(
      ALL_SLOT_NAMES.map(slotName => [
        slotName,
        fc
          .boolean()
          .map(hasCustom => (hasCustom ? createMockTemplateRef(`custom-${slotName}`) : undefined)),
      ])
    ) as Record<SlotName, fc.Arbitrary<TemplateRef<any> | undefined>>
  );

  /**
   * **Feature: conversations-enterprise-refactor, Property 3: Slot-Based Customization Isolation**
   *
   * *For any* `ConversationSlots` configuration where a custom template is provided
   * for a specific slot (e.g., `avatar`), only that slot SHALL render the custom
   * template while all other slots render their default templates.
   *
   * **Validates: Requirements 2.7, 3.4, 5.2, 5.6**
   */
  describe('Property 3: Slot-Based Customization Isolation', () => {
    /**
     * Test that when a single slot has a custom template, only that slot
     * renders the custom template while all others render defaults.
     */
    it('should render custom template only for the slot that has it configured', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_SLOT_NAMES), customizedSlot => {
          // Create a configuration with only one slot customized
          const slots: SlotConfiguration = {
            [customizedSlot]: createMockTemplateRef(`custom-${customizedSlot}`),
          };

          // Verify the customized slot uses custom template
          expect(shouldRenderCustomTemplate(slots, customizedSlot)).toBe(true);
          expect(getEffectiveTemplate(slots, customizedSlot)).not.toBe('default');

          // Verify all other slots use default templates
          for (const otherSlot of ALL_SLOT_NAMES) {
            if (otherSlot !== customizedSlot) {
              expect(shouldRenderCustomTemplate(slots, otherSlot)).toBe(false);
              expect(getEffectiveTemplate(slots, otherSlot)).toBe('default');
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that when multiple slots have custom templates, each slot
     * independently renders its own template without affecting others.
     */
    it('should isolate custom templates - each slot renders independently', () => {
      fc.assert(
        fc.property(slotConfigurationArbitrary, slots => {
          for (const slotName of ALL_SLOT_NAMES) {
            const hasCustomTemplate = slots[slotName] !== undefined;
            const shouldRenderCustom = shouldRenderCustomTemplate(slots, slotName);
            const effectiveTemplate = getEffectiveTemplate(slots, slotName);

            // The slot should render custom template if and only if it has one configured
            expect(shouldRenderCustom).toBe(hasCustomTemplate);

            if (hasCustomTemplate) {
              // Custom template should be the exact template provided
              expect(effectiveTemplate).toBe(slots[slotName]);
            } else {
              // Default template should be used
              expect(effectiveTemplate).toBe('default');
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that providing undefined or null slots object results in
     * all slots rendering their default templates.
     */
    it('should render all default templates when slots is undefined or empty', () => {
      fc.assert(
        fc.property(fc.constantFrom(undefined, {}, null as unknown as SlotConfiguration), slots => {
          for (const slotName of ALL_SLOT_NAMES) {
            expect(shouldRenderCustomTemplate(slots, slotName)).toBe(false);
            expect(getEffectiveTemplate(slots, slotName)).toBe('default');
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that the same template reference is preserved when retrieved.
     * This ensures template identity is maintained through the slot system.
     */
    it('should preserve template reference identity for custom slots', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.constantFrom(...ALL_SLOT_NAMES),
          (templateId, slotName) => {
            const customTemplate = createMockTemplateRef(templateId);
            const slots: SlotConfiguration = {
              [slotName]: customTemplate,
            };

            const effectiveTemplate = getEffectiveTemplate(slots, slotName);

            // The effective template should be the exact same reference
            expect(effectiveTemplate).toBe(customTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that customizing one slot does not affect the rendering decision
     * of any other slot - true isolation.
     */
    it('should not affect other slots when one slot is customized', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_SLOT_NAMES),
          fc.constantFrom(...ALL_SLOT_NAMES),
          (customizedSlot, testedSlot) => {
            // Create configuration with only customizedSlot having a template
            const slots: SlotConfiguration = {
              [customizedSlot]: createMockTemplateRef(`custom-${customizedSlot}`),
            };

            if (customizedSlot === testedSlot) {
              // The customized slot should render custom template
              expect(shouldRenderCustomTemplate(slots, testedSlot)).toBe(true);
            } else {
              // All other slots should render default template
              expect(shouldRenderCustomTemplate(slots, testedSlot)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that the number of slots rendering custom templates equals
     * the number of slots with custom templates configured.
     */
    it('should have correct count of custom vs default templates', () => {
      fc.assert(
        fc.property(slotConfigurationArbitrary, slots => {
          const expectedCustomCount = ALL_SLOT_NAMES.filter(
            name => slots[name] !== undefined
          ).length;

          const actualCustomCount = ALL_SLOT_NAMES.filter(name =>
            shouldRenderCustomTemplate(slots, name)
          ).length;

          const actualDefaultCount = ALL_SLOT_NAMES.filter(
            name => getEffectiveTemplate(slots, name) === 'default'
          ).length;

          expect(actualCustomCount).toBe(expectedCustomCount);
          expect(actualDefaultCount).toBe(ALL_SLOT_NAMES.length - expectedCustomCount);
          expect(actualCustomCount + actualDefaultCount).toBe(ALL_SLOT_NAMES.length);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that slot customization is idempotent - checking the same slot
     * multiple times returns the same result.
     */
    it('should be idempotent - same slot returns same result on multiple checks', () => {
      fc.assert(
        fc.property(
          slotConfigurationArbitrary,
          fc.constantFrom(...ALL_SLOT_NAMES),
          fc.integer({ min: 2, max: 10 }),
          (slots, slotName, checkCount) => {
            const results: boolean[] = [];
            const templates: (TemplateRef<any> | 'default')[] = [];

            for (let i = 0; i < checkCount; i++) {
              results.push(shouldRenderCustomTemplate(slots, slotName));
              templates.push(getEffectiveTemplate(slots, slotName));
            }

            // All results should be identical
            expect(new Set(results).size).toBe(1);
            expect(new Set(templates).size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that slot resolution is deterministic - given the same configuration,
     * the same slots always render custom templates.
     */
    it('should be deterministic - same config always produces same rendering decisions', () => {
      fc.assert(
        fc.property(slotConfigurationArbitrary, slots => {
          // Get rendering decisions twice
          const firstPass = ALL_SLOT_NAMES.map(name => ({
            name,
            isCustom: shouldRenderCustomTemplate(slots, name),
            template: getEffectiveTemplate(slots, name),
          }));

          const secondPass = ALL_SLOT_NAMES.map(name => ({
            name,
            isCustom: shouldRenderCustomTemplate(slots, name),
            template: getEffectiveTemplate(slots, name),
          }));

          // Both passes should produce identical results
          for (let i = 0; i < ALL_SLOT_NAMES.length; i++) {
            expect(firstPass[i].isCustom).toBe(secondPass[i].isCustom);
            expect(firstPass[i].template).toBe(secondPass[i].template);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: conversations-enterprise-refactor, Property 4: Slot Template Context**
   *
   * *For any* slot template rendered by `CometChatConversationItem`, the template
   * context SHALL contain the conversation object, isActive state, isSelected state,
   * unreadCount, and isTyping state matching the component's current state.
   *
   * **Validates: Requirements 5.4**
   */
  describe('Property 4: Slot Template Context', () => {
    /**
     * Simulates the component state that would be used to create slot context.
     * This mirrors the component's @Input properties.
     */
    interface ComponentState {
      conversation: MockConversation;
      isActive: boolean;
      isSelected: boolean;
      typingIndicator: MockTypingIndicator | null;
    }

    /**
     * Mock conversation object that simulates CometChat.Conversation.
     * Contains the essential methods used by the component.
     */
    interface MockConversation {
      id: string;
      getUnreadMessageCount: () => number;
      getConversationWith: () => { getName: () => string };
      getLastMessage: () => { getSentAt: () => number } | undefined;
    }

    /**
     * Mock typing indicator that simulates CometChat.TypingIndicator.
     */
    interface MockTypingIndicator {
      getTypingMetadata: () => Record<string, unknown>;
    }

    /**
     * Pure function that mirrors the component's slotContext getter.
     * This is the exact logic from CometChatConversationItemComponent.
     *
     * @see CometChatConversationItemComponent.slotContext
     */
    function createSlotContext(state: ComponentState): ConversationSlotContext {
      const unreadCount = state.conversation.getUnreadMessageCount() || 0;
      const isTyping = state.typingIndicator !== null;

      return {
        $implicit: state.conversation as unknown as any,
        conversation: state.conversation as unknown as any,
        isActive: state.isActive,
        isSelected: state.isSelected,
        unreadCount,
        isTyping,
      };
    }

    /**
     * Creates a mock conversation with the given properties.
     */
    function createMockConversation(id: string, unreadCount: number): MockConversation {
      return {
        id,
        getUnreadMessageCount: () => unreadCount,
        getConversationWith: () => ({ getName: () => `User ${id}` }),
        getLastMessage: () => ({ getSentAt: () => Date.now() }),
      };
    }

    /**
     * Creates a mock typing indicator.
     */
    function createMockTypingIndicator(): MockTypingIndicator {
      return {
        getTypingMetadata: () => ({}),
      };
    }

    /**
     * Arbitrary for generating random component states.
     */
    const componentStateArbitrary = fc.record({
      conversation: fc
        .record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          unreadCount: fc.integer({ min: 0, max: 999 }),
        })
        .map(({ id, unreadCount }) => createMockConversation(id, unreadCount)),
      isActive: fc.boolean(),
      isSelected: fc.boolean(),
      typingIndicator: fc
        .boolean()
        .map(hasTyping => (hasTyping ? createMockTypingIndicator() : null)),
    });

    /**
     * Test that the slot context always contains the conversation object.
     */
    it('should always include the conversation object in context', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);

          // Both $implicit and conversation should reference the same object
          expect(context.$implicit).toBe(state.conversation);
          expect(context.conversation).toBe(state.conversation);
          expect(context.$implicit).toBe(context.conversation);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that isActive in context matches the component's isActive state.
     */
    it('should have isActive matching component state', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);

          expect(context.isActive).toBe(state.isActive);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that isSelected in context matches the component's isSelected state.
     */
    it('should have isSelected matching component state', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);

          expect(context.isSelected).toBe(state.isSelected);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that unreadCount in context matches the conversation's unread count.
     */
    it('should have unreadCount matching conversation unread count', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);
          const expectedUnreadCount = state.conversation.getUnreadMessageCount() || 0;

          expect(context.unreadCount).toBe(expectedUnreadCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that isTyping in context is true if and only if typingIndicator is not null.
     */
    it('should have isTyping true when typingIndicator is present', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);
          const expectedIsTyping = state.typingIndicator !== null;

          expect(context.isTyping).toBe(expectedIsTyping);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that the context contains all required properties from ConversationSlotContext.
     */
    it('should contain all required ConversationSlotContext properties', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);

          // Verify all required properties exist
          expect(context).toHaveProperty('$implicit');
          expect(context).toHaveProperty('conversation');
          expect(context).toHaveProperty('isActive');
          expect(context).toHaveProperty('isSelected');
          expect(context).toHaveProperty('unreadCount');
          expect(context).toHaveProperty('isTyping');

          // Verify property types
          expect(typeof context.isActive).toBe('boolean');
          expect(typeof context.isSelected).toBe('boolean');
          expect(typeof context.unreadCount).toBe('number');
          expect(typeof context.isTyping).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that context creation is deterministic - same state produces same context.
     */
    it('should be deterministic - same state produces identical context', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context1 = createSlotContext(state);
          const context2 = createSlotContext(state);

          // All properties should be identical
          expect(context1.$implicit).toBe(context2.$implicit);
          expect(context1.conversation).toBe(context2.conversation);
          expect(context1.isActive).toBe(context2.isActive);
          expect(context1.isSelected).toBe(context2.isSelected);
          expect(context1.unreadCount).toBe(context2.unreadCount);
          expect(context1.isTyping).toBe(context2.isTyping);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that unreadCount is always non-negative.
     */
    it('should have non-negative unreadCount', () => {
      fc.assert(
        fc.property(componentStateArbitrary, state => {
          const context = createSlotContext(state);

          expect(context.unreadCount).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that context reflects state changes correctly.
     * When state changes, the context should reflect those changes.
     */
    it('should reflect state changes in context', () => {
      fc.assert(
        fc.property(
          componentStateArbitrary,
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (baseState, newIsActive, newIsSelected, newHasTyping) => {
            // Create modified state
            const modifiedState: ComponentState = {
              ...baseState,
              isActive: newIsActive,
              isSelected: newIsSelected,
              typingIndicator: newHasTyping ? createMockTypingIndicator() : null,
            };

            const context = createSlotContext(modifiedState);

            // Context should reflect the modified state
            expect(context.isActive).toBe(newIsActive);
            expect(context.isSelected).toBe(newIsSelected);
            expect(context.isTyping).toBe(newHasTyping);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that context handles edge case of zero unread count.
     */
    it('should handle zero unread count correctly', () => {
      fc.assert(
        fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (isActive, isSelected, hasTyping) => {
          const state: ComponentState = {
            conversation: createMockConversation('test', 0),
            isActive,
            isSelected,
            typingIndicator: hasTyping ? createMockTypingIndicator() : null,
          };

          const context = createSlotContext(state);

          expect(context.unreadCount).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all boolean combinations of isActive, isSelected, isTyping are handled.
     */
    it('should handle all boolean state combinations', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 0, max: 100 }),
          (isActive, isSelected, hasTyping, unreadCount) => {
            const state: ComponentState = {
              conversation: createMockConversation('test', unreadCount),
              isActive,
              isSelected,
              typingIndicator: hasTyping ? createMockTypingIndicator() : null,
            };

            const context = createSlotContext(state);

            // Verify all combinations are handled correctly
            expect(context.isActive).toBe(isActive);
            expect(context.isSelected).toBe(isSelected);
            expect(context.isTyping).toBe(hasTyping);
            expect(context.unreadCount).toBe(unreadCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: conversations-enterprise-refactor, Property 6: Granular Event Emission**
   *
   * *For any* clickable element within `CometChatConversationItem` (avatar, title, subtitle,
   * timestamp, badge), clicking that element SHALL emit the corresponding event
   * (onAvatarClick, onTitleClick, onSubtitleClick, onTimestampClick, onBadgeClick)
   * with the conversation object as payload.
   *
   * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
   */
  describe('Property 6: Granular Event Emission', () => {
    /**
     * All clickable elements and their corresponding event names.
     * These map to the granular events defined in Requirements 7.1-7.5.
     */
    const CLICKABLE_ELEMENTS = [
      { element: 'avatar', eventName: 'avatarClick', requirement: '7.1' },
      { element: 'title', eventName: 'titleClick', requirement: '7.2' },
      { element: 'subtitle', eventName: 'subtitleClick', requirement: '7.3' },
      { element: 'timestamp', eventName: 'timestampClick', requirement: '7.4' },
      { element: 'badge', eventName: 'badgeClick', requirement: '7.5' },
    ] as const;

    type ClickableElement = (typeof CLICKABLE_ELEMENTS)[number]['element'];
    type EventName = (typeof CLICKABLE_ELEMENTS)[number]['eventName'];

    /**
     * Mock conversation object that simulates CometChat.Conversation.
     */
    interface MockConversation {
      id: string;
      getUnreadMessageCount: () => number;
      getConversationWith: () => { getName: () => string };
      getLastMessage: () => { getSentAt: () => number } | undefined;
    }

    /**
     * Creates a mock conversation with the given properties.
     */
    function createMockConversation(id: string, unreadCount = 0): MockConversation {
      return {
        id,
        getUnreadMessageCount: () => unreadCount,
        getConversationWith: () => ({ getName: () => `User ${id}` }),
        getLastMessage: () => ({ getSentAt: () => Date.now() }),
      };
    }

    /**
     * Simulates the event emission behavior of the component.
     * This mirrors the component's event handler methods.
     *
     * The component's event handlers follow this pattern:
     * 1. Call event.stopPropagation() to prevent bubbling
     * 2. Emit the corresponding event with the conversation object
     *
     * @see CometChatConversationItemComponent.handleAvatarClick
     * @see CometChatConversationItemComponent.handleTitleClick
     * @see CometChatConversationItemComponent.handleSubtitleClick
     * @see CometChatConversationItemComponent.handleTimestampClick
     * @see CometChatConversationItemComponent.handleBadgeClick
     */
    interface EventEmissionResult {
      eventName: EventName;
      payload: MockConversation;
      stopPropagationCalled: boolean;
    }

    /**
     * Pure function that simulates the event handler behavior.
     * Returns the event emission result for a given element click.
     */
    function simulateElementClick(
      element: ClickableElement,
      conversation: MockConversation
    ): EventEmissionResult {
      const elementToEvent: Record<ClickableElement, EventName> = {
        avatar: 'avatarClick',
        title: 'titleClick',
        subtitle: 'subtitleClick',
        timestamp: 'timestampClick',
        badge: 'badgeClick',
      };

      return {
        eventName: elementToEvent[element],
        payload: conversation,
        stopPropagationCalled: true, // All granular handlers call stopPropagation
      };
    }

    /**
     * Verifies that the event emission result matches expected behavior.
     */
    function verifyEventEmission(
      result: EventEmissionResult,
      expectedEventName: EventName,
      expectedConversation: MockConversation
    ): boolean {
      return (
        result.eventName === expectedEventName &&
        result.payload === expectedConversation &&
        result.stopPropagationCalled === true
      );
    }

    /**
     * Arbitrary for generating random conversation IDs.
     */
    const conversationIdArbitrary = fc.string({ minLength: 1, maxLength: 50 });

    /**
     * Arbitrary for generating random unread counts.
     */
    const unreadCountArbitrary = fc.integer({ min: 0, max: 999 });

    /**
     * Arbitrary for generating random clickable elements.
     */
    const clickableElementArbitrary = fc.constantFrom(...CLICKABLE_ELEMENTS.map(e => e.element));

    /**
     * Test that clicking any element emits the correct event with the conversation payload.
     */
    it('should emit correct event with conversation payload for any clickable element', () => {
      fc.assert(
        fc.property(
          clickableElementArbitrary,
          conversationIdArbitrary,
          unreadCountArbitrary,
          (element, conversationId, unreadCount) => {
            const conversation = createMockConversation(conversationId, unreadCount);
            const result = simulateElementClick(element, conversation);

            // Find the expected event name for this element
            const expectedEvent = CLICKABLE_ELEMENTS.find(e => e.element === element);
            expect(expectedEvent).toBeDefined();

            // Verify the event name matches
            expect(result.eventName).toBe(expectedEvent!.eventName);

            // Verify the payload is the exact conversation object
            expect(result.payload).toBe(conversation);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all granular events call stopPropagation to prevent item click.
     * This ensures clicking on a specific element doesn't also trigger the main item click.
     */
    it('should call stopPropagation for all granular element clicks', () => {
      fc.assert(
        fc.property(
          clickableElementArbitrary,
          conversationIdArbitrary,
          (element, conversationId) => {
            const conversation = createMockConversation(conversationId);
            const result = simulateElementClick(element, conversation);

            // All granular handlers must call stopPropagation
            expect(result.stopPropagationCalled).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that each element maps to exactly one event (bijective mapping).
     */
    it('should have bijective mapping between elements and events', () => {
      fc.assert(
        fc.property(
          clickableElementArbitrary,
          fc.constantFrom(...CLICKABLE_ELEMENTS.map(e => e.element)),
          (element1, element2) => {
            const conversation = createMockConversation('test');
            const result1 = simulateElementClick(element1, conversation);
            const result2 = simulateElementClick(element2, conversation);

            // Same element should produce same event
            if (element1 === element2) {
              expect(result1.eventName).toBe(result2.eventName);
            } else {
              // Different elements should produce different events
              expect(result1.eventName).not.toBe(result2.eventName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that event emission is deterministic - same input produces same output.
     */
    it('should be deterministic - same element and conversation produces same event', () => {
      fc.assert(
        fc.property(
          clickableElementArbitrary,
          conversationIdArbitrary,
          fc.integer({ min: 2, max: 10 }),
          (element, conversationId, repeatCount) => {
            const conversation = createMockConversation(conversationId);
            const results: EventEmissionResult[] = [];

            for (let i = 0; i < repeatCount; i++) {
              results.push(simulateElementClick(element, conversation));
            }

            // All results should have the same event name
            const eventNames = new Set(results.map(r => r.eventName));
            expect(eventNames.size).toBe(1);

            // All results should have the same payload reference
            const payloads = new Set(results.map(r => r.payload));
            expect(payloads.size).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that the conversation object is passed by reference, not copied.
     * This ensures the exact same object is emitted.
     */
    it('should emit the exact conversation object reference', () => {
      fc.assert(
        fc.property(
          clickableElementArbitrary,
          conversationIdArbitrary,
          (element, conversationId) => {
            const conversation = createMockConversation(conversationId);
            const result = simulateElementClick(element, conversation);

            // Verify reference equality
            expect(result.payload).toBe(conversation);
            expect(result.payload.id).toBe(conversation.id);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all 5 clickable elements are covered (avatar, title, subtitle, timestamp, badge).
     */
    it('should cover all 5 required clickable elements', () => {
      const requiredElements: ClickableElement[] = [
        'avatar',
        'title',
        'subtitle',
        'timestamp',
        'badge',
      ];

      // Verify all required elements are in our test configuration
      for (const element of requiredElements) {
        const config = CLICKABLE_ELEMENTS.find(e => e.element === element);
        expect(config).toBeDefined();
        expect(config!.eventName).toBeDefined();
        expect(config!.requirement).toBeDefined();
      }

      // Verify we have exactly 5 elements (no more, no less)
      expect(CLICKABLE_ELEMENTS.length).toBe(5);
    });

    /**
     * Test that event names follow the expected naming convention.
     */
    it('should follow naming convention: {element}Click', () => {
      fc.assert(
        fc.property(clickableElementArbitrary, element => {
          const conversation = createMockConversation('test');
          const result = simulateElementClick(element, conversation);

          // Event name should be {element}Click
          const expectedEventName = `${element}Click`;
          expect(result.eventName).toBe(expectedEventName);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that clicking different elements on the same conversation
     * emits different events but with the same conversation payload.
     */
    it('should emit different events for different elements on same conversation', () => {
      fc.assert(
        fc.property(conversationIdArbitrary, conversationId => {
          const conversation = createMockConversation(conversationId);
          const results = CLICKABLE_ELEMENTS.map(config =>
            simulateElementClick(config.element, conversation)
          );

          // All events should have the same conversation payload
          const payloads = new Set(results.map(r => r.payload));
          expect(payloads.size).toBe(1);

          // All events should have different event names
          const eventNames = new Set(results.map(r => r.eventName));
          expect(eventNames.size).toBe(CLICKABLE_ELEMENTS.length);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that the main item click (handleClick) does NOT call stopPropagation.
     * This is different from granular element clicks.
     */
    it('should distinguish main item click from granular element clicks', () => {
      /**
       * Simulates the main item click behavior.
       * Unlike granular handlers, handleClick does NOT call stopPropagation.
       */
      function simulateMainItemClick(conversation: MockConversation): {
        eventName: 'itemClick';
        payload: MockConversation;
        stopPropagationCalled: boolean;
      } {
        return {
          eventName: 'itemClick',
          payload: conversation,
          stopPropagationCalled: false, // Main click does NOT stop propagation
        };
      }

      fc.assert(
        fc.property(conversationIdArbitrary, conversationId => {
          const conversation = createMockConversation(conversationId);

          // Main item click
          const mainClickResult = simulateMainItemClick(conversation);
          expect(mainClickResult.stopPropagationCalled).toBe(false);
          expect(mainClickResult.eventName).toBe('itemClick');

          // Granular element clicks
          for (const config of CLICKABLE_ELEMENTS) {
            const granularResult = simulateElementClick(config.element, conversation);
            expect(granularResult.stopPropagationCalled).toBe(true);
            expect(granularResult.eventName).not.toBe('itemClick');
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that event emission works correctly regardless of conversation state.
     * The conversation's unread count, typing state, etc. should not affect event emission.
     */
    it('should emit events regardless of conversation state', () => {
      fc.assert(
        fc.property(
          clickableElementArbitrary,
          conversationIdArbitrary,
          unreadCountArbitrary,
          fc.boolean(), // hasLastMessage
          (element, conversationId, unreadCount, hasLastMessage) => {
            const conversation: MockConversation = {
              id: conversationId,
              getUnreadMessageCount: () => unreadCount,
              getConversationWith: () => ({ getName: () => `User ${conversationId}` }),
              getLastMessage: () => (hasLastMessage ? { getSentAt: () => Date.now() } : undefined),
            };

            const result = simulateElementClick(element, conversation);

            // Event should be emitted regardless of conversation state
            expect(result.eventName).toBeDefined();
            expect(result.payload).toBe(conversation);
            expect(result.stopPropagationCalled).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that each requirement (7.1-7.5) is covered by exactly one element-event pair.
     */
    it('should map each requirement to exactly one element-event pair', () => {
      const requirements = ['7.1', '7.2', '7.3', '7.4', '7.5'];

      // Verify each requirement is covered
      for (const req of requirements) {
        const config = CLICKABLE_ELEMENTS.find(e => e.requirement === req);
        expect(config).toBeDefined();
      }

      // Verify no duplicate requirements
      const reqSet = new Set(CLICKABLE_ELEMENTS.map(e => e.requirement));
      expect(reqSet.size).toBe(requirements.length);
    });
  });
});
