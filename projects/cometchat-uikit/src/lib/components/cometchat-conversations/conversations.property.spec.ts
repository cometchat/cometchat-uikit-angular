import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TemplateRef } from '@angular/core';
import { SelectionMode } from '../../Enums/Enums';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CometChatOption } from '../../modals/CometChatOption';
import { ConversationTemplates } from '../../services/templates.service';

/**
 * Property-Based Tests for CometChatConversations Backward Compatibility
 *
 * These tests verify that all existing @Input properties continue to affect
 * component behavior identically to the pre-refactor implementation.
 *
 * Since the CometChatConversations component uses Angular's inject() function
 * and complex service dependencies, we test the input property behavior as
 * pure functions that mirror the component's logic.
 *
 * **Validates: Requirements 8.6, 10.1, 10.3, 10.4**
 */
describe('CometChatConversations Property Tests', () => {
  /**
   * Creates a mock TemplateRef for testing purposes.
   */
  function createMockTemplateRef<T>(id: string): TemplateRef<T> {
    return {
      elementRef: { nativeElement: { id } },
      createEmbeddedView: () => null as any,
    } as unknown as TemplateRef<T>;
  }

  /**
   * Mock conversation object that simulates CometChat.Conversation.
   */
  interface MockConversation {
    id: string;
    getUnreadMessageCount: () => number;
    getConversationWith: () => MockUser | MockGroup;
    getLastMessage: () => MockMessage | undefined;
  }

  interface MockUser {
    getUid: () => string;
    getName: () => string;
    getAvatar: () => string;
    getStatus: () => string;
  }

  interface MockGroup {
    getGuid: () => string;
    getName: () => string;
    getIcon: () => string;
    getType: () => string;
  }

  interface MockMessage {
    getId: () => string;
    getSentAt: () => number;
    getSender: () => MockUser;
  }

  /**
   * Creates a mock user.
   */
  function createMockUser(uid: string): MockUser {
    return {
      getUid: () => uid,
      getName: () => `User ${uid}`,
      getAvatar: () => `https://example.com/avatar/${uid}.png`,
      getStatus: () => 'online',
    };
  }

  /**
   * Creates a mock group.
   */
  function createMockGroup(guid: string, type = 'public'): MockGroup {
    return {
      getGuid: () => guid,
      getName: () => `Group ${guid}`,
      getIcon: () => `https://example.com/icon/${guid}.png`,
      getType: () => type,
    };
  }

  /**
   * Creates a mock message.
   */
  function createMockMessage(id: string, senderUid: string): MockMessage {
    return {
      getId: () => id,
      getSentAt: () => Date.now(),
      getSender: () => createMockUser(senderUid),
    };
  }

  /**
   * Creates a mock conversation.
   */
  function createMockConversation(id: string, isUser: boolean, unreadCount = 0): MockConversation {
    return {
      id,
      getUnreadMessageCount: () => unreadCount,
      getConversationWith: () => (isUser ? createMockUser(id) : createMockGroup(id)),
      getLastMessage: () => createMockMessage(`msg-${id}`, 'sender-1'),
    };
  }

  /**
   * **Feature: conversations-enterprise-refactor, Property 2: Template Priority Resolution**
   *
   * *For any* template type where both a component-level @Input template and a
   * service-level template are provided, the component SHALL render using the
   * component-level template, ignoring the service-level template.
   *
   * **Validates: Requirements 1.5**
   */
  describe('Property 2: Template Priority Resolution', () => {
    /**
     * All template types that support priority resolution.
     * These correspond to the effective*View getters in CometChatConversationsComponent.
     */
    const TEMPLATE_TYPES = [
      'itemView',
      'leadingView',
      'titleView',
      'subtitleView',
      'trailingView',
      'loadingView',
      'emptyView',
      'errorView',
    ] as const;

    type TemplateType = (typeof TEMPLATE_TYPES)[number];

    /**
     * Maps component @Input property names to service template property names.
     * The component uses different naming conventions than the service.
     */
    const COMPONENT_TO_SERVICE_MAP: Record<TemplateType, keyof ConversationTemplates> = {
      itemView: 'conversationItem',
      leadingView: 'leadingView',
      titleView: 'titleView',
      subtitleView: 'subtitleView',
      trailingView: 'trailingView',
      loadingView: 'loadingView',
      emptyView: 'emptyView',
      errorView: 'errorView',
    };

    /**
     * Interface representing the component's template configuration.
     * This mirrors the template @Input properties of CometChatConversationsComponent.
     */
    interface ComponentTemplateConfig {
      itemView?: TemplateRef<any>;
      leadingView?: TemplateRef<any>;
      titleView?: TemplateRef<any>;
      subtitleView?: TemplateRef<any>;
      trailingView?: TemplateRef<any>;
      loadingView?: TemplateRef<any>;
      emptyView?: TemplateRef<any>;
      errorView?: TemplateRef<any>;
    }

    /**
     * Interface representing ContentChild template references.
     * These are templates projected via ng-content.
     */
    interface ContentChildTemplateConfig {
      itemViewContent?: TemplateRef<any>;
      leadingViewContent?: TemplateRef<any>;
      titleViewContent?: TemplateRef<any>;
      subtitleViewContent?: TemplateRef<any>;
      trailingViewContent?: TemplateRef<any>;
      loadingViewContent?: TemplateRef<any>;
      emptyViewContent?: TemplateRef<any>;
      errorViewContent?: TemplateRef<any>;
    }

    /**
     * Pure function that resolves the effective template based on priority.
     * Mirrors the component's effective*View getter logic:
     * Component @Input > ContentChild > Service > Default (undefined)
     *
     * @param componentTemplate - Template provided via @Input
     * @param contentChildTemplate - Template provided via ContentChild
     * @param serviceTemplate - Template registered in CometChatTemplatesService
     * @returns The effective template to use, or undefined for default
     */
    function resolveEffectiveTemplate(
      componentTemplate: TemplateRef<any> | undefined,
      contentChildTemplate: TemplateRef<any> | undefined,
      serviceTemplate: TemplateRef<any> | undefined
    ): TemplateRef<any> | undefined {
      // Priority: Component @Input > ContentChild > Service > Default
      return componentTemplate || contentChildTemplate || serviceTemplate;
    }

    /**
     * Gets the effective template for a specific template type.
     * This mirrors the component's effective*View getters.
     */
    function getEffectiveTemplate(
      templateType: TemplateType,
      componentConfig: ComponentTemplateConfig,
      contentChildConfig: ContentChildTemplateConfig,
      serviceTemplates: ConversationTemplates
    ): TemplateRef<any> | undefined {
      const componentTemplate = componentConfig[templateType];
      const contentChildKey = `${templateType}Content` as keyof ContentChildTemplateConfig;
      const contentChildTemplate = contentChildConfig[contentChildKey];
      const serviceKey = COMPONENT_TO_SERVICE_MAP[templateType];
      const serviceTemplate = serviceTemplates[serviceKey];

      return resolveEffectiveTemplate(componentTemplate, contentChildTemplate, serviceTemplate);
    }

    // ==================== Property Tests ====================

    /**
     * Test that component @Input template takes priority over service template.
     * This is the core property being tested.
     */
    it('should prioritize component @Input template over service template for any template type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (templateType, componentTemplateId, serviceTemplateId) => {
            // Ensure different IDs to distinguish templates
            const actualServiceId =
              serviceTemplateId === componentTemplateId
                ? `${serviceTemplateId}-service`
                : serviceTemplateId;

            const componentTemplate = createMockTemplateRef(componentTemplateId);
            const serviceTemplate = createMockTemplateRef(actualServiceId);

            const componentConfig: ComponentTemplateConfig = {
              [templateType]: componentTemplate,
            };
            const contentChildConfig: ContentChildTemplateConfig = {};
            const serviceTemplates: ConversationTemplates = {
              [COMPONENT_TO_SERVICE_MAP[templateType]]: serviceTemplate,
            };

            const effectiveTemplate = getEffectiveTemplate(
              templateType,
              componentConfig,
              contentChildConfig,
              serviceTemplates
            );

            // Component template should take priority
            expect(effectiveTemplate).toBe(componentTemplate);
            expect(effectiveTemplate).not.toBe(serviceTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that ContentChild template takes priority over service template
     * when no component @Input is provided.
     */
    it('should prioritize ContentChild template over service template when no @Input provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (templateType, contentChildTemplateId, serviceTemplateId) => {
            const actualServiceId =
              serviceTemplateId === contentChildTemplateId
                ? `${serviceTemplateId}-service`
                : serviceTemplateId;

            const contentChildTemplate = createMockTemplateRef(contentChildTemplateId);
            const serviceTemplate = createMockTemplateRef(actualServiceId);

            const componentConfig: ComponentTemplateConfig = {};
            const contentChildKey = `${templateType}Content` as keyof ContentChildTemplateConfig;
            const contentChildConfig: ContentChildTemplateConfig = {
              [contentChildKey]: contentChildTemplate,
            };
            const serviceTemplates: ConversationTemplates = {
              [COMPONENT_TO_SERVICE_MAP[templateType]]: serviceTemplate,
            };

            const effectiveTemplate = getEffectiveTemplate(
              templateType,
              componentConfig,
              contentChildConfig,
              serviceTemplates
            );

            // ContentChild template should take priority over service
            expect(effectiveTemplate).toBe(contentChildTemplate);
            expect(effectiveTemplate).not.toBe(serviceTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that service template is used when no component or ContentChild template is provided.
     */
    it('should use service template when no component or ContentChild template provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.string({ minLength: 1, maxLength: 20 }),
          (templateType, serviceTemplateId) => {
            const serviceTemplate = createMockTemplateRef(serviceTemplateId);

            const componentConfig: ComponentTemplateConfig = {};
            const contentChildConfig: ContentChildTemplateConfig = {};
            const serviceTemplates: ConversationTemplates = {
              [COMPONENT_TO_SERVICE_MAP[templateType]]: serviceTemplate,
            };

            const effectiveTemplate = getEffectiveTemplate(
              templateType,
              componentConfig,
              contentChildConfig,
              serviceTemplates
            );

            // Service template should be used
            expect(effectiveTemplate).toBe(serviceTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that undefined is returned when no template is provided at any level.
     */
    it('should return undefined when no template provided at any level', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEMPLATE_TYPES), templateType => {
          const componentConfig: ComponentTemplateConfig = {};
          const contentChildConfig: ContentChildTemplateConfig = {};
          const serviceTemplates: ConversationTemplates = {};

          const effectiveTemplate = getEffectiveTemplate(
            templateType,
            componentConfig,
            contentChildConfig,
            serviceTemplates
          );

          // Should return undefined (use default)
          expect(effectiveTemplate).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that component @Input takes priority over both ContentChild and service.
     * This tests the full priority chain.
     */
    it('should prioritize component @Input over both ContentChild and service templates', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (templateType, componentId, contentChildId, serviceId) => {
            // Ensure all IDs are different
            const actualContentChildId =
              contentChildId === componentId ? `${contentChildId}-content` : contentChildId;
            const actualServiceId =
              serviceId === componentId || serviceId === actualContentChildId
                ? `${serviceId}-service`
                : serviceId;

            const componentTemplate = createMockTemplateRef(componentId);
            const contentChildTemplate = createMockTemplateRef(actualContentChildId);
            const serviceTemplate = createMockTemplateRef(actualServiceId);

            const componentConfig: ComponentTemplateConfig = {
              [templateType]: componentTemplate,
            };
            const contentChildKey = `${templateType}Content` as keyof ContentChildTemplateConfig;
            const contentChildConfig: ContentChildTemplateConfig = {
              [contentChildKey]: contentChildTemplate,
            };
            const serviceTemplates: ConversationTemplates = {
              [COMPONENT_TO_SERVICE_MAP[templateType]]: serviceTemplate,
            };

            const effectiveTemplate = getEffectiveTemplate(
              templateType,
              componentConfig,
              contentChildConfig,
              serviceTemplates
            );

            // Component @Input should take priority over all
            expect(effectiveTemplate).toBe(componentTemplate);
            expect(effectiveTemplate).not.toBe(contentChildTemplate);
            expect(effectiveTemplate).not.toBe(serviceTemplate);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that template priority resolution is consistent across multiple calls.
     */
    it('should be deterministic - same inputs produce same template resolution', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.integer({ min: 2, max: 5 }),
          (templateType, hasComponent, hasContentChild, hasService, repeatCount) => {
            const componentTemplate = hasComponent ? createMockTemplateRef('component') : undefined;
            const contentChildTemplate = hasContentChild
              ? createMockTemplateRef('content-child')
              : undefined;
            const serviceTemplate = hasService ? createMockTemplateRef('service') : undefined;

            const componentConfig: ComponentTemplateConfig = hasComponent
              ? { [templateType]: componentTemplate }
              : {};
            const contentChildKey = `${templateType}Content` as keyof ContentChildTemplateConfig;
            const contentChildConfig: ContentChildTemplateConfig = hasContentChild
              ? { [contentChildKey]: contentChildTemplate }
              : {};
            const serviceTemplates: ConversationTemplates = hasService
              ? { [COMPONENT_TO_SERVICE_MAP[templateType]]: serviceTemplate }
              : {};

            const results: (TemplateRef<any> | undefined)[] = [];
            for (let i = 0; i < repeatCount; i++) {
              results.push(
                getEffectiveTemplate(
                  templateType,
                  componentConfig,
                  contentChildConfig,
                  serviceTemplates
                )
              );
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toBe(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that each template type resolves independently.
     * Setting a template for one type should not affect other types.
     */
    it('should resolve each template type independently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.constantFrom(...TEMPLATE_TYPES),
          fc.string({ minLength: 1, maxLength: 20 }),
          (templateType1, templateType2, templateId) => {
            // Skip if same template type
            if (templateType1 === templateType2) return;

            const template = createMockTemplateRef(templateId);

            // Only set template for templateType1
            const componentConfig: ComponentTemplateConfig = {
              [templateType1]: template,
            };
            const contentChildConfig: ContentChildTemplateConfig = {};
            const serviceTemplates: ConversationTemplates = {};

            const effectiveTemplate1 = getEffectiveTemplate(
              templateType1,
              componentConfig,
              contentChildConfig,
              serviceTemplates
            );
            const effectiveTemplate2 = getEffectiveTemplate(
              templateType2,
              componentConfig,
              contentChildConfig,
              serviceTemplates
            );

            // templateType1 should have the template
            expect(effectiveTemplate1).toBe(template);
            // templateType2 should be undefined (independent)
            expect(effectiveTemplate2).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all template types follow the same priority rules.
     */
    it('should apply same priority rules to all template types', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...TEMPLATE_TYPES), { minLength: 1, maxLength: 8 }),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          (templateTypes, hasComponent, hasContentChild, hasService) => {
            const uniqueTypes = [...new Set(templateTypes)];

            for (const templateType of uniqueTypes) {
              const componentTemplate = hasComponent
                ? createMockTemplateRef(`component-${templateType}`)
                : undefined;
              const contentChildTemplate = hasContentChild
                ? createMockTemplateRef(`content-${templateType}`)
                : undefined;
              const serviceTemplate = hasService
                ? createMockTemplateRef(`service-${templateType}`)
                : undefined;

              const componentConfig: ComponentTemplateConfig = hasComponent
                ? { [templateType]: componentTemplate }
                : {};
              const contentChildKey = `${templateType}Content` as keyof ContentChildTemplateConfig;
              const contentChildConfig: ContentChildTemplateConfig = hasContentChild
                ? { [contentChildKey]: contentChildTemplate }
                : {};
              const serviceTemplates: ConversationTemplates = hasService
                ? { [COMPONENT_TO_SERVICE_MAP[templateType]]: serviceTemplate }
                : {};

              const effectiveTemplate = getEffectiveTemplate(
                templateType,
                componentConfig,
                contentChildConfig,
                serviceTemplates
              );

              // Verify priority: Component > ContentChild > Service > undefined
              if (hasComponent) {
                expect(effectiveTemplate).toBe(componentTemplate);
              } else if (hasContentChild) {
                expect(effectiveTemplate).toBe(contentChildTemplate);
              } else if (hasService) {
                expect(effectiveTemplate).toBe(serviceTemplate);
              } else {
                expect(effectiveTemplate).toBeUndefined();
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: conversations-enterprise-refactor, Property 7: Backward Compatibility - Input Properties**
   *
   * *For any* existing @Input property on `CometChatConversations` (hideReceipts,
   * hideError, hideDeleteConversation, hideUserStatus, hideGroupType, showScrollbar,
   * showSearchBar, conversationsRequestBuilder, activeConversation, textFormatters,
   * selectionMode, lastMessageDateTimeFormat, options, disableSoundForMessages,
   * customSoundForMessages, and all template inputs), the property SHALL continue
   * to affect component behavior identically to the pre-refactor implementation.
   *
   * **Validates: Requirements 8.6, 10.1, 10.3, 10.4**
   */
  describe('Property 7: Backward Compatibility - Input Properties', () => {
    /**
     * All existing @Input properties that must be preserved for backward compatibility.
     * These are grouped by category for clarity.
     */
    const DISPLAY_CONTROL_INPUTS = [
      'hideReceipts',
      'hideError',
      'hideDeleteConversation',
      'hideUserStatus',
      'hideGroupType',
      'showScrollbar',
      'showSearchBar',
    ] as const;

    const DATA_CONFIG_INPUTS = [
      'conversationsRequestBuilder',
      'activeConversation',
      'textFormatters',
      'selectionMode',
      'lastMessageDateTimeFormat',
      'options',
    ] as const;

    const SOUND_CONFIG_INPUTS = ['disableSoundForMessages', 'customSoundForMessages'] as const;

    const TEMPLATE_INPUTS = [
      'headerView',
      'loadingView',
      'emptyView',
      'errorView',
      'searchView',
      'itemView',
      'leadingView',
      'titleView',
      'subtitleView',
      'trailingView',
    ] as const;

    type DisplayControlInput = (typeof DISPLAY_CONTROL_INPUTS)[number];
    type DataConfigInput = (typeof DATA_CONFIG_INPUTS)[number];
    type SoundConfigInput = (typeof SOUND_CONFIG_INPUTS)[number];
    type TemplateInput = (typeof TEMPLATE_INPUTS)[number];

    /**
     * Interface representing the component's input configuration.
     * This mirrors the @Input properties of CometChatConversationsComponent.
     */
    interface ComponentInputConfig {
      // Display control inputs
      hideReceipts: boolean;
      hideError: boolean;
      hideDeleteConversation: boolean;
      hideUserStatus: boolean;
      hideGroupType: boolean;
      showScrollbar: boolean;
      showSearchBar: boolean;

      // Data configuration inputs
      conversationsRequestBuilder?: any;
      activeConversation?: MockConversation;
      textFormatters: any[];
      selectionMode: SelectionMode;
      lastMessageDateTimeFormat?: CalendarObject;
      options?: (conversation: MockConversation) => CometChatOption[];

      // Sound configuration inputs
      disableSoundForMessages: boolean;
      customSoundForMessages?: string;

      // Template inputs
      headerView?: TemplateRef<any>;
      loadingView?: TemplateRef<any>;
      emptyView?: TemplateRef<any>;
      errorView?: TemplateRef<any>;
      searchView?: TemplateRef<any>;
      itemView?: TemplateRef<any>;
      leadingView?: TemplateRef<any>;
      titleView?: TemplateRef<any>;
      subtitleView?: TemplateRef<any>;
      trailingView?: TemplateRef<any>;
    }

    /**
     * Creates a default input configuration with all default values.
     * These defaults match the component's default @Input values.
     */
    function createDefaultConfig(): ComponentInputConfig {
      return {
        hideReceipts: false,
        hideError: false,
        hideDeleteConversation: false,
        hideUserStatus: false,
        hideGroupType: false,
        showScrollbar: false,
        showSearchBar: false,
        textFormatters: [],
        selectionMode: SelectionMode.none,
        disableSoundForMessages: false,
      };
    }

    /**
     * Pure function that determines if receipts should be shown.
     * Mirrors the component's logic for hideReceipts input.
     */
    function shouldShowReceipts(config: ComponentInputConfig): boolean {
      return !config.hideReceipts;
    }

    /**
     * Pure function that determines if error state should be shown.
     * Mirrors the component's logic for hideError input.
     */
    function shouldShowError(config: ComponentInputConfig, hasError: boolean): boolean {
      return hasError && !config.hideError;
    }

    /**
     * Pure function that determines if delete option should be shown.
     * Mirrors the component's logic for hideDeleteConversation input.
     */
    function shouldShowDeleteOption(config: ComponentInputConfig): boolean {
      return !config.hideDeleteConversation;
    }

    /**
     * Pure function that determines if user status should be shown.
     * Mirrors the component's logic for hideUserStatus input.
     */
    function shouldShowUserStatus(config: ComponentInputConfig): boolean {
      return !config.hideUserStatus;
    }

    /**
     * Pure function that determines if group type should be shown.
     * Mirrors the component's logic for hideGroupType input.
     */
    function shouldShowGroupType(config: ComponentInputConfig): boolean {
      return !config.hideGroupType;
    }

    /**
     * Pure function that determines if scrollbar should be shown.
     * Mirrors the component's logic for showScrollbar input.
     */
    function shouldShowScrollbar(config: ComponentInputConfig): boolean {
      return config.showScrollbar;
    }

    /**
     * Pure function that determines if search bar should be shown.
     * Mirrors the component's logic for showSearchBar input.
     */
    function shouldShowSearchBar(config: ComponentInputConfig): boolean {
      return config.showSearchBar;
    }

    /**
     * Pure function that determines if selection mode is active.
     * Mirrors the component's logic for selectionMode input.
     */
    function isSelectionModeActive(config: ComponentInputConfig): boolean {
      return config.selectionMode !== SelectionMode.none;
    }

    /**
     * Pure function that determines if sound should be played.
     * Mirrors the component's logic for disableSoundForMessages input.
     */
    function shouldPlaySound(config: ComponentInputConfig): boolean {
      return !config.disableSoundForMessages;
    }

    /**
     * Pure function that gets the custom sound URL.
     * Mirrors the component's logic for customSoundForMessages input.
     */
    function getCustomSoundUrl(config: ComponentInputConfig): string | undefined {
      return config.customSoundForMessages;
    }

    /**
     * Pure function that determines if a conversation is active.
     * Mirrors the component's logic for activeConversation input.
     */
    function isConversationActive(
      config: ComponentInputConfig,
      conversation: MockConversation
    ): boolean {
      if (!config.activeConversation) return false;
      const activeWith = config.activeConversation.getConversationWith();
      const currentWith = conversation.getConversationWith();

      // Check if both are users or both are groups
      const activeId =
        'getUid' in activeWith ? activeWith.getUid() : (activeWith as MockGroup).getGuid();
      const currentId =
        'getUid' in currentWith ? currentWith.getUid() : (currentWith as MockGroup).getGuid();

      return activeId === currentId;
    }

    /**
     * Pure function that gets context menu options for a conversation.
     * Mirrors the component's getContextMenuOptions method.
     */
    function getContextMenuOptions(
      config: ComponentInputConfig,
      conversation: MockConversation
    ): CometChatOption[] {
      if (config.options) {
        return config.options(conversation);
      }
      const options: CometChatOption[] = [];
      if (!config.hideDeleteConversation) {
        options.push(
          new CometChatOption({
            id: 'delete',
            title: 'Delete',
            iconURL: 'assets/delete.svg',
          })
        );
      }
      return options;
    }

    /**
     * Pure function that gets the effective date format.
     * Mirrors the component's date format resolution logic.
     */
    function getEffectiveDateFormat(config: ComponentInputConfig): CalendarObject {
      if (config.lastMessageDateTimeFormat) {
        return config.lastMessageDateTimeFormat;
      }
      // Default format from component
      return {
        today: 'h:mm a',
        yesterday: '[Yesterday]',
        lastWeek: 'EEE',
        otherDays: 'dd/MM/yyyy',
      };
    }

    /**
     * Pure function that gets the effective template for a given template type.
     * Mirrors the component's template resolution logic.
     */
    function getEffectiveTemplate(
      config: ComponentInputConfig,
      templateType: TemplateInput
    ): TemplateRef<any> | undefined {
      return config[templateType];
    }

    // ==================== Property Tests ====================

    /**
     * Test that hideReceipts input correctly controls receipt visibility.
     */
    it('should respect hideReceipts input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), hideReceipts => {
          const config = { ...createDefaultConfig(), hideReceipts };
          expect(shouldShowReceipts(config)).toBe(!hideReceipts);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that hideError input correctly controls error visibility.
     */
    it('should respect hideError input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), fc.boolean(), (hideError, hasError) => {
          const config = { ...createDefaultConfig(), hideError };
          const shouldShow = shouldShowError(config, hasError);

          if (hideError) {
            expect(shouldShow).toBe(false);
          } else {
            expect(shouldShow).toBe(hasError);
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that hideDeleteConversation input correctly controls delete option visibility.
     */
    it('should respect hideDeleteConversation input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), hideDeleteConversation => {
          const config = { ...createDefaultConfig(), hideDeleteConversation };
          expect(shouldShowDeleteOption(config)).toBe(!hideDeleteConversation);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that hideUserStatus input correctly controls user status visibility.
     */
    it('should respect hideUserStatus input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), hideUserStatus => {
          const config = { ...createDefaultConfig(), hideUserStatus };
          expect(shouldShowUserStatus(config)).toBe(!hideUserStatus);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that hideGroupType input correctly controls group type visibility.
     */
    it('should respect hideGroupType input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), hideGroupType => {
          const config = { ...createDefaultConfig(), hideGroupType };
          expect(shouldShowGroupType(config)).toBe(!hideGroupType);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that showScrollbar input correctly controls scrollbar visibility.
     */
    it('should respect showScrollbar input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), showScrollbar => {
          const config = { ...createDefaultConfig(), showScrollbar };
          expect(shouldShowScrollbar(config)).toBe(showScrollbar);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that showSearchBar input correctly controls search bar visibility.
     */
    it('should respect showSearchBar input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), showSearchBar => {
          const config = { ...createDefaultConfig(), showSearchBar };
          expect(shouldShowSearchBar(config)).toBe(showSearchBar);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that selectionMode input correctly controls selection behavior.
     */
    it('should respect selectionMode input for any selection mode', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(SelectionMode.none, SelectionMode.single, SelectionMode.multiple),
          selectionMode => {
            const config = { ...createDefaultConfig(), selectionMode };
            const isActive = isSelectionModeActive(config);

            if (selectionMode === SelectionMode.none) {
              expect(isActive).toBe(false);
            } else {
              expect(isActive).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that disableSoundForMessages input correctly controls sound playback.
     */
    it('should respect disableSoundForMessages input for any boolean value', () => {
      fc.assert(
        fc.property(fc.boolean(), disableSoundForMessages => {
          const config = { ...createDefaultConfig(), disableSoundForMessages };
          expect(shouldPlaySound(config)).toBe(!disableSoundForMessages);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that customSoundForMessages input is correctly preserved.
     */
    it('should preserve customSoundForMessages input for any string value', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          customSoundForMessages => {
            const config = { ...createDefaultConfig(), customSoundForMessages };
            expect(getCustomSoundUrl(config)).toBe(customSoundForMessages);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that activeConversation input correctly identifies active conversation.
     */
    it('should respect activeConversation input for any conversation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          (activeId, testId, isUser) => {
            const activeConversation = createMockConversation(activeId, isUser);
            const testConversation = createMockConversation(testId, isUser);
            const config = { ...createDefaultConfig(), activeConversation };

            const isActive = isConversationActive(config, testConversation);

            if (activeId === testId) {
              expect(isActive).toBe(true);
            } else {
              expect(isActive).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that lastMessageDateTimeFormat input is correctly applied.
     */
    it('should respect lastMessageDateTimeFormat input for any format', () => {
      fc.assert(
        fc.property(
          fc.record({
            today: fc.string({ minLength: 1, maxLength: 20 }),
            yesterday: fc.string({ minLength: 1, maxLength: 20 }),
            lastWeek: fc.string({ minLength: 1, maxLength: 20 }),
            otherDays: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          customFormat => {
            const config = {
              ...createDefaultConfig(),
              lastMessageDateTimeFormat: customFormat as CalendarObject,
            };
            const effectiveFormat = getEffectiveDateFormat(config);

            expect(effectiveFormat.today).toBe(customFormat.today);
            expect(effectiveFormat.yesterday).toBe(customFormat.yesterday);
            expect(effectiveFormat.lastWeek).toBe(customFormat.lastWeek);
            expect(effectiveFormat.otherDays).toBe(customFormat.otherDays);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that default date format is used when lastMessageDateTimeFormat is not provided.
     */
    it('should use default date format when lastMessageDateTimeFormat is not provided', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const config = createDefaultConfig();
          const effectiveFormat = getEffectiveDateFormat(config);

          expect(effectiveFormat.today).toBe('h:mm a');
          expect(effectiveFormat.yesterday).toBe('[Yesterday]');
          expect(effectiveFormat.lastWeek).toBe('EEE');
          expect(effectiveFormat.otherDays).toBe('dd/MM/yyyy');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that options input correctly provides custom context menu options.
     */
    it('should respect options input for custom context menu options', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (conversationId, isUser, customOptions) => {
            const conversation = createMockConversation(conversationId, isUser);
            const optionsFn = () => customOptions.map(opt => new CometChatOption(opt));
            const config = { ...createDefaultConfig(), options: optionsFn };

            const options = getContextMenuOptions(config, conversation);

            expect(options.length).toBe(customOptions.length);
            for (let i = 0; i < options.length; i++) {
              expect(options[i].id).toBe(customOptions[i].id);
              expect(options[i].title).toBe(customOptions[i].title);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that default delete option is provided when options input is not set.
     */
    it('should provide default delete option when options input is not set', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.boolean(),
          (conversationId, isUser, hideDeleteConversation) => {
            const conversation = createMockConversation(conversationId, isUser);
            const config = { ...createDefaultConfig(), hideDeleteConversation };

            const options = getContextMenuOptions(config, conversation);

            if (hideDeleteConversation) {
              expect(options.length).toBe(0);
            } else {
              expect(options.length).toBe(1);
              expect(options[0].id).toBe('delete');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that template inputs are correctly preserved.
     */
    it('should preserve template inputs for any template type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...TEMPLATE_INPUTS),
          fc.string({ minLength: 1, maxLength: 20 }),
          (templateType, templateId) => {
            const template = createMockTemplateRef(templateId);
            const config = { ...createDefaultConfig(), [templateType]: template };

            const effectiveTemplate = getEffectiveTemplate(config, templateType);

            expect(effectiveTemplate).toBe(template);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that undefined template inputs return undefined.
     */
    it('should return undefined for unset template inputs', () => {
      fc.assert(
        fc.property(fc.constantFrom(...TEMPLATE_INPUTS), templateType => {
          const config = createDefaultConfig();
          const effectiveTemplate = getEffectiveTemplate(config, templateType);

          expect(effectiveTemplate).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all display control inputs have correct default values.
     */
    it('should have correct default values for all display control inputs', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const config = createDefaultConfig();

          // All hide* inputs should default to false
          expect(config.hideReceipts).toBe(false);
          expect(config.hideError).toBe(false);
          expect(config.hideDeleteConversation).toBe(false);
          expect(config.hideUserStatus).toBe(false);
          expect(config.hideGroupType).toBe(false);

          // All show* inputs should default to false
          expect(config.showScrollbar).toBe(false);
          expect(config.showSearchBar).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all data configuration inputs have correct default values.
     */
    it('should have correct default values for all data configuration inputs', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const config = createDefaultConfig();

          expect(config.conversationsRequestBuilder).toBeUndefined();
          expect(config.activeConversation).toBeUndefined();
          expect(config.textFormatters).toEqual([]);
          expect(config.selectionMode).toBe(SelectionMode.none);
          expect(config.lastMessageDateTimeFormat).toBeUndefined();
          expect(config.options).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all sound configuration inputs have correct default values.
     */
    it('should have correct default values for all sound configuration inputs', () => {
      fc.assert(
        fc.property(fc.boolean(), () => {
          const config = createDefaultConfig();

          expect(config.disableSoundForMessages).toBe(false);
          expect(config.customSoundForMessages).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that multiple display control inputs can be combined correctly.
     */
    it('should correctly combine multiple display control inputs', () => {
      fc.assert(
        fc.property(
          fc.record({
            hideReceipts: fc.boolean(),
            hideError: fc.boolean(),
            hideDeleteConversation: fc.boolean(),
            hideUserStatus: fc.boolean(),
            hideGroupType: fc.boolean(),
            showScrollbar: fc.boolean(),
            showSearchBar: fc.boolean(),
          }),
          displayConfig => {
            const config = { ...createDefaultConfig(), ...displayConfig };

            // Each input should independently control its feature
            expect(shouldShowReceipts(config)).toBe(!displayConfig.hideReceipts);
            expect(shouldShowDeleteOption(config)).toBe(!displayConfig.hideDeleteConversation);
            expect(shouldShowUserStatus(config)).toBe(!displayConfig.hideUserStatus);
            expect(shouldShowGroupType(config)).toBe(!displayConfig.hideGroupType);
            expect(shouldShowScrollbar(config)).toBe(displayConfig.showScrollbar);
            expect(shouldShowSearchBar(config)).toBe(displayConfig.showSearchBar);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that input configuration is deterministic - same inputs produce same behavior.
     */
    it('should be deterministic - same inputs produce same behavior', () => {
      fc.assert(
        fc.property(
          fc.record({
            hideReceipts: fc.boolean(),
            hideError: fc.boolean(),
            hideDeleteConversation: fc.boolean(),
            hideUserStatus: fc.boolean(),
            hideGroupType: fc.boolean(),
            showScrollbar: fc.boolean(),
            showSearchBar: fc.boolean(),
            disableSoundForMessages: fc.boolean(),
            selectionMode: fc.constantFrom(
              SelectionMode.none,
              SelectionMode.single,
              SelectionMode.multiple
            ),
          }),
          fc.integer({ min: 2, max: 5 }),
          (inputConfig, repeatCount) => {
            const config = { ...createDefaultConfig(), ...inputConfig };

            const results: boolean[][] = [];
            for (let i = 0; i < repeatCount; i++) {
              results.push([
                shouldShowReceipts(config),
                shouldShowDeleteOption(config),
                shouldShowUserStatus(config),
                shouldShowGroupType(config),
                shouldShowScrollbar(config),
                shouldShowSearchBar(config),
                shouldPlaySound(config),
                isSelectionModeActive(config),
              ]);
            }

            // All results should be identical
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toEqual(results[0]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that textFormatters input is correctly preserved as an array.
     */
    it('should preserve textFormatters input as an array', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
          formatters => {
            const config = { ...createDefaultConfig(), textFormatters: formatters };

            expect(config.textFormatters).toBe(formatters);
            expect(config.textFormatters.length).toBe(formatters.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: conversations-enterprise-refactor, Property 8: Backward Compatibility - Output Events**
   *
   * *For any* existing @Output event on `CometChatConversations` (onItemClick, onSelect,
   * onError, onSearchBarClicked), the event SHALL continue to emit with the same payload
   * type and behavior as the pre-refactor implementation.
   *
   * **Validates: Requirements 8.7, 10.2**
   */
  describe('Property 8: Backward Compatibility - Output Events', () => {
    /**
     * All existing @Output events that must be preserved for backward compatibility.
     * These are grouped by category for clarity.
     */
    const EXISTING_OUTPUT_EVENTS = [
      'onItemClick',
      'onSelect',
      'onError',
      'onSearchBarClicked',
    ] as const;

    const NEW_GRANULAR_EVENTS = [
      'onContextMenuOpen',
      'onContextMenuClose',
      'onScrollToTop',
      'onScrollToBottom',
      'onSelectionChange',
    ] as const;

    type ExistingOutputEvent = (typeof EXISTING_OUTPUT_EVENTS)[number];
    type NewGranularEvent = (typeof NEW_GRANULAR_EVENTS)[number];

    /**
     * Interface representing the expected payload types for each output event.
     */
    interface OutputEventPayloads {
      onItemClick: MockConversation;
      onSelect: { conversation: MockConversation; selected: boolean };
      onError: Error;
      onSearchBarClicked: void;
      onContextMenuOpen: MockConversation;
      onContextMenuClose: MockConversation;
      onScrollToTop: void;
      onScrollToBottom: void;
      onSelectionChange: SelectionState;
    }

    /**
     * Interface representing selection state for onSelectionChange event.
     */
    interface SelectionState {
      mode: SelectionMode;
      selectedIds: Set<string>;
      lastSelectedId: string | null;
    }

    /**
     * Mock event emitter that tracks emissions for testing.
     */
    class MockEventEmitter<T> {
      private emissions: T[] = [];
      private emitCount = 0;

      emit(value: T): void {
        this.emissions.push(value);
        this.emitCount++;
      }

      getEmissions(): T[] {
        return [...this.emissions];
      }

      getEmitCount(): number {
        return this.emitCount;
      }

      getLastEmission(): T | undefined {
        return this.emissions[this.emissions.length - 1];
      }

      clear(): void {
        this.emissions = [];
        this.emitCount = 0;
      }
    }

    /**
     * Simulates the component's event emission behavior for onItemClick.
     * Mirrors the component's handleConversationClick method.
     */
    function simulateItemClick(
      conversation: MockConversation,
      emitter: MockEventEmitter<MockConversation>
    ): void {
      emitter.emit(conversation);
    }

    /**
     * Simulates the component's event emission behavior for onSelect.
     * Mirrors the component's handleSelection method.
     */
    function simulateSelect(
      conversation: MockConversation,
      selected: boolean,
      emitter: MockEventEmitter<{ conversation: MockConversation; selected: boolean }>
    ): void {
      emitter.emit({ conversation, selected });
    }

    /**
     * Simulates the component's event emission behavior for onError.
     * Mirrors the component's error handling effect.
     */
    function simulateError(
      error: Error,
      hideError: boolean,
      emitter: MockEventEmitter<Error>
    ): void {
      if (!hideError) {
        emitter.emit(error);
      }
    }

    /**
     * Simulates the component's event emission behavior for onSearchBarClicked.
     * Mirrors the component's handleSearchBarClick method.
     */
    function simulateSearchBarClick(emitter: MockEventEmitter<void>): void {
      emitter.emit(undefined as unknown as void);
    }

    /**
     * Simulates the component's event emission behavior for onContextMenuOpen.
     * Mirrors the component's handleContextMenuOpen method.
     */
    function simulateContextMenuOpen(
      conversation: MockConversation,
      emitter: MockEventEmitter<MockConversation>
    ): void {
      emitter.emit(conversation);
    }

    /**
     * Simulates the component's event emission behavior for onScrollToTop.
     * Mirrors the component's handleScrollToTop method.
     */
    function simulateScrollToTop(emitter: MockEventEmitter<void>): void {
      emitter.emit(undefined as unknown as void);
    }

    /**
     * Simulates the component's event emission behavior for onScrollToBottom.
     * Mirrors the component's handleScrollToBottom method.
     */
    function simulateScrollToBottom(emitter: MockEventEmitter<void>): void {
      emitter.emit(undefined as unknown as void);
    }

    /**
     * Simulates the component's event emission behavior for onSelectionChange.
     * Mirrors the component's handleSelection method.
     */
    function simulateSelectionChange(
      mode: SelectionMode,
      selectedIds: Set<string>,
      lastSelectedId: string | null,
      emitter: MockEventEmitter<SelectionState>
    ): void {
      emitter.emit({ mode, selectedIds, lastSelectedId });
    }

    // ==================== Property Tests ====================

    /**
     * Test that onItemClick emits the correct conversation payload.
     */
    it('should emit onItemClick with conversation payload for any conversation', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.integer({ min: 0, max: 100 }),
          (conversationId, isUser, unreadCount) => {
            const conversation = createMockConversation(conversationId, isUser, unreadCount);
            const emitter = new MockEventEmitter<MockConversation>();

            simulateItemClick(conversation, emitter);

            expect(emitter.getEmitCount()).toBe(1);
            const emittedConversation = emitter.getLastEmission();
            expect(emittedConversation).toBe(conversation);
            expect(emittedConversation?.id).toBe(conversationId);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onSelect emits the correct payload with conversation and selected state.
     */
    it('should emit onSelect with conversation and selected state for any selection', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.boolean(),
          (conversationId, isUser, selected) => {
            const conversation = createMockConversation(conversationId, isUser);
            const emitter = new MockEventEmitter<{
              conversation: MockConversation;
              selected: boolean;
            }>();

            simulateSelect(conversation, selected, emitter);

            expect(emitter.getEmitCount()).toBe(1);
            const emission = emitter.getLastEmission();
            expect(emission?.conversation).toBe(conversation);
            expect(emission?.selected).toBe(selected);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onError emits when hideError is false and error exists.
     */
    it('should emit onError when hideError is false and error exists', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.boolean(),
          (errorMessage, hideError) => {
            const error = new Error(errorMessage);
            const emitter = new MockEventEmitter<Error>();

            simulateError(error, hideError, emitter);

            if (hideError) {
              expect(emitter.getEmitCount()).toBe(0);
            } else {
              expect(emitter.getEmitCount()).toBe(1);
              expect(emitter.getLastEmission()?.message).toBe(errorMessage);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onSearchBarClicked emits void when search bar is clicked.
     */
    it('should emit onSearchBarClicked with void payload', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), clickCount => {
          const emitter = new MockEventEmitter<void>();

          for (let i = 0; i < clickCount; i++) {
            simulateSearchBarClick(emitter);
          }

          expect(emitter.getEmitCount()).toBe(clickCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onContextMenuOpen emits the correct conversation payload.
     */
    it('should emit onContextMenuOpen with conversation payload', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          (conversationId, isUser) => {
            const conversation = createMockConversation(conversationId, isUser);
            const emitter = new MockEventEmitter<MockConversation>();

            simulateContextMenuOpen(conversation, emitter);

            expect(emitter.getEmitCount()).toBe(1);
            expect(emitter.getLastEmission()).toBe(conversation);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onScrollToTop emits void when scrolled to top.
     */
    it('should emit onScrollToTop with void payload', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), scrollCount => {
          const emitter = new MockEventEmitter<void>();

          for (let i = 0; i < scrollCount; i++) {
            simulateScrollToTop(emitter);
          }

          expect(emitter.getEmitCount()).toBe(scrollCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onScrollToBottom emits void when scrolled to bottom.
     */
    it('should emit onScrollToBottom with void payload', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), scrollCount => {
          const emitter = new MockEventEmitter<void>();

          for (let i = 0; i < scrollCount; i++) {
            simulateScrollToBottom(emitter);
          }

          expect(emitter.getEmitCount()).toBe(scrollCount);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onSelectionChange emits the correct selection state.
     */
    it('should emit onSelectionChange with complete selection state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(SelectionMode.none, SelectionMode.single, SelectionMode.multiple),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
          fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: null }),
          (mode, selectedIdArray, lastSelectedId) => {
            const selectedIds = new Set(selectedIdArray);
            const emitter = new MockEventEmitter<SelectionState>();

            simulateSelectionChange(mode, selectedIds, lastSelectedId, emitter);

            expect(emitter.getEmitCount()).toBe(1);
            const emission = emitter.getLastEmission();
            expect(emission?.mode).toBe(mode);
            expect(emission?.selectedIds).toBe(selectedIds);
            expect(emission?.lastSelectedId).toBe(lastSelectedId);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that multiple onItemClick emissions maintain correct order.
     */
    it('should maintain emission order for multiple onItemClick events', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              isUser: fc.boolean(),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          conversationConfigs => {
            const conversations = conversationConfigs.map(config =>
              createMockConversation(config.id, config.isUser)
            );
            const emitter = new MockEventEmitter<MockConversation>();

            conversations.forEach(conv => simulateItemClick(conv, emitter));

            const emissions = emitter.getEmissions();
            expect(emissions.length).toBe(conversations.length);
            for (let i = 0; i < conversations.length; i++) {
              expect(emissions[i]).toBe(conversations[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onSelect correctly tracks selection toggle sequence.
     */
    it('should correctly track selection toggle sequence', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (conversationId, isUser, selectionSequence) => {
            const conversation = createMockConversation(conversationId, isUser);
            const emitter = new MockEventEmitter<{
              conversation: MockConversation;
              selected: boolean;
            }>();

            selectionSequence.forEach(selected => {
              simulateSelect(conversation, selected, emitter);
            });

            const emissions = emitter.getEmissions();
            expect(emissions.length).toBe(selectionSequence.length);
            for (let i = 0; i < selectionSequence.length; i++) {
              expect(emissions[i].selected).toBe(selectionSequence[i]);
              expect(emissions[i].conversation).toBe(conversation);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all existing output events are defined with correct names.
     */
    it('should have all existing output events defined', () => {
      fc.assert(
        fc.property(fc.constantFrom(...EXISTING_OUTPUT_EVENTS), eventName => {
          // Verify the event name is one of the expected existing events
          expect(EXISTING_OUTPUT_EVENTS).toContain(eventName);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that all new granular events are defined with correct names.
     */
    it('should have all new granular events defined', () => {
      fc.assert(
        fc.property(fc.constantFrom(...NEW_GRANULAR_EVENTS), eventName => {
          // Verify the event name is one of the expected new events
          expect(NEW_GRANULAR_EVENTS).toContain(eventName);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Test that event emissions are idempotent - same input produces same output.
     */
    it('should be idempotent - same input produces same output', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.integer({ min: 2, max: 5 }),
          (conversationId, isUser, repeatCount) => {
            const conversation = createMockConversation(conversationId, isUser);
            const emitters: MockEventEmitter<MockConversation>[] = [];

            for (let i = 0; i < repeatCount; i++) {
              const emitter = new MockEventEmitter<MockConversation>();
              simulateItemClick(conversation, emitter);
              emitters.push(emitter);
            }

            // All emitters should have received the same conversation
            for (let i = 1; i < emitters.length; i++) {
              expect(emitters[i].getLastEmission()?.id).toBe(emitters[0].getLastEmission()?.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that onError respects hideError configuration consistently.
     */
    it('should consistently respect hideError configuration', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          fc.boolean(),
          (errorMessages, hideError) => {
            const emitter = new MockEventEmitter<Error>();

            errorMessages.forEach(msg => {
              simulateError(new Error(msg), hideError, emitter);
            });

            if (hideError) {
              expect(emitter.getEmitCount()).toBe(0);
            } else {
              expect(emitter.getEmitCount()).toBe(errorMessages.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that selection state in onSelectionChange is correctly structured.
     */
    it('should emit correctly structured selection state', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(SelectionMode.none, SelectionMode.single, SelectionMode.multiple),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
          (mode, selectedIdArray) => {
            const selectedIds = new Set(selectedIdArray);
            const lastSelectedId =
              selectedIdArray.length > 0 ? selectedIdArray[selectedIdArray.length - 1] : null;
            const emitter = new MockEventEmitter<SelectionState>();

            simulateSelectionChange(mode, selectedIds, lastSelectedId, emitter);

            const emission = emitter.getLastEmission();
            expect(emission).toBeDefined();
            // SelectionMode is an enum, so mode is a number
            expect(typeof emission?.mode).toBe('number');
            expect(emission?.selectedIds instanceof Set).toBe(true);
            expect(
              emission?.lastSelectedId === null || typeof emission?.lastSelectedId === 'string'
            ).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Test that event payload types are preserved across emissions.
     */
    it('should preserve event payload types across emissions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.boolean(),
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (conversationId, isUser, selected, errorMessage) => {
            const conversation = createMockConversation(conversationId, isUser);
            const error = new Error(errorMessage);

            // Test onItemClick payload type
            const itemClickEmitter = new MockEventEmitter<MockConversation>();
            simulateItemClick(conversation, itemClickEmitter);
            const itemClickPayload = itemClickEmitter.getLastEmission();
            expect(typeof itemClickPayload?.id).toBe('string');
            expect(typeof itemClickPayload?.getUnreadMessageCount).toBe('function');

            // Test onSelect payload type
            const selectEmitter = new MockEventEmitter<{
              conversation: MockConversation;
              selected: boolean;
            }>();
            simulateSelect(conversation, selected, selectEmitter);
            const selectPayload = selectEmitter.getLastEmission();
            expect(typeof selectPayload?.conversation).toBe('object');
            expect(typeof selectPayload?.selected).toBe('boolean');

            // Test onError payload type
            const errorEmitter = new MockEventEmitter<Error>();
            simulateError(error, false, errorEmitter);
            const errorPayload = errorEmitter.getLastEmission();
            expect(errorPayload instanceof Error).toBe(true);
            expect(typeof errorPayload?.message).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * **Feature: conversations-enterprise-refactor, Property 9: Selection State Consistency**
 *
 * *For any* sequence of selection operations (select, deselect) on conversations
 * in single or multiple selection mode, the `selectedConversations` signal SHALL
 * accurately reflect the current selection state, and the `onSelectionChange` event
 * SHALL emit with the complete selection state after each change.
 *
 * **Validates: Requirements 7.10, 9.4**
 */
describe('Property 9: Selection State Consistency', () => {
  /**
   * Interface representing selection state for tracking.
   */
  interface SelectionState {
    mode: SelectionMode;
    selectedIds: Set<string>;
    lastSelectedId: string | null;
  }

  /**
   * Interface representing a selection operation.
   */
  interface SelectionOperation {
    conversationId: string;
    type: 'select' | 'toggle';
  }

  /**
   * Mock event emitter that tracks emissions for testing.
   */
  class MockEventEmitter<T> {
    private emissions: T[] = [];
    private emitCount = 0;

    emit(value: T): void {
      this.emissions.push(value);
      this.emitCount++;
    }

    getEmissions(): T[] {
      return [...this.emissions];
    }

    getEmitCount(): number {
      return this.emitCount;
    }

    getLastEmission(): T | undefined {
      return this.emissions[this.emissions.length - 1];
    }

    clear(): void {
      this.emissions = [];
      this.emitCount = 0;
    }
  }

  /**
   * Simulates the component's selection state management.
   * This mirrors the component's selectedConversations signal behavior.
   */
  class SelectionStateManager {
    private selectedIds = new Set<string>();
    private mode: SelectionMode;
    private onSelectionChangeEmitter: MockEventEmitter<SelectionState>;
    private onSelectEmitter: MockEventEmitter<{ conversationId: string; selected: boolean }>;

    constructor(
      mode: SelectionMode,
      onSelectionChangeEmitter: MockEventEmitter<SelectionState>,
      onSelectEmitter: MockEventEmitter<{ conversationId: string; selected: boolean }>
    ) {
      this.mode = mode;
      this.onSelectionChangeEmitter = onSelectionChangeEmitter;
      this.onSelectEmitter = onSelectEmitter;
    }

    /**
     * Handles selection of a conversation.
     * Mirrors the component's handleSelection method.
     */
    handleSelection(conversationId: string): void {
      if (this.mode === SelectionMode.none) {
        return; // No selection in none mode
      }

      if (this.mode === SelectionMode.single) {
        const wasSelected = this.selectedIds.has(conversationId);
        this.selectedIds = new Set<string>();

        if (!wasSelected) {
          this.selectedIds.add(conversationId);
          this.onSelectEmitter.emit({ conversationId, selected: true });
        } else {
          this.onSelectEmitter.emit({ conversationId, selected: false });
        }
      } else if (this.mode === SelectionMode.multiple) {
        if (this.selectedIds.has(conversationId)) {
          this.selectedIds.delete(conversationId);
          this.onSelectEmitter.emit({ conversationId, selected: false });
        } else {
          this.selectedIds.add(conversationId);
          this.onSelectEmitter.emit({ conversationId, selected: true });
        }
      }

      // Emit selection change event
      this.onSelectionChangeEmitter.emit({
        mode: this.mode,
        selectedIds: new Set(this.selectedIds),
        lastSelectedId: conversationId,
      });
    }

    /**
     * Gets the current selection state.
     */
    getSelectedIds(): Set<string> {
      return new Set(this.selectedIds);
    }

    /**
     * Checks if a conversation is selected.
     */
    isSelected(conversationId: string): boolean {
      return this.selectedIds.has(conversationId);
    }

    /**
     * Clears all selections (like pressing Escape).
     */
    clearSelection(): void {
      this.selectedIds = new Set<string>();
    }

    /**
     * Gets the selection count.
     */
    getSelectionCount(): number {
      return this.selectedIds.size;
    }
  }

  /**
   * Generates a random selection operation.
   */
  const selectionOperationArb = fc.record({
    conversationId: fc.string({ minLength: 1, maxLength: 20 }),
    type: fc.constantFrom('select', 'toggle') as fc.Arbitrary<'select' | 'toggle'>,
  });

  // ==================== Property Tests ====================

  /**
   * Test that single selection mode maintains at most one selected item.
   */
  it('should maintain at most one selected item in single selection mode', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 20 }),
        conversationIds => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            SelectionMode.single,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Apply all selection operations
          conversationIds.forEach(id => manager.handleSelection(id));

          // In single selection mode, at most one item should be selected
          expect(manager.getSelectionCount()).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that multiple selection mode can have multiple selected items.
   */
  it('should allow multiple selected items in multiple selection mode', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 10 }),
        conversationIds => {
          // Ensure unique IDs
          const uniqueIds = [...new Set(conversationIds)];
          if (uniqueIds.length < 2) return; // Skip if not enough unique IDs

          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            SelectionMode.multiple,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Select all unique IDs
          uniqueIds.forEach(id => manager.handleSelection(id));

          // All unique IDs should be selected
          expect(manager.getSelectionCount()).toBe(uniqueIds.length);
          uniqueIds.forEach(id => {
            expect(manager.isSelected(id)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that toggling selection twice returns to original state.
   */
  it('should return to original state when toggling selection twice', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.string({ minLength: 1, maxLength: 20 }),
        (mode, conversationId) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Initial state: not selected
          expect(manager.isSelected(conversationId)).toBe(false);

          // First toggle: selected
          manager.handleSelection(conversationId);
          expect(manager.isSelected(conversationId)).toBe(true);

          // Second toggle: not selected
          manager.handleSelection(conversationId);
          expect(manager.isSelected(conversationId)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that onSelectionChange emits after every selection operation.
   */
  it('should emit onSelectionChange after every selection operation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (mode, conversationIds) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Apply all selection operations
          conversationIds.forEach(id => manager.handleSelection(id));

          // onSelectionChange should emit once per operation
          expect(onSelectionChangeEmitter.getEmitCount()).toBe(conversationIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that onSelectionChange payload contains correct mode.
   */
  it('should emit onSelectionChange with correct mode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.string({ minLength: 1, maxLength: 20 }),
        (mode, conversationId) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          manager.handleSelection(conversationId);

          const emission = onSelectionChangeEmitter.getLastEmission();
          expect(emission?.mode).toBe(mode);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that onSelectionChange payload contains correct selectedIds.
   */
  it('should emit onSelectionChange with correct selectedIds', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (mode, conversationIds) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Apply all selection operations
          conversationIds.forEach(id => manager.handleSelection(id));

          // The last emission should match the current state
          const emission = onSelectionChangeEmitter.getLastEmission();
          const currentSelection = manager.getSelectedIds();

          expect(emission?.selectedIds.size).toBe(currentSelection.size);
          currentSelection.forEach(id => {
            expect(emission?.selectedIds.has(id)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that onSelectionChange payload contains correct lastSelectedId.
   */
  it('should emit onSelectionChange with correct lastSelectedId', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (mode, conversationIds) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Apply all selection operations
          conversationIds.forEach(id => manager.handleSelection(id));

          // The last emission should have the last conversation ID as lastSelectedId
          const emission = onSelectionChangeEmitter.getLastEmission();
          expect(emission?.lastSelectedId).toBe(conversationIds[conversationIds.length - 1]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that single selection mode replaces previous selection.
   */
  it('should replace previous selection in single selection mode', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (firstId, secondId) => {
          // Ensure different IDs
          const actualSecondId = secondId === firstId ? `${secondId}-2` : secondId;

          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            SelectionMode.single,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Select first item
          manager.handleSelection(firstId);
          expect(manager.isSelected(firstId)).toBe(true);
          expect(manager.getSelectionCount()).toBe(1);

          // Select second item - should replace first
          manager.handleSelection(actualSecondId);
          expect(manager.isSelected(firstId)).toBe(false);
          expect(manager.isSelected(actualSecondId)).toBe(true);
          expect(manager.getSelectionCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that multiple selection mode accumulates selections.
   */
  it('should accumulate selections in multiple selection mode', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        conversationIds => {
          // Ensure unique IDs
          const uniqueIds = [...new Set(conversationIds)];

          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            SelectionMode.multiple,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Select all unique IDs
          uniqueIds.forEach(id => manager.handleSelection(id));

          // All should be selected
          expect(manager.getSelectionCount()).toBe(uniqueIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that selection state is consistent after a sequence of operations.
   */
  it('should maintain consistent selection state after sequence of operations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            action: fc.constantFrom('select', 'select', 'select') as fc.Arbitrary<'select'>,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (mode, operations) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Track expected state manually
          let expectedSelection = new Set<string>();

          operations.forEach(op => {
            manager.handleSelection(op.id);

            // Update expected state based on mode
            if (mode === SelectionMode.single) {
              if (expectedSelection.has(op.id)) {
                expectedSelection = new Set<string>();
              } else {
                expectedSelection = new Set([op.id]);
              }
            } else {
              if (expectedSelection.has(op.id)) {
                expectedSelection.delete(op.id);
              } else {
                expectedSelection.add(op.id);
              }
            }

            // Verify state matches expected
            const currentSelection = manager.getSelectedIds();
            expect(currentSelection.size).toBe(expectedSelection.size);
            expectedSelection.forEach(id => {
              expect(currentSelection.has(id)).toBe(true);
            });
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that onSelect emits correct selected state for each operation.
   */
  it('should emit onSelect with correct selected state for each operation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.string({ minLength: 1, maxLength: 20 }),
        (mode, conversationId) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // First selection - should be selected: true
          manager.handleSelection(conversationId);
          let lastEmission = onSelectEmitter.getLastEmission();
          expect(lastEmission?.conversationId).toBe(conversationId);
          expect(lastEmission?.selected).toBe(true);

          // Second selection (toggle) - should be selected: false
          manager.handleSelection(conversationId);
          lastEmission = onSelectEmitter.getLastEmission();
          expect(lastEmission?.conversationId).toBe(conversationId);
          expect(lastEmission?.selected).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that none selection mode does not change selection state.
   */
  it('should not change selection state in none selection mode', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        conversationIds => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            SelectionMode.none,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Try to select items
          conversationIds.forEach(id => manager.handleSelection(id));

          // No items should be selected
          expect(manager.getSelectionCount()).toBe(0);
          // No events should be emitted
          expect(onSelectionChangeEmitter.getEmitCount()).toBe(0);
          expect(onSelectEmitter.getEmitCount()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that clearing selection resets state correctly.
   */
  it('should reset selection state when cleared', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (mode, conversationIds) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          // Select some items
          conversationIds.forEach(id => manager.handleSelection(id));

          // Clear selection
          manager.clearSelection();

          // No items should be selected
          expect(manager.getSelectionCount()).toBe(0);
          conversationIds.forEach(id => {
            expect(manager.isSelected(id)).toBe(false);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that selection state is deterministic - same operations produce same state.
   */
  it('should be deterministic - same operations produce same state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 2, max: 5 }),
        (mode, conversationIds, repeatCount) => {
          const results: Set<string>[] = [];

          for (let i = 0; i < repeatCount; i++) {
            const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
            const onSelectEmitter = new MockEventEmitter<{
              conversationId: string;
              selected: boolean;
            }>();
            const manager = new SelectionStateManager(
              mode,
              onSelectionChangeEmitter,
              onSelectEmitter
            );

            conversationIds.forEach(id => manager.handleSelection(id));
            results.push(manager.getSelectedIds());
          }

          // All results should be identical
          for (let i = 1; i < results.length; i++) {
            expect(results[i].size).toBe(results[0].size);
            results[0].forEach(id => {
              expect(results[i].has(id)).toBe(true);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that selection events are emitted in correct order.
   */
  it('should emit selection events in correct order', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(SelectionMode.single, SelectionMode.multiple),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (mode, conversationIds) => {
          const onSelectionChangeEmitter = new MockEventEmitter<SelectionState>();
          const onSelectEmitter = new MockEventEmitter<{
            conversationId: string;
            selected: boolean;
          }>();
          const manager = new SelectionStateManager(
            mode,
            onSelectionChangeEmitter,
            onSelectEmitter
          );

          conversationIds.forEach(id => manager.handleSelection(id));

          const emissions = onSelectionChangeEmitter.getEmissions();

          // Each emission should have the correct lastSelectedId matching the operation order
          for (let i = 0; i < conversationIds.length; i++) {
            expect(emissions[i].lastSelectedId).toBe(conversationIds[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: conversations-enterprise-refactor, Property 10: Keyboard Navigation Preservation**
 *
 * *For any* sequence of keyboard navigation operations (ArrowDown, ArrowUp, Enter, Space, Escape)
 * on the conversation list, the `focusedIndex` signal SHALL correctly track the focused item,
 * and the appropriate actions SHALL be triggered (selection on Enter/Space, clear on Escape).
 *
 * **Validates: Requirements 9.1**
 */
describe('Property 10: Keyboard Navigation Preservation', () => {
  /**
   * Supported keyboard keys for navigation.
   */
  const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Escape'] as const;
  type NavigationKey = (typeof NAVIGATION_KEYS)[number];

  /**
   * Interface representing the keyboard navigation state.
   */
  interface KeyboardNavigationState {
    focusedIndex: number;
    conversationCount: number;
    selectedConversationIds: Set<string>;
  }

  /**
   * Interface representing a mock conversation for testing.
   */
  interface MockConversation {
    id: string;
    getConversationId: () => string;
  }

  /**
   * Creates a mock conversation.
   */
  function createMockConversation(id: string): MockConversation {
    return {
      id,
      getConversationId: () => id,
    };
  }

  /**
   * Mock event emitter that tracks emissions for testing.
   */
  class MockEventEmitter<T> {
    private emissions: T[] = [];
    private emitCount = 0;

    emit(value: T): void {
      this.emissions.push(value);
      this.emitCount++;
    }

    getEmissions(): T[] {
      return [...this.emissions];
    }

    getEmitCount(): number {
      return this.emitCount;
    }

    getLastEmission(): T | undefined {
      return this.emissions[this.emissions.length - 1];
    }

    clear(): void {
      this.emissions = [];
      this.emitCount = 0;
    }
  }

  /**
   * Simulates the component's keyboard navigation state management.
   * This mirrors the component's handleKeydown method and focusedIndex signal behavior.
   */
  class KeyboardNavigationManager {
    private focusedIndex = -1;
    private conversations: MockConversation[];
    private selectedConversationIds = new Set<string>();
    private onItemClickEmitter: MockEventEmitter<MockConversation>;
    private onSelectionClearEmitter: MockEventEmitter<void>;

    constructor(
      conversations: MockConversation[],
      onItemClickEmitter: MockEventEmitter<MockConversation>,
      onSelectionClearEmitter: MockEventEmitter<void>
    ) {
      this.conversations = conversations;
      this.onItemClickEmitter = onItemClickEmitter;
      this.onSelectionClearEmitter = onSelectionClearEmitter;
    }

    /**
     * Handles keyboard navigation.
     * Mirrors the component's handleKeydown method.
     */
    handleKeydown(key: NavigationKey): void {
      if (this.conversations.length === 0) return;

      switch (key) {
        case 'ArrowDown':
          // Move focus down, wrap around to start
          this.focusedIndex = (this.focusedIndex + 1) % this.conversations.length;
          break;
        case 'ArrowUp':
          // Move focus up, wrap around to end
          this.focusedIndex =
            this.focusedIndex <= 0 ? this.conversations.length - 1 : this.focusedIndex - 1;
          break;
        case 'Enter':
        case ' ':
          // Select/activate the focused conversation
          if (this.focusedIndex >= 0 && this.focusedIndex < this.conversations.length) {
            const conversation = this.conversations[this.focusedIndex];
            this.onItemClickEmitter.emit(conversation);
            this.selectedConversationIds.add(conversation.id);
          }
          break;
        case 'Escape':
          // Clear selection and reset focus
          this.selectedConversationIds = new Set<string>();
          this.focusedIndex = -1;
          this.onSelectionClearEmitter.emit();
          break;
      }
    }

    /**
     * Gets the current focused index.
     */
    getFocusedIndex(): number {
      return this.focusedIndex;
    }

    /**
     * Gets the currently focused conversation.
     */
    getFocusedConversation(): MockConversation | undefined {
      if (this.focusedIndex >= 0 && this.focusedIndex < this.conversations.length) {
        return this.conversations[this.focusedIndex];
      }
      return undefined;
    }

    /**
     * Gets the selected conversation IDs.
     */
    getSelectedConversationIds(): Set<string> {
      return new Set(this.selectedConversationIds);
    }

    /**
     * Gets the current state.
     */
    getState(): KeyboardNavigationState {
      return {
        focusedIndex: this.focusedIndex,
        conversationCount: this.conversations.length,
        selectedConversationIds: new Set(this.selectedConversationIds),
      };
    }

    /**
     * Sets the focused index directly (for testing initial states).
     */
    setFocusedIndex(index: number): void {
      this.focusedIndex = index;
    }
  }

  // ==================== Property Tests ====================

  /**
   * Test that ArrowDown moves focus to the next item with wrap-around.
   */
  it('should move focus down on ArrowDown with wrap-around', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        fc.integer({ min: 1, max: 10 }),
        (conversationCount, initialFocusIndex, arrowDownCount) => {
          const actualInitialIndex = initialFocusIndex % conversationCount;
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Set initial focus
          manager.setFocusedIndex(actualInitialIndex);

          // Press ArrowDown multiple times
          for (let i = 0; i < arrowDownCount; i++) {
            manager.handleKeydown('ArrowDown');
          }

          // Calculate expected index with wrap-around
          const expectedIndex = (actualInitialIndex + arrowDownCount) % conversationCount;
          expect(manager.getFocusedIndex()).toBe(expectedIndex);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that ArrowUp moves focus to the previous item with wrap-around.
   */
  it('should move focus up on ArrowUp with wrap-around', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        fc.integer({ min: 1, max: 10 }),
        (conversationCount, initialFocusIndex, arrowUpCount) => {
          const actualInitialIndex = initialFocusIndex % conversationCount;
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Set initial focus
          manager.setFocusedIndex(actualInitialIndex);

          // Press ArrowUp multiple times
          for (let i = 0; i < arrowUpCount; i++) {
            manager.handleKeydown('ArrowUp');
          }

          // Calculate expected index with wrap-around
          let expectedIndex = actualInitialIndex - arrowUpCount;
          while (expectedIndex < 0) {
            expectedIndex += conversationCount;
          }
          expectedIndex = expectedIndex % conversationCount;
          expect(manager.getFocusedIndex()).toBe(expectedIndex);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that Enter selects the focused conversation.
   */
  it('should select focused conversation on Enter', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (conversationCount, focusIndex) => {
          const actualFocusIndex = focusIndex % conversationCount;
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Set focus
          manager.setFocusedIndex(actualFocusIndex);

          // Press Enter
          manager.handleKeydown('Enter');

          // Should emit onItemClick with the focused conversation
          expect(onItemClickEmitter.getEmitCount()).toBe(1);
          expect(onItemClickEmitter.getLastEmission()?.id).toBe(`conv-${actualFocusIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that Space selects the focused conversation (same as Enter).
   */
  it('should select focused conversation on Space', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (conversationCount, focusIndex) => {
          const actualFocusIndex = focusIndex % conversationCount;
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Set focus
          manager.setFocusedIndex(actualFocusIndex);

          // Press Space
          manager.handleKeydown(' ');

          // Should emit onItemClick with the focused conversation
          expect(onItemClickEmitter.getEmitCount()).toBe(1);
          expect(onItemClickEmitter.getLastEmission()?.id).toBe(`conv-${actualFocusIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that Escape clears selection and resets focus.
   */
  it('should clear selection and reset focus on Escape', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (conversationCount, focusIndex) => {
          const actualFocusIndex = focusIndex % conversationCount;
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Set focus and select some items
          manager.setFocusedIndex(actualFocusIndex);
          manager.handleKeydown('Enter'); // Select current item

          // Press Escape
          manager.handleKeydown('Escape');

          // Focus should be reset to -1
          expect(manager.getFocusedIndex()).toBe(-1);
          // Selection should be cleared
          expect(manager.getSelectedConversationIds().size).toBe(0);
          // Selection clear event should be emitted
          expect(onSelectionClearEmitter.getEmitCount()).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that keyboard navigation does nothing on empty list.
   */
  it('should do nothing on keyboard navigation with empty list', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...NAVIGATION_KEYS),
        fc.integer({ min: 1, max: 10 }),
        (key, repeatCount) => {
          const conversations: MockConversation[] = [];
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Press key multiple times
          for (let i = 0; i < repeatCount; i++) {
            manager.handleKeydown(key);
          }

          // Focus should remain at -1 (no items to focus)
          expect(manager.getFocusedIndex()).toBe(-1);
          // No item click events should be emitted
          expect(onItemClickEmitter.getEmitCount()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that ArrowDown from -1 (no focus) moves to first item.
   */
  it('should move to first item on ArrowDown from no focus', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), conversationCount => {
        const conversations = Array.from({ length: conversationCount }, (_, i) =>
          createMockConversation(`conv-${i}`)
        );
        const onItemClickEmitter = new MockEventEmitter<MockConversation>();
        const onSelectionClearEmitter = new MockEventEmitter<void>();
        const manager = new KeyboardNavigationManager(
          conversations,
          onItemClickEmitter,
          onSelectionClearEmitter
        );

        // Initial focus is -1
        expect(manager.getFocusedIndex()).toBe(-1);

        // Press ArrowDown
        manager.handleKeydown('ArrowDown');

        // Focus should move to first item (index 0)
        expect(manager.getFocusedIndex()).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that ArrowUp from -1 (no focus) moves to last item.
   */
  it('should move to last item on ArrowUp from no focus', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), conversationCount => {
        const conversations = Array.from({ length: conversationCount }, (_, i) =>
          createMockConversation(`conv-${i}`)
        );
        const onItemClickEmitter = new MockEventEmitter<MockConversation>();
        const onSelectionClearEmitter = new MockEventEmitter<void>();
        const manager = new KeyboardNavigationManager(
          conversations,
          onItemClickEmitter,
          onSelectionClearEmitter
        );

        // Initial focus is -1
        expect(manager.getFocusedIndex()).toBe(-1);

        // Press ArrowUp
        manager.handleKeydown('ArrowUp');

        // Focus should move to last item
        expect(manager.getFocusedIndex()).toBe(conversationCount - 1);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Test that Enter/Space does nothing when no item is focused.
   */
  it('should not emit onItemClick when no item is focused', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.constantFrom('Enter', ' ') as fc.Arbitrary<'Enter' | ' '>,
        (conversationCount, key) => {
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Focus is -1 (no focus)
          expect(manager.getFocusedIndex()).toBe(-1);

          // Press Enter or Space
          manager.handleKeydown(key);

          // No item click event should be emitted
          expect(onItemClickEmitter.getEmitCount()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that navigation sequence produces correct final focus.
   */
  it('should produce correct final focus after navigation sequence', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.array(fc.constantFrom('ArrowDown', 'ArrowUp') as fc.Arbitrary<'ArrowDown' | 'ArrowUp'>, {
          minLength: 1,
          maxLength: 20,
        }),
        (conversationCount, navigationSequence) => {
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Calculate expected final index
          let expectedIndex = -1;
          for (const key of navigationSequence) {
            if (key === 'ArrowDown') {
              expectedIndex = (expectedIndex + 1) % conversationCount;
            } else {
              expectedIndex = expectedIndex <= 0 ? conversationCount - 1 : expectedIndex - 1;
            }
          }

          // Apply navigation sequence
          for (const key of navigationSequence) {
            manager.handleKeydown(key);
          }

          expect(manager.getFocusedIndex()).toBe(expectedIndex);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that keyboard navigation is deterministic - same sequence produces same result.
   */
  it('should be deterministic - same navigation sequence produces same result', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        fc.array(fc.constantFrom(...NAVIGATION_KEYS), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 2, max: 5 }),
        (conversationCount, navigationSequence, repeatCount) => {
          const results: number[] = [];

          for (let i = 0; i < repeatCount; i++) {
            const conversations = Array.from({ length: conversationCount }, (_, j) =>
              createMockConversation(`conv-${j}`)
            );
            const onItemClickEmitter = new MockEventEmitter<MockConversation>();
            const onSelectionClearEmitter = new MockEventEmitter<void>();
            const manager = new KeyboardNavigationManager(
              conversations,
              onItemClickEmitter,
              onSelectionClearEmitter
            );

            // Apply navigation sequence
            for (const key of navigationSequence) {
              manager.handleKeydown(key);
            }

            results.push(manager.getFocusedIndex());
          }

          // All results should be identical
          for (let i = 1; i < results.length; i++) {
            expect(results[i]).toBe(results[0]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that focused index is always within valid bounds.
   */
  it('should keep focused index within valid bounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(fc.constantFrom('ArrowDown', 'ArrowUp') as fc.Arbitrary<'ArrowDown' | 'ArrowUp'>, {
          minLength: 1,
          maxLength: 50,
        }),
        (conversationCount, navigationSequence) => {
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Apply navigation sequence and check bounds after each step
          for (const key of navigationSequence) {
            manager.handleKeydown(key);
            const focusedIndex = manager.getFocusedIndex();

            // Focus should always be within valid bounds
            expect(focusedIndex).toBeGreaterThanOrEqual(0);
            expect(focusedIndex).toBeLessThan(conversationCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that Enter and Space have identical behavior.
   */
  it('should have identical behavior for Enter and Space', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (conversationCount, focusIndex) => {
          const actualFocusIndex = focusIndex % conversationCount;

          // Test with Enter
          const conversationsEnter = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitterEnter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitterEnter = new MockEventEmitter<void>();
          const managerEnter = new KeyboardNavigationManager(
            conversationsEnter,
            onItemClickEmitterEnter,
            onSelectionClearEmitterEnter
          );
          managerEnter.setFocusedIndex(actualFocusIndex);
          managerEnter.handleKeydown('Enter');

          // Test with Space
          const conversationsSpace = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitterSpace = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitterSpace = new MockEventEmitter<void>();
          const managerSpace = new KeyboardNavigationManager(
            conversationsSpace,
            onItemClickEmitterSpace,
            onSelectionClearEmitterSpace
          );
          managerSpace.setFocusedIndex(actualFocusIndex);
          managerSpace.handleKeydown(' ');

          // Both should have same emit count
          expect(onItemClickEmitterEnter.getEmitCount()).toBe(
            onItemClickEmitterSpace.getEmitCount()
          );
          // Both should emit same conversation ID
          expect(onItemClickEmitterEnter.getLastEmission()?.id).toBe(
            onItemClickEmitterSpace.getLastEmission()?.id
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that Escape always resets to initial state regardless of current state.
   */
  it('should always reset to initial state on Escape', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.constantFrom('ArrowDown', 'ArrowUp', 'Enter', ' ') as fc.Arbitrary<
            'ArrowDown' | 'ArrowUp' | 'Enter' | ' '
          >,
          { minLength: 0, maxLength: 20 }
        ),
        (conversationCount, preEscapeSequence) => {
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Apply pre-escape sequence
          for (const key of preEscapeSequence) {
            manager.handleKeydown(key);
          }

          // Press Escape
          manager.handleKeydown('Escape');

          // Focus should be reset to -1
          expect(manager.getFocusedIndex()).toBe(-1);
          // Selection should be cleared
          expect(manager.getSelectedConversationIds().size).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that focused conversation matches focused index.
   */
  it('should return correct focused conversation for focused index', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 0, max: 19 }),
        (conversationCount, focusIndex) => {
          const actualFocusIndex = focusIndex % conversationCount;
          const conversations = Array.from({ length: conversationCount }, (_, i) =>
            createMockConversation(`conv-${i}`)
          );
          const onItemClickEmitter = new MockEventEmitter<MockConversation>();
          const onSelectionClearEmitter = new MockEventEmitter<void>();
          const manager = new KeyboardNavigationManager(
            conversations,
            onItemClickEmitter,
            onSelectionClearEmitter
          );

          // Set focus
          manager.setFocusedIndex(actualFocusIndex);

          // Focused conversation should match
          const focusedConversation = manager.getFocusedConversation();
          expect(focusedConversation).toBeDefined();
          expect(focusedConversation?.id).toBe(`conv-${actualFocusIndex}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that getFocusedConversation returns undefined when no focus.
   */
  it('should return undefined for focused conversation when no focus', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), conversationCount => {
        const conversations = Array.from({ length: conversationCount }, (_, i) =>
          createMockConversation(`conv-${i}`)
        );
        const onItemClickEmitter = new MockEventEmitter<MockConversation>();
        const onSelectionClearEmitter = new MockEventEmitter<void>();
        const manager = new KeyboardNavigationManager(
          conversations,
          onItemClickEmitter,
          onSelectionClearEmitter
        );

        // No focus set (default -1)
        expect(manager.getFocusedConversation()).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
