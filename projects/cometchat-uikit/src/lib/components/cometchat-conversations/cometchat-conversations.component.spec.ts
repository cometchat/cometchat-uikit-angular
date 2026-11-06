/**
 * CometChatConversations Component Tests
 *
 * Comprehensive TestBed-based test suite for the conversations list component.
 * Uses real CometChat SDK session — NO vi.mock() for SDK packages.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Selection Modes, Localized Labels, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            3.1, 3.2, 3.3, 3.6, 4.1, 4.2, 5.3, 11.1, 11.3, 13.6,
 *            14.4, 14.5, 15.7
 *
 * @module components/cometchat-conversations
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, flushPromises } from '../../testing';
import { CometChatConversationsComponent } from './cometchat-conversations.component';
import { SelectionMode } from '../../Enums/Enums';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { CometChatMessageEvents } from '../../events/CometChatMessageEvents';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(
  fixture: ComponentFixture<CometChatConversationsComponent>
): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatConversationsComponent],
  template: `
    <ng-template #customSubtitle let-conversation>
      <span class="test-custom-subtitle">Custom Subtitle</span>
    </ng-template>
    <ng-template #customEmpty>
      <div class="test-custom-empty">No conversations here</div>
    </ng-template>
    <ng-template #customError>
      <div class="test-custom-error">Custom error view</div>
    </ng-template>

    <cometchat-conversations
      [subtitleView]="customSubtitle"
      [emptyView]="customEmpty"
      [errorView]="customError"
    >
    </cometchat-conversations>
  `,
})
class TestHostComponent {
  @ViewChild('customSubtitle') customSubtitle!: TemplateRef<any>;
  @ViewChild('customEmpty') customEmpty!: TemplateRef<any>;
  @ViewChild('customError') customError!: TemplateRef<any>;
  @ViewChild(CometChatConversationsComponent)
  conversationsComponent!: CometChatConversationsComponent;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatConversationsComponent', () => {
  let fixture: ComponentFixture<CometChatConversationsComponent>;
  let component: CometChatConversationsComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatConversationsComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat-conversations element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-conversations')).toBeTruthy();
    });

    it('should render the header section', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-conversations__header')).toBeTruthy();
    });

    it('should render the default header with title', async () => {
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-conversations__title');
      expect(title).toBeTruthy();
      expect(title?.textContent?.trim()).toBeTruthy();
    });

    it('should expose SelectionMode enum to template', () => {
      expect(component.SelectionMode).toBeDefined();
      expect(component.SelectionMode.none).toBe(SelectionMode.none);
      expect(component.SelectionMode.single).toBe(SelectionMode.single);
      expect(component.SelectionMode.multiple).toBe(SelectionMode.multiple);
    });

    it('should initialize conversations signal from service', async () => {
      await initAndDetect(fixture);
      expect(component.conversations).toBeDefined();
      expect(Array.isArray(component.conversations())).toBe(true);
    });

    it('should initialize loadingState signal from service', () => {
      fixture.detectChanges();
      expect(component.loadingState).toBeDefined();
      expect(typeof component.loadingState()).toBe('boolean');
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings
  // -------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should default hideReceipts to false', () => {
      expect(component.hideReceipts).toBe(false);
    });

    it('should default hideError to false', () => {
      expect(component.hideError).toBe(false);
    });

    it('should default hideDeleteConversation to false', () => {
      expect(component.hideDeleteConversation).toBe(false);
    });

    it('should default hideUserStatus to false', () => {
      expect(component.hideUserStatus).toBe(false);
    });

    it('should default hideGroupType to false', () => {
      expect(component.hideGroupType).toBe(false);
    });

    it('should default showScrollbar to false', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should default showSearchBar to false', () => {
      expect(component.showSearchBar).toBe(false);
    });

    it('should default selectionMode to none', () => {
      expect(component.selectionMode).toBe(SelectionMode.none);
    });

    it('should default disableDefaultContextMenu to true', () => {
      expect(component.disableDefaultContextMenu).toBe(true);
    });

    it('should default disableSoundForMessages to false', () => {
      expect(component.disableSoundForMessages).toBe(false);
    });

    it('should accept and reflect hideReceipts input', () => {
      component.hideReceipts = true;
      expect(component.hideReceipts).toBe(true);
    });

    it('should accept and reflect selectionMode input', () => {
      component.selectionMode = SelectionMode.multiple;
      expect(component.selectionMode).toBe(SelectionMode.multiple);
    });

    it('should accept conversationsRequestBuilder input', () => {
      const builder = new CometChat.ConversationsRequestBuilder().setLimit(5);
      component.conversationsRequestBuilder = builder;
      expect(component.conversationsRequestBuilder).toBe(builder);
    });

    it('should handle undefined activeConversation gracefully', () => {
      expect(() => {
        component.activeConversation = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should accept customSoundForMessages input', () => {
      component.customSoundForMessages = 'custom-sound.mp3';
      expect(component.customSoundForMessages).toBe('custom-sound.mp3');
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit scrollToBottom when handleScrollToBottom is called', () => {
      const spy = vi.fn();
      component.scrollToBottom.subscribe(spy);
      fixture.detectChanges();
      component.handleScrollToBottom();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit scrollToTop when handleScrollToTop is called', () => {
      const spy = vi.fn();
      component.scrollToTop.subscribe(spy);
      fixture.detectChanges();
      component.handleScrollToTop();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit searchBarClick when handleSearchBarClick is called', () => {
      const spy = vi.fn();
      component.searchBarClick.subscribe(spy);
      fixture.detectChanges();
      component.handleSearchBarClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit error output when error event fires', () => {
      const spy = vi.fn();
      component.error.subscribe(spy);
      const err = new CometChat.CometChatException({
        code: 'ERR_TEST',
        message: 'Test error',
      } as any);
      component.error.emit(err);
      expect(spy).toHaveBeenCalledWith(err);
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the cometchat-paginated-list child component', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-paginated-list')).toBeTruthy();
    });

    it('should not render search bar by default', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-conversations__search-section')).toBeNull();
    });

    it('should render search bar when showSearchBar is true', async () => {
      component.showSearchBar = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-conversations__search-section')).toBeTruthy();
    });

    it('should have aria-label on the root conversations element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-conversations');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should render the title with localized text', async () => {
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-conversations__title');
      const expectedText = CometChatLocalize.getLocalizedString('conversation_chat_title');
      expect(title?.textContent?.trim()).toBe(expectedText);
    });
  });

  // -------------------------------------------------------------------------
  // Selection Modes
  // -------------------------------------------------------------------------
  describe('Selection Modes', () => {
    it('should default to no selection mode active', () => {
      fixture.detectChanges();
      expect(component.isSelectionModeActive()).toBe(false);
    });

    it('should report selection mode active for single mode', () => {
      component.selectionMode = SelectionMode.single;
      fixture.detectChanges();
      expect(component.isSelectionModeActive()).toBe(true);
    });

    it('should report selection mode active for multiple mode', () => {
      component.selectionMode = SelectionMode.multiple;
      fixture.detectChanges();
      expect(component.isSelectionModeActive()).toBe(true);
    });

    it('should track selected conversations count', () => {
      fixture.detectChanges();
      expect(component.selectedCount()).toBe(0);
      expect(component.hasSelection()).toBe(false);
    });

    it('should clear selection via clearSelection()', async () => {
      component.selectionMode = SelectionMode.multiple;
      await initAndDetect(fixture);
      component.selectedConversations.update(set => {
        const newSet = new Set(set);
        newSet.add('test-id');
        return newSet;
      });
      expect(component.selectedCount()).toBe(1);
      component.clearSelection();
      expect(component.selectedCount()).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Localized Labels
  // -------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should resolve conversation_chat_title key', () => {
      const label = CometChatLocalize.getLocalizedString('conversation_chat_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve conversation_empty_title key', () => {
      const label = CometChatLocalize.getLocalizedString('conversation_empty_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve conversation_empty_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('conversation_empty_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve conversation_delete_title key', () => {
      const label = CometChatLocalize.getLocalizedString('conversation_delete_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve conversation_delete_confirm_yes key', () => {
      const label = CometChatLocalize.getLocalizedString('conversation_delete_confirm_yes');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve conversation_delete_confirm_no key', () => {
      const label = CometChatLocalize.getLocalizedString('conversation_delete_confirm_no');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Computed Signals & Effective Values
  // -------------------------------------------------------------------------
  describe('Computed Signals', () => {
    it('should compute effectiveHideReceipts from input', () => {
      component.hideReceipts = true;
      fixture.detectChanges();
      expect(component.effectiveHideReceipts()).toBe(true);
    });

    it('should compute effectiveHideError from input', () => {
      component.hideError = true;
      fixture.detectChanges();
      expect(component.effectiveHideError()).toBe(true);
    });

    it('should compute effectiveShowSearchBar from input', () => {
      component.showSearchBar = true;
      fixture.detectChanges();
      expect(component.effectiveShowSearchBar()).toBe(true);
    });

    it('should compute effectiveShowScrollbar from input', () => {
      component.showScrollbar = true;
      fixture.detectChanges();
      expect(component.effectiveShowScrollbar()).toBe(true);
    });

    it('should compute effectiveDisableDefaultContextMenu from input', () => {
      component.disableDefaultContextMenu = false;
      fixture.detectChanges();
      expect(component.effectiveDisableDefaultContextMenu()).toBe(false);
    });

    it('should compute effectiveDisableSoundForMessages from input', () => {
      component.disableSoundForMessages = true;
      fixture.detectChanges();
      expect(component.effectiveDisableSoundForMessages()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Date/Time Format
  // -------------------------------------------------------------------------
  describe('Date/Time Format', () => {
    it('should return a default date time format object', () => {
      const format = component.getDefaultDateTimeFormat();
      expect(format).toBeDefined();
      expect(format.today).toBeTruthy();
      expect(format.yesterday).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  describe('Lifecycle', () => {
    it('should not throw on ngOnDestroy', async () => {
      await initAndDetect(fixture);
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when destroyed while loading', () => {
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Delete Confirmation Dialog
  // -------------------------------------------------------------------------
  describe('Delete Confirmation Dialog', () => {
    it('should not show delete dialog by default', async () => {
      await initAndDetect(fixture);
      expect(component.showDeleteConfirmDialog()).toBe(false);
      expect(el.querySelector('.cometchat-conversations__dialog-overlay')).toBeNull();
    });

    it('should cancel delete dialog via handleDeleteCancel', async () => {
      await initAndDetect(fixture);
      component.showDeleteConfirmDialog.set(true);
      fixture.detectChanges();
      component.handleDeleteCancel();
      expect(component.showDeleteConfirmDialog()).toBe(false);
      expect(component.conversationToDelete()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle Guards (Error Boundaries — Requirement 7.4)
  // -------------------------------------------------------------------------
  describe('Lifecycle Guards', () => {
    it('should emit error output when ngOnInit throws', () => {
      // Spy on a method called synchronously during ngOnInit to make it throw
      const testError = new Error('ngOnInit failure');
      vi.spyOn(component as any, 'initializeService').mockImplementation(() => {
        throw testError;
      });

      const errorSpy = vi.fn();
      component.error.subscribe(errorSpy);

      // Trigger ngOnInit (detectChanges calls it)
      fixture.detectChanges();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'ngOnInit failure' })
      );
    });

    it('should not propagate error from ngOnInit to Angular error handler', () => {
      vi.spyOn(component as any, 'initializeService').mockImplementation(() => {
        throw new Error('should be caught');
      });

      // ngOnInit should NOT throw — the try-catch should swallow it
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty conversations array gracefully', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-conversations')).toBeTruthy();
    });

    it('should handle setting textFormatters to empty array', () => {
      expect(() => {
        component.textFormatters = [];
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle setting textFormatters to a non-empty array', () => {
      class StubFormatter extends CometChatTextFormatter {
        readonly id = 'stub';
        getRegex(): RegExp { return /test/g; }
        format(): string { return 'test'; }
      }
      const mockFormatter = new StubFormatter();
      expect(() => {
        component.textFormatters = [mockFormatter];
        fixture.detectChanges();
      }).not.toThrow();
      expect(component.textFormatters).toEqual([mockFormatter]);
    });

    it('should handle rapid selection mode changes', () => {
      expect(() => {
        component.selectionMode = SelectionMode.single;
        fixture.detectChanges();
        component.selectionMode = SelectionMode.multiple;
        fixture.detectChanges();
        component.selectionMode = SelectionMode.none;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle getConversationId with a mock conversation object', async () => {
      const { createMockConversation } = await import('../../testing');
      const conversation = createMockConversation();
      const id = component.getConversationId(conversation);
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('should not throw when handleRetryClick is called', async () => {
      await initAndDetect(fixture);
      expect(() => component.handleRetryClick()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Template Overrides (via host component)
  // -------------------------------------------------------------------------
  describe('Template Overrides', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
    });

    it('should accept subtitleView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.conversationsComponent.subtitleView).toBeTruthy();
    });

    it('should accept emptyView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.conversationsComponent.emptyView).toBeTruthy();
    });

    it('should accept errorView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.conversationsComponent.errorView).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-conversations') as HTMLElement;
      expect(root).toBeTruthy();
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Escape key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-conversations') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }).not.toThrow();
    });
  });

  // ── Memory Leak: subscription cleanup on destroy (ENG-34639) ─────────────

  describe('Subscription cleanup on destroy', () => {
    it('should not throw when component is destroyed', () => {
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should complete ccMessageRead subscription when component is destroyed', () => {
      fixture.detectChanges();
      const service = (component as any).conversationsService;
      const readSpy = vi.spyOn(service, 'updateConversationReadStatus').mockImplementation(() => {});

      const groupMsg = new CometChat.TextMessage('cleanup-guid', 'hi', CometChat.RECEIVER_TYPE.GROUP);
      groupMsg.setReceiver(new CometChat.Group('cleanup-guid', 'Cleanup Group'));

      // While alive, a read event reaches the component's handler
      CometChatMessageEvents.ccMessageRead.next(groupMsg);
      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(readSpy).toHaveBeenCalledWith('cleanup-guid', groupMsg);

      // Destroy the component — its takeUntilDestroyed subscription should clean up
      fixture.destroy();
      readSpy.mockClear();

      // After destroy, the same event must no longer reach the handler
      CometChatMessageEvents.ccMessageRead.next(groupMsg);
      expect(readSpy).not.toHaveBeenCalled();
    });

    it('should allow re-creation after destroy without errors', () => {
      fixture.detectChanges();
      fixture.destroy();

      // Create a new fixture — should work cleanly
      expect(() => {
        const newFixture = TestBed.createComponent(CometChatConversationsComponent);
        newFixture.detectChanges();
        newFixture.destroy();
      }).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// Effective settings resolution
//
// Each `effective*` computed resolves in three steps: an explicitly-set input
// wins, then the injected global config, then a hard default. Only the default
// path was previously exercised, which is most of why branch coverage on this
// component was so low.
// ---------------------------------------------------------------------------
describe('Effective settings resolution', () => {
  /** Builds a component with the given global config provided (or none). */
  async function build(
    globalConfig: Record<string, unknown> | null
  ): Promise<ComponentFixture<CometChatConversationsComponent>> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
      providers: globalConfig
        ? [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: globalConfig }]
        : [],
    }).compileComponents();
    return TestBed.createComponent(CometChatConversationsComponent);
  }

  /**
   * Each row: the component property, the matching global-config key, the
   * value to set explicitly, a differing config value, and the hard default.
   */
  const settings: Array<{
    input: string;
    effective: string;
    configKey: string;
    explicit: unknown;
    fromConfig: unknown;
    fallback: unknown;
  }> = [
    { input: 'hideReceipts', effective: 'effectiveHideReceipts', configKey: 'hideReceipts', explicit: true, fromConfig: true, fallback: false },
    { input: 'hideError', effective: 'effectiveHideError', configKey: 'hideError', explicit: true, fromConfig: true, fallback: false },
    { input: 'hideUserStatus', effective: 'effectiveHideUserStatus', configKey: 'hideUserStatus', explicit: true, fromConfig: true, fallback: false },
    { input: 'hideGroupType', effective: 'effectiveHideGroupType', configKey: 'hideGroupType', explicit: true, fromConfig: true, fallback: false },
    { input: 'showScrollbar', effective: 'effectiveShowScrollbar', configKey: 'showScrollbar', explicit: true, fromConfig: true, fallback: false },
    { input: 'showSearchBar', effective: 'effectiveShowSearchBar', configKey: 'showSearchBar', explicit: true, fromConfig: true, fallback: false },
    { input: 'disableSoundForMessages', effective: 'effectiveDisableSoundForMessages', configKey: 'disableSoundForMessages', explicit: true, fromConfig: true, fallback: false },
    { input: 'disableDefaultContextMenu', effective: 'effectiveDisableDefaultContextMenu', configKey: 'disableDefaultContextMenu', explicit: false, fromConfig: false, fallback: true },
    { input: 'customSoundForMessages', effective: 'effectiveCustomSoundForMessages', configKey: 'customSoundForMessages', explicit: 'own.mp3', fromConfig: 'config.mp3', fallback: '' },
  ];

  it.each(settings.map(s => [s.effective, s] as const))(
    '%s falls back to its default when nothing is configured',
    async (_name, s) => {
      const f = await build(null);
      const c = f.componentInstance as unknown as Record<string, () => unknown>;
      expect(c[s.effective]()).toBe(s.fallback);
      f.destroy();
    }
  );

  it.each(settings.map(s => [s.effective, s] as const))(
    '%s takes the global config value when the input is untouched',
    async (_name, s) => {
      const f = await build({ [s.configKey]: s.fromConfig });
      const c = f.componentInstance as unknown as Record<string, () => unknown>;
      expect(c[s.effective]()).toBe(s.fromConfig);
      f.destroy();
    }
  );

  it.each(settings.map(s => [s.effective, s] as const))(
    '%s prefers an explicitly set input over the global config',
    async (_name, s) => {
      // Config holds the opposite value, so the assertion can only pass if the
      // explicit input won.
      const opposite =
        typeof s.explicit === 'boolean' ? !s.explicit : `not-${String(s.explicit)}`;
      const f = await build({ [s.configKey]: opposite });
      const c = f.componentInstance as unknown as Record<string, unknown>;
      (c as Record<string, unknown>)[s.input] = s.explicit;

      expect((c[s.effective] as () => unknown)()).toBe(s.explicit);
      f.destroy();
    }
  );

  it('effectiveTextFormatters defaults to an empty array', async () => {
    const f = await build(null);
    expect(f.componentInstance.effectiveTextFormatters()).toEqual([]);
    f.destroy();
  });

  it('effectiveTextFormatters takes the global config value', async () => {
    const formatters = [{ name: 'mention' }];
    const f = await build({ textFormatters: formatters });
    expect(f.componentInstance.effectiveTextFormatters()).toBe(formatters);
    f.destroy();
  });

  it('effectiveTextFormatters prefers an explicitly set input', async () => {
    const own = [{ name: 'own' }];
    const f = await build({ textFormatters: [{ name: 'config' }] });
    (f.componentInstance as unknown as Record<string, unknown>)['textFormatters'] = own;
    expect(f.componentInstance.effectiveTextFormatters()).toBe(own);
    f.destroy();
  });

  it('ignores a global config that omits the key entirely', async () => {
    const f = await build({ somethingElse: true });
    expect(f.componentInstance.effectiveHideReceipts()).toBe(false);
    f.destroy();
  });
});

// ---------------------------------------------------------------------------
// Effective template resolution
//
// Every view getter walks a precedence chain ending at the templates service.
// ---------------------------------------------------------------------------
describe('Effective template resolution', () => {
  let f: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
    }).compileComponents();
    f = TestBed.createComponent(CometChatConversationsComponent);
    c = f.componentInstance;
  });

  afterEach(() => f.destroy());

  /** A stand-in template; identity is all these assertions need. */
  const tpl = (tag: string) => ({ tag }) as unknown as TemplateRef<unknown>;

  it.each([
    ['effectiveItemView', 'listItemTemplate', 'itemView'],
    ['effectiveLeadingView', 'leadingView', 'leadingViewContent'],
    ['effectiveTitleView', 'titleView', 'titleViewContent'],
    ['effectiveSubtitleView', 'subtitleView', 'subtitleViewContent'],
    ['effectiveTrailingView', 'trailingView', 'trailingViewContent'],
  ])('%s prefers the first source in its chain', (effective, first, second) => {
    const rec = c as unknown as Record<string, unknown>;
    const winner = tpl(first);
    rec[first] = winner;
    rec[second] = tpl(second);

    expect(rec[effective]).toBe(winner);
  });

  it.each([
    ['effectiveItemView', 'itemView'],
    ['effectiveLeadingView', 'leadingViewContent'],
    ['effectiveTitleView', 'titleViewContent'],
    ['effectiveSubtitleView', 'subtitleViewContent'],
    ['effectiveTrailingView', 'trailingViewContent'],
  ])('%s falls through to the next source', (effective, second) => {
    const rec = c as unknown as Record<string, unknown>;
    const fallback = tpl(second);
    rec[second] = fallback;

    expect(rec[effective]).toBe(fallback);
  });

  it.each([
    ['effectiveLoadingView', 'loadingStateTemplate'],
    ['effectiveEmptyView', 'emptyStateTemplate'],
    ['effectiveErrorView', 'errorStateTemplate'],
  ])('%s prefers its explicit state template', (effective, stateTemplate) => {
    const rec = c as unknown as Record<string, unknown>;
    const winner = tpl(stateTemplate);
    rec[stateTemplate] = winner;

    expect(rec[effective]).toBe(winner);
  });

  it.each([
    'effectiveItemView',
    'effectiveLeadingView',
    'effectiveTitleView',
    'effectiveSubtitleView',
    'effectiveTrailingView',
  ])('%s is undefined when nothing is supplied', (effective) => {
    expect((c as unknown as Record<string, unknown>)[effective]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------
describe('Derived state', () => {
  let f: ComponentFixture<CometChatConversationsComponent>;
  let c: CometChatConversationsComponent;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
    }).compileComponents();
    f = TestBed.createComponent(CometChatConversationsComponent);
    c = f.componentInstance;
  });

  afterEach(() => f.destroy());

  it('reports no selection initially', () => {
    expect(c.hasSelection()).toBe(false);
    expect(c.selectedCount()).toBe(0);
  });

  it('reports a selection once conversations are selected', () => {
    c.selectedConversations.set(new Set(['a', 'b']));
    expect(c.hasSelection()).toBe(true);
    expect(c.selectedCount()).toBe(2);
  });

  it('reports selection mode inactive by default', () => {
    expect(c.isSelectionModeActive()).toBe(false);
  });

  it.each([SelectionMode.single, SelectionMode.multiple])(
    'reports selection mode active for %s',
    (mode) => {
      c.selectionMode = mode;
      expect(c.isSelectionModeActive()).toBe(true);
    }
  );

  it('reports no conversations initially', () => {
    expect(c.hasConversations()).toBe(false);
  });

  it('requires both a flag and a target before showing the delete dialog', () => {
    c.showDeleteConfirmDialog.set(true);
    expect(c.shouldShowDeleteDialog()).toBe(false);

    c.conversationToDelete.set({} as CometChat.Conversation);
    expect(c.shouldShowDeleteDialog()).toBe(true);
  });

  it('hides the delete dialog when the flag is cleared', () => {
    c.showDeleteConfirmDialog.set(false);
    c.conversationToDelete.set({} as CometChat.Conversation);
    expect(c.shouldShowDeleteDialog()).toBe(false);
  });

  it('mirrors the loading signal', () => {
    expect(c.isLoading()).toBe(c.loadingState());
  });

  it('reports no error for a null error state', () => {
    // errorState is a read-only Signal fed by the service, so the property is
    // swapped rather than set.
    (c as unknown as Record<string, unknown>)['errorState'] = signal(null);
    expect(c.hasError()).toBe(false);
  });

  it('reports an error once the error state is populated', () => {
    (c as unknown as Record<string, unknown>)['errorState'] = signal(new Error('boom'));
    expect(c.hasError()).toBe(true);
  });
});
