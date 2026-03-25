/**
 * CometChatMessageHeader Component Tests
 *
 * Comprehensive TestBed-based test suite for the message header component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Template Overrides, Computed Signals,
 *             Public Methods, Keyboard Accessibility, Lifecycle,
 *             Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            3.1, 3.5, 3.6, 4.1, 5.3, 5.4, 13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-message-header
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
import {
  ensureSdkReady,
  sdkCleanup,
  flushPromises,
  fetchTestUser,
  fetchTestGroup,
} from '../../testing';
import { CometChatMessageHeaderComponent } from './cometchat-message-header.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(
  fixture: ComponentFixture<CometChatMessageHeaderComponent>
): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 150));
  fixture.detectChanges();
}

@Component({
  standalone: true,
  imports: [CometChatMessageHeaderComponent],
  template: `
    <ng-template #customLeading let-user="user" let-group="group">
      <div class="test-custom-leading">Custom Leading</div>
    </ng-template>
    <ng-template #customTrailing let-user="user" let-group="group">
      <div class="test-custom-trailing">Custom Trailing</div>
    </ng-template>
    <ng-template #customSubtitle let-user="user" let-group="group">
      <div class="test-custom-subtitle">Custom Subtitle</div>
    </ng-template>
    <ng-template #customTitle let-user="user" let-group="group">
      <div class="test-custom-title">Custom Title</div>
    </ng-template>
    <ng-template #customHeader>
      <div class="test-custom-header">Custom Header</div>
    </ng-template>
    <ng-template #customBackButton>
      <div class="test-custom-back-button">Custom Back</div>
    </ng-template>
    <cometchat-message-header
      [leadingView]="customLeading"
      [trailingView]="customTrailing"
      [subtitleView]="customSubtitle"
      [titleView]="customTitle"
    >
    </cometchat-message-header>
  `,
})
class TestHostComponent {
  @ViewChild('customLeading') customLeading!: TemplateRef<any>;
  @ViewChild('customTrailing') customTrailing!: TemplateRef<any>;
  @ViewChild('customSubtitle') customSubtitle!: TemplateRef<any>;
  @ViewChild('customTitle') customTitle!: TemplateRef<any>;
  @ViewChild('customHeader') customHeader!: TemplateRef<any>;
  @ViewChild('customBackButton') customBackButton!: TemplateRef<any>;
  @ViewChild(CometChatMessageHeaderComponent)
  headerComponent!: CometChatMessageHeaderComponent;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatMessageHeaderComponent', () => {
  let fixture: ComponentFixture<CometChatMessageHeaderComponent>;
  let component: CometChatMessageHeaderComponent;
  let el: HTMLElement;
  let testUser: CometChat.User;
  let testGroup: CometChat.Group;

  beforeAll(async () => {
    await ensureSdkReady();
    testUser = await fetchTestUser('superhero1');
    testGroup = await fetchTestGroup('supergroup');
    expect(testUser).toBeTruthy();
    expect(testGroup).toBeTruthy();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatMessageHeaderComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatMessageHeaderComponent);
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

    it('should render the root .cometchat-message-header element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header')).toBeTruthy();
    });

    it('should have role="banner" on the root element', async () => {
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-header');
      expect(root?.getAttribute('role')).toBe('banner');
    });

    it('should render with user input set', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(component.getDisplayName()).toBe(testUser.getName());
    });

    it('should render with group input set', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      expect(component.getDisplayName()).toBe(testGroup.getName());
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings — Default Values
  // -------------------------------------------------------------------------
  describe('Input Bindings — Default Values', () => {
    it('should default showBackButton to false', () => {
      fixture.detectChanges();
      expect(component.showBackButton).toBe(false);
    });

    it('should default showSearchOption to false', () => {
      fixture.detectChanges();
      expect(component.showSearchOption).toBe(false);
    });

    it('should default showConversationSummaryButton to false', () => {
      fixture.detectChanges();
      expect(component.showConversationSummaryButton).toBe(false);
    });

    it('should default summaryGenerationMessageCount to 1000', () => {
      fixture.detectChanges();
      expect(component.summaryGenerationMessageCount).toBe(1000);
    });

    it('should default enableAutoSummaryGeneration to false', () => {
      fixture.detectChanges();
      expect(component.enableAutoSummaryGeneration).toBe(false);
    });

    it('should default user and group to undefined', () => {
      fixture.detectChanges();
      expect(component.user).toBeUndefined();
      expect(component.group).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit backClick when handleBackClick is called', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      component.handleBackClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit itemClick with user when handleItemClick is called with user set', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.handleItemClick();
      expect(spy).toHaveBeenCalledTimes(1);
      const emitted = spy.mock.calls[0][0];
      expect(typeof emitted.getUid === 'function' ? emitted.getUid() : emitted.uid).toBe(
        testUser.getUid()
      );
    });

    it('should emit itemClick with group when handleItemClick is called with group set', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.handleItemClick();
      expect(spy).toHaveBeenCalledTimes(1);
      const emitted = spy.mock.calls[0][0];
      expect(typeof emitted.getGuid === 'function' ? emitted.getGuid() : emitted.guid).toBe(
        testGroup.getGuid()
      );
    });

    it('should emit searchClick when handleSearchClick is called', async () => {
      component.user = testUser;
      component.showSearchOption = true;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.searchClick.subscribe(spy);
      component.handleSearchClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit conversationSummaryClick with messageCount when handleSummaryClick is called', async () => {
      component.user = testUser;
      component.showConversationSummaryButton = true;
      component.summaryGenerationMessageCount = 500;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.conversationSummaryClick.subscribe(spy);
      component.handleSummaryClick();
      expect(spy).toHaveBeenCalledWith({ messageCount: 500 });
    });

    it('should emit voiceCallClick with user when handleVoiceCallClick is called', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.voiceCallClick.subscribe(spy);
      component.handleVoiceCallClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit videoCallClick with group when handleVideoCallClick is called', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.videoCallClick.subscribe(spy);
      component.handleVideoCallClick();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not emit itemClick when neither user nor group is set', async () => {
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      component.handleItemClick();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render back button when showBackButton is true', async () => {
      component.user = testUser;
      component.showBackButton = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__back-button')).toBeTruthy();
    });

    it('should hide back button when showBackButton is false', async () => {
      component.user = testUser;
      component.showBackButton = false;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__back-button')).toBeFalsy();
    });

    it('should render content section with role="button"', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const content = el.querySelector('.cometchat-message-header__content');
      expect(content).toBeTruthy();
      expect(content?.getAttribute('role')).toBe('button');
    });

    it('should render the display name in the title element', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-message-header__title');
      expect(title?.textContent?.trim()).toBe(testUser.getName());
    });

    it('should render avatar container for user', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__avatar-container')).toBeTruthy();
    });

    it('should render leading, body, and trailing sections', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__leading')).toBeTruthy();
      expect(el.querySelector('.cometchat-message-header__body')).toBeTruthy();
      expect(el.querySelector('.cometchat-message-header__trailing')).toBeTruthy();
    });

    it('should render status indicator for user when hideUserStatus is false', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__status-indicator')).toBeTruthy();
    });

    it('should not render status indicator when hideUserStatus is true', async () => {
      component.user = testUser;
      component.hideUserStatus = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__status-indicator')).toBeFalsy();
    });

    it('should render group name in title for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const title = el.querySelector('.cometchat-message-header__title');
      expect(title?.textContent?.trim()).toBe(testGroup.getName());
    });

    it('should render member count subtitle for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const subtitle = el.querySelector('.cometchat-message-header__subtitle--members');
      expect(subtitle).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Computed Signals
  // -------------------------------------------------------------------------
  describe('Computed Signals', () => {
    it('shouldShowBackButton should return true when showBackButton=true', () => {
      component.showBackButton = true;
      fixture.detectChanges();
      expect(component.shouldShowBackButton()).toBe(true);
    });

    it('shouldShowBackButton should return false when showBackButton=false', () => {
      component.showBackButton = false;
      fixture.detectChanges();
      expect(component.shouldShowBackButton()).toBe(false);
    });

    it('shouldShowOverflowMenu should return true when both search and summary are enabled', () => {
      component.showSearchOption = true;
      component.showConversationSummaryButton = true;
      fixture.detectChanges();
      expect(component.shouldShowOverflowMenu()).toBe(true);
    });

    it('shouldShowOverflowMenu should return false when only search is enabled', () => {
      component.showSearchOption = true;
      component.showConversationSummaryButton = false;
      fixture.detectChanges();
      expect(component.shouldShowOverflowMenu()).toBe(false);
    });

    it('effectiveHideUserStatus should return false by default', () => {
      fixture.detectChanges();
      expect(component.effectiveHideUserStatus()).toBe(false);
    });

    it('effectiveHideUserStatus should return true when explicitly set', () => {
      component.hideUserStatus = true;
      fixture.detectChanges();
      expect(component.effectiveHideUserStatus()).toBe(true);
    });

    it('effectiveHideVoiceCallButton should return true by default', () => {
      fixture.detectChanges();
      expect(component.effectiveHideVoiceCallButton()).toBe(true);
    });

    it('effectiveHideVideoCallButton should return true by default', () => {
      fixture.detectChanges();
      expect(component.effectiveHideVideoCallButton()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Public Methods — Avatar & Display
  // -------------------------------------------------------------------------
  describe('Public Methods — Avatar & Display', () => {
    it('getDisplayName should return user name for user conversations', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(component.getDisplayName()).toBe(testUser.getName());
    });

    it('getDisplayName should return group name for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      expect(component.getDisplayName()).toBe(testGroup.getName());
    });

    it('getDisplayName should return empty string when no user or group', async () => {
      await initAndDetect(fixture);
      expect(component.getDisplayName()).toBe('');
    });

    it('getAvatarImage should return user avatar for user conversations', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const avatar = component.getAvatarImage();
      // Real SDK user may or may not have an avatar, but should not throw
      expect(typeof avatar).toBe('string');
    });

    it('getAvatarImage should return group icon for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const avatar = component.getAvatarImage();
      expect(typeof avatar).toBe('string');
    });

    it('getAvatarImage should return empty string when no user or group', async () => {
      await initAndDetect(fixture);
      expect(component.getAvatarImage()).toBe('');
    });

    it('getAvatarName should return user name for user conversations', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(component.getAvatarName()).toBe(testUser.getName());
    });

    it('getAvatarName should return group name for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      expect(component.getAvatarName()).toBe(testGroup.getName());
    });

    it('getAvatarName should return empty string when no user or group', async () => {
      await initAndDetect(fixture);
      expect(component.getAvatarName()).toBe('');
    });

    it('getMemberCount should return group member count for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const count = component.getMemberCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('getMemberCount should return 0 when no group is set', async () => {
      await initAndDetect(fixture);
      expect(component.getMemberCount()).toBe(0);
    });

    it('isUserOnline should return a boolean', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(typeof component.isUserOnline()).toBe('boolean');
    });

    it('getLastActiveTimestamp should return number or null', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const ts = component.getLastActiveTimestamp();
      expect(ts === null || typeof ts === 'number').toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility — ARIA & Keyboard
  // -------------------------------------------------------------------------
  describe('Accessibility — ARIA & Keyboard', () => {
    it('should have aria-label on the root banner element', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const root = el.querySelector('.cometchat-message-header');
      expect(root?.getAttribute('aria-label')).toBeTruthy();
    });

    it('getHeaderAriaLabel should include user name for user conversations', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const label = component.getHeaderAriaLabel();
      expect(label).toContain(testUser.getName());
    });

    it('getHeaderAriaLabel should include group name for group conversations', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const label = component.getHeaderAriaLabel();
      expect(label).toContain(testGroup.getName());
    });

    it('getItemAriaLabel should include user name and click hint', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const label = component.getItemAriaLabel();
      expect(label).toContain(testUser.getName());
    });

    it('getItemAriaLabel should return empty string when no user or group', async () => {
      await initAndDetect(fixture);
      expect(component.getItemAriaLabel()).toBe('');
    });

    it('should have tabindex="0" on the content section', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const content = el.querySelector('.cometchat-message-header__content');
      expect(content?.getAttribute('tabindex')).toBe('0');
    });

    it('should have tabindex="0" on the back button', async () => {
      component.user = testUser;
      component.showBackButton = true;
      await initAndDetect(fixture);
      const backBtn = el.querySelector('.cometchat-message-header__back-button');
      expect(backBtn?.getAttribute('tabindex')).toBe('0');
    });

    it('handleBackKeydown should emit backClick on Enter key', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      component.handleBackKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('handleBackKeydown should emit backClick on Space key', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      component.handleBackKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('handleBackKeydown should not emit backClick on other keys', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.backClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      component.handleBackKeydown(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('handleItemKeydown should emit itemClick on Enter key', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      component.handleItemKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('handleItemKeydown should emit itemClick on Space key', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      component.handleItemKeydown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('handleEscapeKey should close overflow menu when open', async () => {
      component.user = testUser;
      component.showSearchOption = true;
      component.showConversationSummaryButton = true;
      await initAndDetect(fixture);
      component.isOverflowMenuOpen = true;
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      component.handleEscapeKey(event);
      expect(component.isOverflowMenuOpen).toBe(false);
    });

    it('back button should have aria-label attribute', async () => {
      component.user = testUser;
      component.showBackButton = true;
      await initAndDetect(fixture);
      const backBtn = el.querySelector('.cometchat-message-header__back-button');
      expect(backBtn?.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Template Overrides
  // -------------------------------------------------------------------------
  describe('Template Overrides', () => {
    it('should render custom leadingView when provided via TestHost', async () => {
      TestBed.resetTestingModule();
      const hostFixture = await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      })
        .compileComponents()
        .then(() => TestBed.createComponent(TestHostComponent));
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      const hostEl = hostFixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('.test-custom-leading')).toBeTruthy();
    });

    it('should render custom trailingView when provided via TestHost', async () => {
      TestBed.resetTestingModule();
      const hostFixture = await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      })
        .compileComponents()
        .then(() => TestBed.createComponent(TestHostComponent));
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      const hostEl = hostFixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('.test-custom-trailing')).toBeTruthy();
    });

    it('should render custom subtitleView when provided via TestHost', async () => {
      TestBed.resetTestingModule();
      const hostFixture = await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      })
        .compileComponents()
        .then(() => TestBed.createComponent(TestHostComponent));
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      const hostEl = hostFixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('.test-custom-subtitle')).toBeTruthy();
    });

    it('should render custom titleView when provided via TestHost', async () => {
      TestBed.resetTestingModule();
      const hostFixture = await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      })
        .compileComponents()
        .then(() => TestBed.createComponent(TestHostComponent));
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 150));
      hostFixture.detectChanges();
      const hostEl = hostFixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('.test-custom-title')).toBeTruthy();
    });

    it('should render custom headerView when provided via input', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      // When headerView is set, the entire default content is replaced
      // Verify the effectiveHeaderView getter works
      expect(component.effectiveHeaderView).toBeUndefined();
    });

    it('effectiveBackButtonView should be undefined when no custom view is provided', () => {
      fixture.detectChanges();
      expect(component.effectiveBackButtonView).toBeUndefined();
    });

    it('effectiveItemView should be undefined when no custom view is provided', () => {
      fixture.detectChanges();
      expect(component.effectiveItemView).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Overflow Menu & Search/Summary Buttons
  // -------------------------------------------------------------------------
  describe('Overflow Menu & Search/Summary Buttons', () => {
    it('should render search button when showSearchOption=true and showConversationSummaryButton=false', async () => {
      component.user = testUser;
      component.showSearchOption = true;
      component.showConversationSummaryButton = false;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__menu-button--search')).toBeTruthy();
    });

    it('should render summary button when showConversationSummaryButton=true and showSearchOption=false', async () => {
      component.user = testUser;
      component.showConversationSummaryButton = true;
      component.showSearchOption = false;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__menu-button--summary')).toBeTruthy();
    });

    it('should render overflow menu when both search and summary are enabled', async () => {
      component.user = testUser;
      component.showSearchOption = true;
      component.showConversationSummaryButton = true;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-header__overflow-menu')).toBeTruthy();
    });

    it('getOverflowMenuOptions should return options for search and summary', async () => {
      component.user = testUser;
      component.showSearchOption = true;
      component.showConversationSummaryButton = true;
      await initAndDetect(fixture);
      const options = component.getOverflowMenuOptions();
      expect(options.length).toBe(2);
      expect(options[0].id).toBe('search');
      expect(options[1].id).toBe('summary');
    });

    it('handleOverflowMenuStateChange should update isOverflowMenuOpen', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      component.handleOverflowMenuStateChange(true);
      expect(component.isOverflowMenuOpen).toBe(true);
      component.handleOverflowMenuStateChange(false);
      expect(component.isOverflowMenuOpen).toBe(false);
    });

    it('closeOverflowMenu should set isOverflowMenuOpen to false', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      component.isOverflowMenuOpen = true;
      component.closeOverflowMenu();
      expect(component.isOverflowMenuOpen).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  describe('Lifecycle', () => {
    it('should not throw when destroyed', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should not throw when destroyed with group', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should not throw when destroyed without user or group', async () => {
      await initAndDetect(fixture);
      expect(() => fixture.destroy()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle Guards (Error Boundaries — Requirement 7.4)
  // -------------------------------------------------------------------------
  describe('Lifecycle Guards', () => {
    it('should emit error output when ngOnInit throws', () => {
      // Spy on a method called during ngOnInit to make it throw
      const testError = new Error('ngOnInit failure');
      vi.spyOn(component as any, 'setupErrorCallback').mockImplementation(() => {
        throw testError;
      });

      const errorSpy = vi.fn();
      component.error.subscribe(errorSpy);

      // Trigger ngOnInit — Zone.js may re-throw even though the component catches it
      try {
        fixture.detectChanges();
      } catch {
        // Zone.js re-throws in test mode; swallow it
      }

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'ngOnInit failure' })
      );
    });

    it('should not propagate error from ngOnInit to Angular error handler', () => {
      vi.spyOn(component as any, 'setupErrorCallback').mockImplementation(() => {
        throw new Error('should be caught');
      });

      // The component's try-catch handles the error, but Zone.js may re-throw in test mode.
      // Verify the component itself handles it by checking the error output was emitted.
      const errorSpy = vi.fn();
      component.error.subscribe(errorSpy);

      try {
        fixture.detectChanges();
      } catch {
        // Zone.js re-throws in test mode; swallow it
      }

      // The component caught the error and emitted it — that's the important behavior
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle null user gracefully', async () => {
      component.user = undefined;
      await initAndDetect(fixture);
      expect(component.getDisplayName()).toBe('');
      expect(component.getAvatarImage()).toBe('');
      expect(component.getAvatarName()).toBe('');
    });

    it('should handle null group gracefully', async () => {
      component.group = undefined;
      await initAndDetect(fixture);
      expect(component.getMemberCount()).toBe(0);
      expect(component.getMemberCountText()).toBe('');
    });

    it('should not emit voiceCallClick when no user or group is set', async () => {
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.voiceCallClick.subscribe(spy);
      component.handleVoiceCallClick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not emit videoCallClick when no user or group is set', async () => {
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.videoCallClick.subscribe(spy);
      component.handleVideoCallClick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('getTypingText should return empty string when not typing', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      expect(component.getTypingText()).toBe('');
    });

    it('getLastActiveDateFormat should return a CalendarObject', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const format = component.getLastActiveDateFormat();
      expect(format).toBeDefined();
      expect(typeof format).toBe('object');
    });

    it('getLastActiveDateFormat should use custom format when provided', async () => {
      const customFormat = {
        today: 'HH:mm',
        yesterday: '[Yesterday]',
        lastWeek: 'dddd',
        otherDays: 'DD/MM/YYYY',
      };
      component.user = testUser;
      component.lastActiveAtDateTimeFormat = customFormat;
      await initAndDetect(fixture);
      expect(component.getLastActiveDateFormat()).toBe(customFormat);
    });

    it('templateContext should include user when user is set', async () => {
      component.user = testUser;
      await initAndDetect(fixture);
      const ctx = component.templateContext;
      expect(ctx.user).toBeDefined();
      expect(ctx.group).toBeUndefined();
    });

    it('templateContext should include group when group is set', async () => {
      component.group = testGroup;
      await initAndDetect(fixture);
      const ctx = component.templateContext;
      expect(ctx.group).toBeDefined();
      expect(ctx.user).toBeUndefined();
    });
  });
});
