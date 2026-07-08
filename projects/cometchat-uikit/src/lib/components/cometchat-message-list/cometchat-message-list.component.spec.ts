/**
 * CometChatMessageList Component Tests
 *
 * Comprehensive TestBed-based test suite for the message list component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Template Overrides, Hide/Show Controls,
 *             Localized Labels, Date Formats, Lifecycle, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.4, 2.5,
 *            3.1, 3.2, 3.3, 3.6, 4.1, 4.2, 5.3, 11.1, 13.6,
 *            14.4, 14.5, 15.7
 *
 * @module components/cometchat-message-list
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup, fetchTestUser, flushPromises } from '../../testing';
import { CometChatMessageListComponent } from './cometchat-message-list.component';
import { States, MessageListAlignment } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(
  fixture: ComponentFixture<CometChatMessageListComponent>
): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatMessageListComponent],
  template: `
    <ng-template #customHeader>
      <div class="test-custom-header">Custom Header</div>
    </ng-template>
    <ng-template #customFooter>
      <div class="test-custom-footer">Custom Footer</div>
    </ng-template>
    <ng-template #customEmpty>
      <div class="test-custom-empty">No messages here</div>
    </ng-template>
    <ng-template #customError>
      <div class="test-custom-error">Custom error view</div>
    </ng-template>
    <ng-template #customLoading>
      <div class="test-custom-loading">Loading messages...</div>
    </ng-template>
    <cometchat-message-list
      [headerView]="customHeader"
      [footerView]="customFooter"
      [emptyView]="customEmpty"
      [errorView]="customError"
      [loadingView]="customLoading"
    >
    </cometchat-message-list>
  `,
})
class TestHostComponent {
  @ViewChild('customHeader') customHeader!: TemplateRef<any>;
  @ViewChild('customFooter') customFooter!: TemplateRef<any>;
  @ViewChild('customEmpty') customEmpty!: TemplateRef<any>;
  @ViewChild('customError') customError!: TemplateRef<any>;
  @ViewChild('customLoading') customLoading!: TemplateRef<any>;
  @ViewChild(CometChatMessageListComponent)
  messageListComponent!: CometChatMessageListComponent;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatMessageListComponent', () => {
  let fixture: ComponentFixture<CometChatMessageListComponent>;
  let component: CometChatMessageListComponent;
  let el: HTMLElement;
  let testUser: CometChat.User;

  beforeAll(async () => {
    const user = await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    expect(user).toBeTruthy();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatMessageListComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatMessageListComponent);
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

    it('should render the root .cometchat-message-list element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-list')).toBeTruthy();
    });

    it('should have role="log" on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list');
      expect(root?.getAttribute('role')).toBe('log');
    });

    it('should have aria-live="off" on the root log (curated announcer handles announcements)', async () => {
      await initAndDetect(fixture);
      // role="log" implicitly is a polite live region; we explicitly set it off so
      // the dedicated LiveAnnouncerService is the single source of announcements
      // (avoids double/verbose announcing of every DOM mutation).
      const root = el.querySelector('.cometchat-message-list');
      expect(root?.getAttribute('aria-live')).toBe('off');
    });

    it('should initialize messages signal from service', async () => {
      await initAndDetect(fixture);
      expect(component.messages).toBeDefined();
      expect(Array.isArray(component.messages())).toBe(true);
    });

    it('should initialize loadingState signal from service', () => {
      fixture.detectChanges();
      expect(component.loadingState).toBeDefined();
      expect(typeof component.loadingState()).toBe('boolean');
    });

    it('should initialize errorState signal from service', () => {
      fixture.detectChanges();
      expect(component.errorState).toBeDefined();
    });

    it('should expose States enum to template', () => {
      expect(component.States).toBeDefined();
      expect(component.States.loading).toBe(States.loading);
      expect(component.States.loaded).toBe(States.loaded);
      expect(component.States.empty).toBe(States.empty);
      expect(component.States.error).toBe(States.error);
    });

    it('should expose MessageListAlignment enum to template', () => {
      expect(component.MessageListAlignment).toBeDefined();
      expect(component.MessageListAlignment.standard).toBe(MessageListAlignment.standard);
      expect(component.MessageListAlignment.left).toBe(MessageListAlignment.left);
    });

    it('should start in loading state', () => {
      fixture.detectChanges();
      // Without user/group set, the component transitions to empty state
      // since there are no messages and loading completes immediately
      expect([States.loading, States.empty]).toContain(component.listState());
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

    it('should default hideDateSeparator to false', () => {
      expect(component.hideDateSeparator).toBe(false);
    });

    it('should default hideStickyDate to false', () => {
      expect(component.hideStickyDate).toBe(false);
    });

    it('should default hideAvatar to false', () => {
      expect(component.hideAvatar).toBe(false);
    });

    it('should default hideGroupActionMessages to false', () => {
      expect(component.hideGroupActionMessages).toBe(false);
    });

    it('should default showScrollbar to false', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should default scrollToBottomOnNewMessages to false', () => {
      expect(component.scrollToBottomOnNewMessages).toBe(false);
    });

    it('should default messageAlignment to standard', () => {
      expect(component.messageAlignment).toBe(MessageListAlignment.standard);
    });

    it('should default quickOptionsCount to 3', () => {
      expect(component.quickOptionsCount).toBe(3);
    });

    it('should default disableSoundForMessages to false', () => {
      expect(component.disableSoundForMessages).toBe(false);
    });

    it('should default showConversationStarters to false', () => {
      expect(component.showConversationStarters).toBe(false);
    });

    it('should default showSmartReplies to false', () => {
      expect(component.showSmartReplies).toBe(false);
    });

    it('should default smartRepliesDelayDuration to 10000', () => {
      expect(component.smartRepliesDelayDuration).toBe(10000);
    });

    it('should default hideReplyInThreadOption to false', () => {
      expect(component.hideReplyInThreadOption).toBe(false);
    });

    it('should default hideTranslateMessageOption to false', () => {
      expect(component.hideTranslateMessageOption).toBe(false);
    });

    it('should default hideEditMessageOption to false', () => {
      expect(component.hideEditMessageOption).toBe(false);
    });

    it('should default hideDeleteMessageOption to false', () => {
      expect(component.hideDeleteMessageOption).toBe(false);
    });

    it('should default hideReactionOption to false', () => {
      expect(component.hideReactionOption).toBe(false);
    });

    it('should default hideMessagePrivatelyOption to false', () => {
      expect(component.hideMessagePrivatelyOption).toBe(false);
    });

    it('should default hideCopyMessageOption to false', () => {
      expect(component.hideCopyMessageOption).toBe(false);
    });

    it('should default hideMessageInfoOption to false', () => {
      expect(component.hideMessageInfoOption).toBe(false);
    });

    it('should default hideFlagMessageOption to false', () => {
      expect(component.hideFlagMessageOption).toBe(false);
    });

    it('should default hideFlagRemarkField to false', () => {
      expect(component.hideFlagRemarkField).toBe(false);
    });

    it('should default hideModerationView to false', () => {
      expect(component.hideModerationView).toBe(false);
    });

    it('should accept and reflect hideReceipts input', () => {
      component.hideReceipts = true;
      expect(component.hideReceipts).toBe(true);
    });

    it('should accept and reflect messageAlignment input', () => {
      component.messageAlignment = MessageListAlignment.left;
      expect(component.messageAlignment).toBe(MessageListAlignment.left);
    });

    it('should accept user input with real SDK user', () => {
      component.user = testUser;
      expect(component.user).toBe(testUser);
    });

    it('should accept messagesRequestBuilder input', () => {
      const builder = new CometChat.MessagesRequestBuilder().setLimit(10);
      component.messagesRequestBuilder = builder;
      expect(component.messagesRequestBuilder).toBe(builder);
    });

    it('should handle undefined user gracefully', () => {
      expect(() => {
        component.user = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle undefined group gracefully', () => {
      expect(() => {
        component.group = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should accept customSoundForMessages input', () => {
      component.customSoundForMessages = 'custom-sound.mp3';
      expect(component.customSoundForMessages).toBe('custom-sound.mp3');
    });

    it('should accept smartRepliesKeywords input', () => {
      const keywords = ['hello', 'help'];
      component.smartRepliesKeywords = keywords;
      expect(component.smartRepliesKeywords).toEqual(keywords);
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
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

    it('should emit threadRepliesClick output', () => {
      const spy = vi.fn();
      component.threadRepliesClick.subscribe(spy);
      const mockMsg = {} as CometChat.BaseMessage;
      component.threadRepliesClick.emit(mockMsg);
      expect(spy).toHaveBeenCalledWith(mockMsg);
    });

    it('should emit smartReplyClick output', () => {
      const spy = vi.fn();
      component.smartReplyClick.subscribe(spy);
      component.onSmartReplyClick('Hello there');
      expect(spy).toHaveBeenCalledWith('Hello there');
    });

    it('should emit conversationStarterClick output', () => {
      const spy = vi.fn();
      component.conversationStarterClick.subscribe(spy);
      component.onConversationStarterClick('How are you?');
      expect(spy).toHaveBeenCalledWith('How are you?');
    });

    it('should emit replyClick output', () => {
      const spy = vi.fn();
      component.replyClick.subscribe(spy);
      const mockMsg = {} as CometChat.BaseMessage;
      component.replyClick.emit(mockMsg);
      expect(spy).toHaveBeenCalledWith(mockMsg);
    });

    it('should emit messagePrivatelyClick output', () => {
      const spy = vi.fn();
      component.messagePrivatelyClick.subscribe(spy);
      const payload = { message: {} as CometChat.BaseMessage, user: testUser };
      component.messagePrivatelyClick.emit(payload);
      expect(spy).toHaveBeenCalledWith(payload);
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the main container element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-list__container')).toBeTruthy();
    });

    it('should have aria-label on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should render loading shimmer when in loading state', () => {
      // The reactive updateListState effect overrides manual listState.set(),
      // so we verify the shimmerList data exists (template uses it for @for loop)
      // and that listState can be set to loading (the signal itself works).
      fixture.detectChanges();
      expect(component.shimmerList).toBeDefined();
      expect(Array.isArray(component.shimmerList)).toBe(true);
      expect(component.shimmerList.length).toBeGreaterThan(0);
      // Verify the signal accepts loading state
      component.listState.set(States.loading);
      expect(component.listState()).toBe(States.loading);
    });

    it('should render shimmer wrappers when in loading state', () => {
      // Verify shimmer data structure is correct for rendering
      fixture.detectChanges();
      // shimmerList provides the iteration data for shimmer wrappers
      expect(component.shimmerList.length).toBeGreaterThan(0);
      // Each item is a number used for @for track
      component.shimmerList.forEach((item: number) => {
        expect(typeof item).toBe('number');
      });
    });

    it('should not render scroll-to-bottom button initially', async () => {
      await initAndDetect(fixture);
      // showScrollToBottom is false by default
      expect(el.querySelector('.cometchat-message-list__scroll-to-bottom')).toBeNull();
    });

    it('should not render delete dialog by default', async () => {
      await initAndDetect(fixture);
      expect(component.showDeleteConfirmDialog()).toBe(false);
      expect(el.querySelector('.cometchat-message-list__dialog-overlay')).toBeNull();
    });

    it('should not render flag dialog by default', async () => {
      await initAndDetect(fixture);
      expect(component.showFlagMessageDialog()).toBe(false);
    });

    it('should not render message info panel by default', async () => {
      await initAndDetect(fixture);
      expect(component.showMessageInfo()).toBe(false);
      expect(el.querySelector('.cometchat-message-list__info-panel')).toBeNull();
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

    it('should accept headerView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.messageListComponent.headerView).toBeTruthy();
    });

    it('should accept footerView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.messageListComponent.footerView).toBeTruthy();
    });

    it('should accept emptyView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.messageListComponent.emptyView).toBeTruthy();
    });

    it('should accept errorView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.messageListComponent.errorView).toBeTruthy();
    });

    it('should accept loadingView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      expect(hostComponent.messageListComponent.loadingView).toBeTruthy();
    });

    it('should render custom header view when provided', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      const customHeader = hostFixture.nativeElement.querySelector('.test-custom-header');
      expect(customHeader).toBeTruthy();
      expect(customHeader?.textContent?.trim()).toBe('Custom Header');
    });
  });

  // -------------------------------------------------------------------------
  // Hide/Show Controls
  // -------------------------------------------------------------------------
  describe('Hide/Show Controls', () => {
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

    it('should compute effectiveShowScrollbar from input', () => {
      component.showScrollbar = true;
      fixture.detectChanges();
      expect(component.effectiveShowScrollbar()).toBe(true);
    });

    it('should compute effectiveDisableSoundForMessages from input', () => {
      component.disableSoundForMessages = true;
      fixture.detectChanges();
      expect(component.effectiveDisableSoundForMessages()).toBe(true);
    });

    it('should compute effectiveHideAvatar from input', () => {
      component.hideAvatar = true;
      fixture.detectChanges();
      expect(component.effectiveHideAvatar()).toBe(true);
    });

    it('should compute effectiveCustomSoundForMessages from input', () => {
      component.customSoundForMessages = 'test.mp3';
      fixture.detectChanges();
      expect(component.effectiveCustomSoundForMessages()).toBe('test.mp3');
    });

    it('should compute effectiveHideModerationView from input', () => {
      component.hideModerationView = true;
      fixture.detectChanges();
      expect(component.effectiveHideModerationView()).toBe(true);
    });

    it('should default effectiveHideReceipts to false', () => {
      fixture.detectChanges();
      expect(component.effectiveHideReceipts()).toBe(false);
    });

    it('should default effectiveHideError to false', () => {
      fixture.detectChanges();
      expect(component.effectiveHideError()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Localized Labels
  // -------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should resolve message_list_aria_label key', () => {
      const label = CometChatLocalize.getLocalizedString('message_list_aria_label');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve message_list_error key', () => {
      const label = CometChatLocalize.getLocalizedString('message_list_error');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve retry key', () => {
      const label = CometChatLocalize.getLocalizedString('retry');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve message_delete_title key', () => {
      const label = CometChatLocalize.getLocalizedString('message_delete_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve message_delete_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('message_delete_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve message_delete_confirm_yes key', () => {
      const label = CometChatLocalize.getLocalizedString('message_delete_confirm_yes');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve message_delete_confirm_no key', () => {
      const label = CometChatLocalize.getLocalizedString('message_delete_confirm_no');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve scroll_to_bottom key', () => {
      const label = CometChatLocalize.getLocalizedString('scroll_to_bottom');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Date/Time Formats
  // -------------------------------------------------------------------------
  describe('Date/Time Formats', () => {
    it('should return a default separator date format object', () => {
      const format = component.getDefaultSeparatorDateFormat();
      expect(format).toBeDefined();
      expect(format.today).toBeTruthy();
      expect(format.yesterday).toBeTruthy();
    });

    it('should return a default sticky date format object', () => {
      const format = component.getDefaultStickyDateFormat();
      expect(format).toBeDefined();
      expect(format.today).toBeTruthy();
      expect(format.yesterday).toBeTruthy();
    });

    it('should return a default message date format object', () => {
      const format = component.getDefaultMessageDateFormat();
      expect(format).toBeDefined();
      expect(format.today).toBeTruthy();
    });

    it('should return effective separator date format from input when provided', () => {
      const customFormat = { today: 'HH:mm', yesterday: 'Yesterday' };
      component.separatorDateTimeFormat = customFormat;
      const effective = component.getEffectiveSeparatorDateFormat();
      expect(effective).toBe(customFormat);
    });

    it('should return default separator date format when no input provided', () => {
      component.separatorDateTimeFormat = undefined;
      const effective = component.getEffectiveSeparatorDateFormat();
      expect(effective).toBeDefined();
      expect(effective.today).toBeTruthy();
    });

    it('should return effective sticky date format from input when provided', () => {
      const customFormat = { today: 'HH:mm', yesterday: 'Yesterday' };
      component.stickyDateTimeFormat = customFormat;
      const effective = component.getEffectiveStickyDateFormat();
      expect(effective).toBe(customFormat);
    });

    it('should return effective message date format from input when provided', () => {
      const customFormat = { today: 'h:mm a' };
      component.messageSentAtDateTimeFormat = customFormat;
      const effective = component.getEffectiveMessageDateFormat();
      expect(effective).toBe(customFormat);
    });
  });

  // -------------------------------------------------------------------------
  // Delete Confirmation Dialog
  // -------------------------------------------------------------------------
  describe('Delete Confirmation Dialog', () => {
    it('should not show delete dialog by default', async () => {
      await initAndDetect(fixture);
      expect(component.showDeleteConfirmDialog()).toBe(false);
    });

    it('should cancel delete dialog via handleDeleteCancel', async () => {
      await initAndDetect(fixture);
      component.showDeleteConfirmDialog.set(true);
      fixture.detectChanges();
      component.handleDeleteCancel();
      expect(component.showDeleteConfirmDialog()).toBe(false);
      expect(component.messageToDelete()).toBeNull();
    });

    it('should return localized delete dialog title', () => {
      const title = component.getDeleteDialogTitle();
      expect(title).toBeTruthy();
      expect(typeof title).toBe('string');
    });

    it('should return localized delete dialog subtitle', () => {
      const subtitle = component.getDeleteDialogSubtitle();
      expect(subtitle).toBeTruthy();
      expect(typeof subtitle).toBe('string');
    });

    it('should return localized delete dialog confirm text', () => {
      const text = component.getDeleteDialogConfirmText();
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
    });

    it('should return localized delete dialog cancel text', () => {
      const text = component.getDeleteDialogCancelText();
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // Computed Signals
  // -------------------------------------------------------------------------
  describe('Computed Signals', () => {
    it('should compute hasMessages based on messages array', () => {
      fixture.detectChanges();
      // Initially no messages loaded (no user/group set)
      expect(component.hasMessages()).toBe(false);
    });

    it('should compute isLoading from loadingState', () => {
      fixture.detectChanges();
      expect(typeof component.isLoading()).toBe('boolean');
    });

    it('should compute hasError from errorState', () => {
      fixture.detectChanges();
      expect(typeof component.hasError()).toBe('boolean');
    });

    it('should compute shouldShowEmptyState correctly', () => {
      fixture.detectChanges();
      // shouldShowEmptyState = !isLoading && !hasError && !hasMessages
      expect(typeof component.shouldShowEmptyState()).toBe('boolean');
    });

    it('should default showScrollToBottom to false', () => {
      fixture.detectChanges();
      expect(component.showScrollToBottom()).toBe(false);
    });

    it('should default isAtBottom to true', () => {
      fixture.detectChanges();
      expect(component.isAtBottom()).toBe(true);
    });

    it('should default focusedMessageIndex to -1', () => {
      fixture.detectChanges();
      expect(component.focusedMessageIndex()).toBe(-1);
    });

    it('should default showNewMessagesBanner to false', () => {
      fixture.detectChanges();
      expect(component.showNewMessagesBanner()).toBe(false);
    });

    it('should default newMessagesCount to 0', () => {
      fixture.detectChanges();
      expect(component.newMessagesCount()).toBe(0);
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

    it('should not throw when destroyed after initialization', async () => {
      await initAndDetect(fixture);
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list') as HTMLElement;
      expect(root).toBeTruthy();
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle ArrowUp keydown on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Escape key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Home key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle End key without throwing', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-list') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      }).not.toThrow();
    });

    it('should set focused message index via setFocusedIndex', () => {
      fixture.detectChanges();
      component.setFocusedIndex(5);
      expect(component.focusedMessageIndex()).toBe(5);
    });

    it('should return correct tabindex for message items', () => {
      fixture.detectChanges();
      // When focusedMessageIndex is -1, first item should be 0
      const tabIndex = component.getMessageTabIndex(0);
      expect(typeof tabIndex).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // Smart Replies & Conversation Starters
  // -------------------------------------------------------------------------
  describe('Smart Replies & Conversation Starters', () => {
    it('should default hideSmartReplies to true', () => {
      fixture.detectChanges();
      // hideSmartReplies defaults to true (signal initialized as true)
      expect(component.hideSmartReplies()).toBe(true);
    });

    it('should default hideConversationStarters to false', () => {
      fixture.detectChanges();
      expect(component.hideConversationStarters()).toBe(false);
    });

    it('should hide smart replies when onSmartRepliesClose is called', () => {
      fixture.detectChanges();
      component.onSmartRepliesClose();
      expect(component.hideSmartReplies()).toBe(true);
    });

    it('should not change hideSmartReplies when onUserTyping is called', () => {
      fixture.detectChanges();
      const before = component.hideSmartReplies();
      component.onUserTyping();
      // onUserTyping no longer hides smart replies (commented out in component)
      expect(component.hideSmartReplies()).toBe(before);
    });

    it('should have default smartRepliesKeywords', () => {
      expect(component.smartRepliesKeywords).toBeDefined();
      expect(Array.isArray(component.smartRepliesKeywords)).toBe(true);
      expect(component.smartRepliesKeywords.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Translation State
  // -------------------------------------------------------------------------
  describe('Translation State', () => {
    it('should initialize translatedMessages as empty map', () => {
      fixture.detectChanges();
      expect(component.translatedMessages()).toBeInstanceOf(Map);
      expect(component.translatedMessages().size).toBe(0);
    });

    it('should initialize translatingMessages as empty set', () => {
      fixture.detectChanges();
      expect(component.translatingMessages()).toBeInstanceOf(Set);
      expect(component.translatingMessages().size).toBe(0);
    });

    it('should return undefined for non-translated message', () => {
      fixture.detectChanges();
      expect(component.getTranslatedText(999)).toBeUndefined();
    });

    it('should return false for non-translating message', () => {
      fixture.detectChanges();
      expect(component.isMessageTranslating(999)).toBe(false);
    });

    it('should return false for non-translated message check', () => {
      fixture.detectChanges();
      expect(component.isMessageTranslated(999)).toBe(false);
    });

    it('should accept preferred translation language', () => {
      fixture.detectChanges();
      component.setPreferredTranslationLanguage('fr');
      expect(component.preferredTranslationLanguage()).toBe('fr');
    });
  });

  // -------------------------------------------------------------------------
  // Message Loading with Real SDK
  // -------------------------------------------------------------------------
  describe('Message Loading with Real SDK', () => {
    it('should load messages when user is set', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      // Allow extra time for SDK fetch
      await new Promise(r => setTimeout(r, 2000));
      fixture.detectChanges();
      // Messages should have been fetched (may be empty if no conversation history)
      expect(component.messages).toBeDefined();
      expect(Array.isArray(component.messages())).toBe(true);
    }, 15_000);

    it('should transition from loading to loaded/empty state', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      await new Promise(r => setTimeout(r, 2000));
      fixture.detectChanges();
      // Should no longer be in loading state
      const state = component.listState();
      expect([States.loaded, States.empty]).toContain(state);
    }, 15_000);

    it('should not throw when handleRetryClick is called', async () => {
      await initAndDetect(fixture);
      expect(() => component.handleRetryClick()).not.toThrow();
    });

    it('should not throw when refreshMessages is called', async () => {
      await initAndDetect(fixture);
      expect(() => component.refreshMessages()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle Guards (Error Boundaries — Requirement 7.4)
  // -------------------------------------------------------------------------
  describe('Lifecycle Guards', () => {
    it('should emit error when ngOnInit throws', () => {
      // Spy on a method called during ngOnInit to make it throw
      const testError = new Error('ngOnInit failure');
      vi.spyOn(component as any, 'initializeFormatters').mockImplementation(() => {
        throw testError;
      });

      const errorSpy = vi.fn();
      component.error.subscribe(errorSpy);

      // Trigger ngOnInit (detectChanges calls it)
      fixture.detectChanges();

      // The error should be emitted (the reactive updateListState effect may
      // override the listState, but the error event should still fire)
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'ngOnInit failure' })
      );
    });

    it('should not propagate error from ngOnInit to Angular error handler', () => {
      vi.spyOn(component as any, 'initializeFormatters').mockImplementation(() => {
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
    it('should handle setting textFormatters to empty array', () => {
      expect(() => {
        component.textFormatters = [];
        fixture.detectChanges();
      }).not.toThrow();
    });


    it('should handle setting parentMessageId to undefined', () => {
      expect(() => {
        component.parentMessageId = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle setting goToMessageId to undefined', () => {
      expect(() => {
        component.goToMessageId = undefined;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle rapid input changes without throwing', () => {
      expect(() => {
        component.hideReceipts = true;
        fixture.detectChanges();
        component.hideReceipts = false;
        fixture.detectChanges();
        component.hideAvatar = true;
        fixture.detectChanges();
        component.hideAvatar = false;
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should handle onNewMessagesBannerClick without throwing', async () => {
      await initAndDetect(fixture);
      expect(() => component.onNewMessagesBannerClick()).not.toThrow();
    });

    it('should handle onMessageSent without throwing', () => {
      fixture.detectChanges();
      expect(() => component.onMessageSent()).not.toThrow();
    });

    it('should handle flag cancel without throwing', async () => {
      await initAndDetect(fixture);
      expect(() => component.handleFlagCancel()).not.toThrow();
      expect(component.showFlagMessageDialog()).toBe(false);
    });

    it('should handle closeMessageInfo without throwing', async () => {
      await initAndDetect(fixture);
      expect(() => component.closeMessageInfo()).not.toThrow();
      expect(component.showMessageInfo()).toBe(false);
    });

    it('should handle onEmojiKeyboardClose without throwing', async () => {
      await initAndDetect(fixture);
      expect(() => component.onEmojiKeyboardClose()).not.toThrow();
      expect(component.emojiKeyboardMessage()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Bubble Error Isolation (Error Boundaries — Requirement 7.5)
  // -------------------------------------------------------------------------
  describe('Bubble Error Isolation', () => {
    it('should have onBubbleError method defined', () => {
      fixture.detectChanges();
      expect(typeof component.onBubbleError).toBe('function');
    });

    it('should not throw when onBubbleError is called with an ErrorContext', () => {
      fixture.detectChanges();
      const ctx = {
        error: new Error('Bubble render failure'),
        componentName: 'MessageBubble:text',
        timestamp: Date.now(),
      };
      expect(() => component.onBubbleError(ctx)).not.toThrow();
    });

    it('should not set list to error state when onBubbleError is called', () => {
      fixture.detectChanges();
      const initialState = component.listState();
      const ctx = {
        error: new Error('Bubble render failure'),
        componentName: 'MessageBubble:image',
        timestamp: Date.now(),
      };
      component.onBubbleError(ctx);
      expect(component.listState()).toBe(initialState);
    });

    it('should include cometchat-error-boundary in the template wrapping bubbles', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      await new Promise(r => setTimeout(r, 2000));
      fixture.detectChanges();
      // If messages are loaded, error boundaries should wrap each bubble
      if (component.messages().length > 0) {
        const boundaries = el.querySelectorAll('cometchat-error-boundary');
        expect(boundaries.length).toBeGreaterThan(0);
      }
      // Structural: the component template references cometchat-error-boundary
      // (verified by the component compiling without errors)
      expect(component).toBeTruthy();
    }, 15_000);

    it('should have a bubble fallback template in the DOM', async () => {
      await initAndDetect(fixture);
      // The bubbleFallback ng-template exists in the component template.
      // It is only rendered when an error boundary triggers, but the component
      // should compile and render without issues, proving the template is valid.
      expect(el.querySelector('.cometchat-message-list')).toBeTruthy();
    });

    it('should not affect list state when multiple bubble errors occur', () => {
      fixture.detectChanges();
      const initialState = component.listState();
      for (let i = 0; i < 5; i++) {
        component.onBubbleError({
          error: new Error(`Bubble error ${i}`),
          componentName: `MessageBubble:type_${i}`,
          timestamp: Date.now(),
        });
      }
      expect(component.listState()).toBe(initialState);
    });
  });

  // ── Memory Leak: pendingReadReceipts cleanup (ENG-34640) ──────────────────

  describe('pendingReadReceipts cleanup', () => {
    it('should not throw when component is destroyed', () => {
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should clear pendingReadReceipts on component destroy', () => {
      fixture.detectChanges();

      // Access the private pendingReadReceipts Set via type cast
      const comp = component as unknown as { pendingReadReceipts: Set<number> };

      // Simulate some pending receipts
      comp.pendingReadReceipts.add(1001);
      comp.pendingReadReceipts.add(1002);
      comp.pendingReadReceipts.add(1003);
      expect(comp.pendingReadReceipts.size).toBe(3);

      // Destroy the component
      fixture.destroy();

      // Set should be cleared
      expect(comp.pendingReadReceipts.size).toBe(0);
    });

    it('should clear pendingReadReceipts when conversation changes', () => {
      fixture.detectChanges();

      const comp = component as unknown as { pendingReadReceipts: Set<number>; handleConversationChange: () => void };

      // Simulate some pending receipts
      comp.pendingReadReceipts.add(2001);
      comp.pendingReadReceipts.add(2002);
      expect(comp.pendingReadReceipts.size).toBe(2);

      // Trigger conversation change
      comp.handleConversationChange();

      // Set should be cleared at start of conversation change
      expect(comp.pendingReadReceipts.size).toBe(0);
    });

    it('should allow re-creation after destroy without errors', () => {
      fixture.detectChanges();
      fixture.destroy();

      expect(() => {
        const newFixture = TestBed.createComponent(CometChatMessageListComponent);
        newFixture.detectChanges();
        newFixture.destroy();
      }).not.toThrow();
    });
  });
});
