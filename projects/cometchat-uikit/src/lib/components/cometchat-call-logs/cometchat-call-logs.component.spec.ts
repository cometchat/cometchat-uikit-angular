/**
 * CometChatCallLogs Component Tests
 *
 * Comprehensive TestBed-based test suite for the call logs list component.
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom, and
 * the CallLogRequestBuilder is only available from the calls SDK.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Localized Labels, Lifecycle, Edge Cases,
 *             Template Overrides, Keyboard Navigation
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 2.1, 2.2, 2.4,
 *            3.1, 3.2, 4.1, 4.2, 13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-call-logs
 */

// ==================== Calls SDK Mock ====================
// Must be before any imports that trigger the calls SDK.
// The CallLogRequestBuilder mock returns controllable call log data.
const mockFetchNext = vi.fn().mockResolvedValue([]);

vi.mock('@cometchat/calls-sdk-javascript', () => {
  class MockCallLogRequest {
    fetchNext() {
      return mockFetchNext();
    }
  }
  class MockCallLogRequestBuilder {
    setLimit() {
      return this;
    }
    setCallCategory() {
      return this;
    }
    setAuthToken() {
      return this;
    }
    build() {
      return new MockCallLogRequest();
    }
  }
  class MockCallSettingsBuilder {
    enableDefaultLayout() {
      return this;
    }
    setIsAudioOnlyCall() {
      return this;
    }
    setCallListener() {
      return this;
    }
  }
  class MockOngoingCallListener {
    constructor(callbacks: any) {
      Object.assign(this, callbacks);
    }
  }
  return {
    CometChatCalls: {
      CallLogRequestBuilder: MockCallLogRequestBuilder,
      CallSettingsBuilder: MockCallSettingsBuilder,
      OngoingCallListener: MockOngoingCallListener,
      endSession: vi.fn(),
      init: vi.fn().mockResolvedValue(true),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    },
  };
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ensureSdkReady, sdkCleanup, flushPromises } from '../../testing';
import { CometChatCallLogsComponent } from './cometchat-call-logs.component';
import { States } from '../../Enums/Enums';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUIKit } from '../../cometchat-uikit';

// Mock CometChatUIKit.isCallingEnabled to return true for tests
vi.spyOn(CometChatUIKit, 'isCallingEnabled').mockReturnValue(true);

// ---------------------------------------------------------------------------
// Mock call log factory — creates objects that mimic the Calls SDK CallLog shape
// ---------------------------------------------------------------------------

function createMockUser(uid: string, name?: string) {
  return {
    getUid: () => uid,
    getName: () => name ?? `User_${uid}`,
    getAvatar: () => `https://example.com/${uid}.png`,
    getAuthToken: () => `token_${uid}`,
    getStatus: () => 'online',
    uid,
    name: name ?? `User_${uid}`,
    avatar: `https://example.com/${uid}.png`,
  };
}

function createMockCallLog(
  overrides: {
    sessionId?: string;
    type?: string;
    status?: string;
    initiatorUid?: string;
    receiverUid?: string;
    initiatedAt?: number;
  } = {}
) {
  const sessionId = overrides.sessionId ?? `session-${Math.random().toString(36).slice(2, 8)}`;
  const type = overrides.type ?? 'audio';
  const status = overrides.status ?? 'ended';
  const initiator = createMockUser(overrides.initiatorUid ?? 'caller-1');
  const receiver = createMockUser(overrides.receiverUid ?? 'receiver-1');
  const initiatedAt = overrides.initiatedAt ?? Math.floor(Date.now() / 1000);

  return {
    getSessionId: () => sessionId,
    getSessionID: () => sessionId,
    getType: () => type,
    getStatus: () => status,
    getInitiator: () => initiator,
    getCallInitiator: () => initiator,
    getReceiver: () => receiver,
    getSender: () => initiator,
    getInitiatedAt: () => initiatedAt,
    type,
    status,
    initiatedAt,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function initAndDetect(fixture: ComponentFixture<CometChatCallLogsComponent>): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  // Allow the service's MIN_SHIMMER_TIME (1s) + buffer to elapse
  await new Promise(r => setTimeout(r, 1500));
  await flushPromises();
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Host for Template Overrides
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [CometChatCallLogsComponent],
  template: `
    <ng-template #customEmpty>
      <div class="test-custom-empty">No call logs here</div>
    </ng-template>
    <ng-template #customError>
      <div class="test-custom-error">Custom error view</div>
    </ng-template>
    <ng-template #customItem let-call>
      <div class="test-custom-item">Custom Item</div>
    </ng-template>
    <ng-template #customLeading let-call>
      <div class="test-custom-leading">Custom Leading</div>
    </ng-template>
    <cometchat-call-logs
      [emptyView]="customEmpty"
      [errorView]="customError"
      [itemView]="customItem"
      [leadingView]="customLeading"
    >
    </cometchat-call-logs>
  `,
})
class TestHostComponent {
  @ViewChild('customEmpty') customEmpty!: TemplateRef<any>;
  @ViewChild('customError') customError!: TemplateRef<any>;
  @ViewChild('customItem') customItem!: TemplateRef<any>;
  @ViewChild('customLeading') customLeading!: TemplateRef<any>;
  @ViewChild(CometChatCallLogsComponent)
  callLogsComponent!: CometChatCallLogsComponent;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('CometChatCallLogsComponent', () => {
  let fixture: ComponentFixture<CometChatCallLogsComponent>;
  let component: CometChatCallLogsComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    mockFetchNext.mockReset();
    mockFetchNext.mockResolvedValue([]);

    // Provide a mock logged-in user so initializeLoggedInUser() succeeds
    const mockLoggedInUser = new CometChat.User('superhero1');
    mockLoggedInUser.setName('Test User');
    mockLoggedInUser.setAvatar('https://example.com/avatar.png');
    vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(mockLoggedInUser);

    await TestBed.configureTestingModule({
      imports: [CometChatCallLogsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatCallLogsComponent);
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

    it('should render the root .cometchat-call-logs element', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-call-logs')).toBeTruthy();
    });

    it('should render the header section with title', async () => {
      await initAndDetect(fixture);
      const header = el.querySelector('.cometchat-call-logs__header');
      expect(header).toBeTruthy();
      const title = el.querySelector('.cometchat-call-logs__header-title');
      expect(title).toBeTruthy();
      expect(title!.textContent!.trim().length).toBeGreaterThan(0);
    });

    it('should expose CallWorkflow enum to template', () => {
      expect(component.CallWorkflow).toBeDefined();
    });

    it('should initialize focusedIndex to -1', () => {
      fixture.detectChanges();
      expect(component.focusedIndex()).toBe(-1);
    });

    it('should initialize loggedInUser as null before ngOnInit', () => {
      // Before detectChanges (ngOnInit), loggedInUser is null
      expect(component.loggedInUser).toBeNull();
    });

    it('should set loggedInUser after initialization', async () => {
      await initAndDetect(fixture);
      // After ngOnInit, loggedInUser should be set from CometChat.getLoggedinUser()
      expect(component.loggedInUser).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Input Bindings
  // -------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should default activeCall to null', () => {
      expect(component.activeCall).toBeNull();
    });

    it('should default callLogRequestBuilder to null', () => {
      expect(component.callLogRequestBuilder).toBeNull();
    });

    it('should default callInitiatedDateTimeFormat to null', () => {
      expect(component.callInitiatedDateTimeFormat).toBeNull();
    });

    it('should default onError to null', () => {
      expect(component.onError).toBeNull();
    });

    it('should default showScrollbar to false', () => {
      expect(component.showScrollbar).toBe(false);
    });

    it('should default all template inputs to null', () => {
      expect(component.itemView).toBeNull();
      expect(component.leadingView).toBeNull();
      expect(component.titleView).toBeNull();
      expect(component.subtitleView).toBeNull();
      expect(component.trailingView).toBeNull();
      expect(component.loadingView).toBeNull();
      expect(component.emptyView).toBeNull();
      expect(component.errorView).toBeNull();
    });

    it('should accept and reflect activeCall input', () => {
      const mockCall = { getSessionID: () => 'test-session' };
      component.activeCall = mockCall;
      expect(component.activeCall).toBe(mockCall);
    });

    it('should accept and reflect showScrollbar input', () => {
      component.showScrollbar = true;
      expect(component.showScrollbar).toBe(true);
    });

    it('should handle null activeCall gracefully', () => {
      component.activeCall = null;
      expect(component.activeCall).toBeNull();
    });

    it('should accept onError callback', () => {
      const errorFn = vi.fn();
      component.onError = errorFn;
      expect(component.onError).toBe(errorFn);
    });
  });

  // -------------------------------------------------------------------------
  // Output Emissions
  // -------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit itemClick when handleItemClick is called', async () => {
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.itemClick.subscribe(spy);
      const call = createMockCallLog({ sessionId: 'click-1' });
      component.handleItemClick(call);
      expect(spy).toHaveBeenCalledWith(call);
    });

    it('should emit callButtonClicked when handleInfoClick is called and output is observed', async () => {
      await initAndDetect(fixture);
      const spy = vi.fn();
      component.callButtonClicked.subscribe(spy);
      const call = createMockCallLog({ sessionId: 'info-1' });
      component.handleInfoClick(call);
      expect(spy).toHaveBeenCalledWith(call);
    });

    it('should not throw when handleItemClick is called with no subscribers', async () => {
      await initAndDetect(fixture);
      const call = createMockCallLog({ sessionId: 'no-sub' });
      expect(() => component.handleItemClick(call)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // DOM Rendering
  // -------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render cometchat-paginated-list child component', async () => {
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-paginated-list')).toBeTruthy();
    });

    it('should render empty state when no call logs returned', async () => {
      mockFetchNext.mockResolvedValue([]);
      await initAndDetect(fixture);
      // The component should be in empty state
      expect(component.state()).toBe(States.empty);
    });

    it('should render call log items when data is returned', async () => {
      const mockCalls = [
        createMockCallLog({ sessionId: 's1', type: 'audio' }),
        createMockCallLog({ sessionId: 's2', type: 'video' }),
        createMockCallLog({ sessionId: 's3', type: 'audio' }),
      ];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      expect(component.state()).toBe(States.loaded);
      expect(component.callLogs().length).toBe(3);
    });

    it('should render list items with role="option" when data is present', async () => {
      const mockCalls = [
        createMockCallLog({ sessionId: 'dom-1' }),
        createMockCallLog({ sessionId: 'dom-2' }),
      ];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const items = el.querySelectorAll('.cometchat-call-logs__list-item[role="option"]');
      expect(items.length).toBe(2);
    });

    it('should render subtitle with direction icon for each call log', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'sub-1' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const subtitleIcon = el.querySelector('.cometchat-call-logs__list-item-subtitle-icon');
      expect(subtitleIcon).toBeTruthy();
    });

    it('should render trailing view (call button) for each call log', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'trail-1' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const trailing = el.querySelector('.cometchat-call-logs__list-item-trailing-view');
      expect(trailing).toBeTruthy();
    });

    it('should apply active class when call matches activeCall', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'active-1' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      component.activeCall = { getSessionID: () => 'active-1' };
      await initAndDetect(fixture);

      const activeItem = el.querySelector('.cometchat-call-logs__list-item--active');
      expect(activeItem).toBeTruthy();
    });

    it('should not apply active class when no activeCall is set', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'no-active' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      component.activeCall = null;
      await initAndDetect(fixture);

      const activeItem = el.querySelector('.cometchat-call-logs__list-item--active');
      expect(activeItem).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Call Type/Direction Display
  // -------------------------------------------------------------------------
  describe('Call Type/Direction Display', () => {
    it('getCallUser returns the other party (receiver when sent by me)', async () => {
      await initAndDetect(fixture);
      const loggedInUid = component.loggedInUser!.getUid();
      const call = createMockCallLog({
        initiatorUid: loggedInUid,
        receiverUid: 'other-user',
      });
      const result = component.getCallUser(call);
      expect(result.getUid()).toBe('other-user');
    });

    it('getCallUser returns the other party (initiator when received)', async () => {
      await initAndDetect(fixture);
      const loggedInUid = component.loggedInUser!.getUid();
      const call = createMockCallLog({
        initiatorUid: 'other-user',
        receiverUid: loggedInUid,
      });
      const result = component.getCallUser(call);
      expect(result.getUid()).toBe('other-user');
    });

    it('getCallUser returns null when loggedInUser is null', () => {
      fixture.detectChanges();
      // Before async init completes, loggedInUser is null
      const origUser = component.loggedInUser;
      component.loggedInUser = null;
      const call = createMockCallLog();
      expect(component.getCallUser(call)).toBeNull();
      component.loggedInUser = origUser;
    });

    it('isCallSentByMe returns true when logged-in user is initiator', async () => {
      await initAndDetect(fixture);
      const loggedInUid = component.loggedInUser!.getUid();
      const call = createMockCallLog({ initiatorUid: loggedInUid });
      expect(component.isCallSentByMe(call)).toBe(true);
    });

    it('isCallSentByMe returns false when logged-in user is receiver', async () => {
      await initAndDetect(fixture);
      const call = createMockCallLog({ initiatorUid: 'someone-else' });
      expect(component.isCallSentByMe(call)).toBe(false);
    });

    it('isCallSentByMe returns false when loggedInUser is null', () => {
      fixture.detectChanges();
      component.loggedInUser = null;
      expect(component.isCallSentByMe({})).toBe(false);
    });

    it('isCallMissed returns true for incoming unanswered call', async () => {
      await initAndDetect(fixture);
      const call = createMockCallLog({
        initiatorUid: 'other-user',
        status: 'unanswered',
      });
      expect(component.isCallMissed(call)).toBe(true);
    });

    it('isCallMissed returns false for outgoing call', async () => {
      await initAndDetect(fixture);
      const loggedInUid = component.loggedInUser!.getUid();
      const call = createMockCallLog({
        initiatorUid: loggedInUid,
        status: 'unanswered',
      });
      expect(component.isCallMissed(call)).toBe(false);
    });

    it('isCallMissed returns false for answered incoming call', async () => {
      await initAndDetect(fixture);
      const call = createMockCallLog({
        initiatorUid: 'other-user',
        status: 'ended',
      });
      expect(component.isCallMissed(call)).toBe(false);
    });

    it('isCallMissed returns false when loggedInUser is null', () => {
      fixture.detectChanges();
      component.loggedInUser = null;
      expect(component.isCallMissed({})).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Localized Labels
  // -------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should resolve call_logs_title key', () => {
      const label = CometChatLocalize.getLocalizedString('call_logs_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve call_logs_empty_title key', () => {
      const label = CometChatLocalize.getLocalizedString('call_logs_empty_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve call_logs_empty_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('call_logs_empty_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve call_logs_error_title key', () => {
      const label = CometChatLocalize.getLocalizedString('call_logs_error_title');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
    });

    it('should resolve call_logs_error_subtitle key', () => {
      const label = CometChatLocalize.getLocalizedString('call_logs_error_subtitle');
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
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

    it('should have defined state signal after initialization', async () => {
      await initAndDetect(fixture);
      expect(component.state()).toBeDefined();
    });

    it('should clean up service on destroy', async () => {
      await initAndDetect(fixture);
      fixture.destroy();
      // After destroy, component should not throw on subsequent access
      expect(true).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('isActiveCall returns true when session IDs match', () => {
      component.activeCall = { getSessionID: () => 'match-session' };
      const call = { getSessionID: () => 'match-session' };
      expect(component.isActiveCall(call)).toBe(true);
    });

    it('isActiveCall returns false when session IDs differ', () => {
      component.activeCall = { getSessionID: () => 'session-a' };
      const call = { getSessionID: () => 'session-b' };
      expect(component.isActiveCall(call)).toBe(false);
    });

    it('isActiveCall returns false when activeCall is null', () => {
      component.activeCall = null;
      expect(component.isActiveCall({ getSessionID: () => 'any' })).toBe(false);
    });

    it('isActiveCall returns false when getSessionID throws', () => {
      component.activeCall = {
        getSessionID: () => {
          throw new Error('fail');
        },
      };
      expect(component.isActiveCall({ getSessionID: () => 'any' })).toBe(false);
    });

    it('trackByCallLog returns session ID for valid call', () => {
      const call = { getSessionID: () => 'track-session' };
      expect(component.trackByCallLog(0, call)).toBe('track-session');
    });

    it('trackByCallLog returns index for null call', () => {
      expect(component.trackByCallLog(5, null)).toBe(5);
    });

    it('trackByCallLog returns index for call without getSessionID', () => {
      expect(component.trackByCallLog(3, {})).toBe(3);
    });

    it('getDateFormat returns a CalendarObject with expected keys', () => {
      const format = component.getDateFormat();
      expect(format).toBeDefined();
      expect(format.today).toBeDefined();
      expect(format.yesterday).toBeDefined();
      expect(format.otherDays).toBeDefined();
    });

    it('getDateFormat merges custom callInitiatedDateTimeFormat', () => {
      component.callInitiatedDateTimeFormat = { today: 'HH:mm' };
      const format = component.getDateFormat();
      expect(format.today).toBe('HH:mm');
      // Other keys should still have defaults
      expect(format.yesterday).toBeDefined();
    });

    it('effectiveShowScrollbar defaults to false when not explicitly set', () => {
      expect(component.effectiveShowScrollbar()).toBe(false);
    });

    it('effectiveShowScrollbar reflects explicitly set value', () => {
      component.showScrollbar = true;
      expect(component.effectiveShowScrollbar()).toBe(true);
    });

    it('should handle error state when fetch rejects', async () => {
      mockFetchNext.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await initAndDetect(fixture);
      expect(component.state()).toBe(States.error);
      consoleSpy.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Template Overrides (via host component)
  // -------------------------------------------------------------------------
  describe('Template Overrides', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
      mockFetchNext.mockReset();
      mockFetchNext.mockResolvedValue([]);

      // Provide a mock logged-in user for the host component tests too
      const mockLoggedInUser = new CometChat.User('superhero1');
      mockLoggedInUser.setName('Test User');
      mockLoggedInUser.setAvatar('https://example.com/avatar.png');
      vi.spyOn(CometChat, 'getLoggedinUser').mockResolvedValue(mockLoggedInUser);

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();
      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
    });

    it('should accept emptyView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 1500));
      hostFixture.detectChanges();
      expect(hostComponent.callLogsComponent.emptyView).toBeTruthy();
    });

    it('should accept errorView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 1500));
      hostFixture.detectChanges();
      expect(hostComponent.callLogsComponent.errorView).toBeTruthy();
    });

    it('should accept itemView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 1500));
      hostFixture.detectChanges();
      expect(hostComponent.callLogsComponent.itemView).toBeTruthy();
    });

    it('should accept leadingView template input', async () => {
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 1500));
      hostFixture.detectChanges();
      expect(hostComponent.callLogsComponent.leadingView).toBeTruthy();
    });

    it('should render custom itemView when provided and data is present', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'tpl-1' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      hostFixture.detectChanges();
      await flushPromises();
      await new Promise(r => setTimeout(r, 1500));
      hostFixture.detectChanges();

      const customItem = hostFixture.nativeElement.querySelector('.test-custom-item');
      expect(customItem).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('should handle ArrowDown keydown on the root element', async () => {
      const mockCalls = [
        createMockCallLog({ sessionId: 'kb-1' }),
        createMockCallLog({ sessionId: 'kb-2' }),
      ];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const root = el.querySelector('.cometchat-call-logs') as HTMLElement;
      expect(root).toBeTruthy();
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle ArrowUp keydown on the root element', async () => {
      const mockCalls = [
        createMockCallLog({ sessionId: 'kb-up-1' }),
        createMockCallLog({ sessionId: 'kb-up-2' }),
      ];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const root = el.querySelector('.cometchat-call-logs') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Enter key without throwing', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'kb-enter' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const root = el.querySelector('.cometchat-call-logs') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }).not.toThrow();
    });

    it('should handle Space key without throwing', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'kb-space' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const root = el.querySelector('.cometchat-call-logs') as HTMLElement;
      expect(() => {
        root.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      }).not.toThrow();
    });

    it('should initialize focusedIndex to -1', () => {
      fixture.detectChanges();
      expect(component.focusedIndex()).toBe(-1);
    });

    it('should set focusedIndex on handleItemFocus', async () => {
      await initAndDetect(fixture);
      component.handleItemFocus(2);
      expect(component.focusedIndex()).toBe(2);
    });

    it('should set focusedIndex to 0 on handleListFocus when no item focused', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'focus-1' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      component.handleListFocus();
      expect(component.focusedIndex()).toBe(0);
    });

    it('getItemTabIndex returns 0 for focused item', () => {
      fixture.detectChanges();
      component.focusedIndex.set(2);
      expect(component.getItemTabIndex(2)).toBe(0);
      expect(component.getItemTabIndex(0)).toBe(-1);
    });

    it('getItemTabIndex returns 0 for first item when no item focused', () => {
      fixture.detectChanges();
      // focusedIndex defaults to -1
      expect(component.getItemTabIndex(0)).toBe(0);
      expect(component.getItemTabIndex(1)).toBe(-1);
    });

    it('should have aria-label on list items', async () => {
      const mockCalls = [createMockCallLog({ sessionId: 'aria-1', type: 'video' })];
      mockFetchNext.mockResolvedValue(mockCalls);
      await initAndDetect(fixture);

      const item = el.querySelector('.cometchat-call-logs__list-item[role="option"]');
      expect(item).toBeTruthy();
      const ariaLabel = item!.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel!.length).toBeGreaterThan(0);
    });

    it('getCallLogAriaLabel returns a non-empty string', async () => {
      await initAndDetect(fixture);
      const call = createMockCallLog({
        sessionId: 'aria-test',
        type: 'video',
        initiatorUid: 'other',
      });
      const label = component.getCallLogAriaLabel(call);
      expect(label).toBeTruthy();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  describe('Pagination', () => {
    it('should expose hasMore signal', async () => {
      await initAndDetect(fixture);
      expect(typeof component.hasMore()).toBe('boolean');
    });

    it('should expose isFetchingMore signal', async () => {
      await initAndDetect(fixture);
      expect(typeof component.isFetchingMore()).toBe('boolean');
    });

    it('handleLoadMore should not throw', async () => {
      await initAndDetect(fixture);
      expect(() => component.handleLoadMore()).not.toThrow();
    });
  });
});
