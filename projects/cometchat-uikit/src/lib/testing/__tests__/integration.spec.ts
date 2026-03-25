/**
 * Integration Test: Real Angular Component + Mock SDK End-to-End
 *
 * Feature: sdk-mock-testing, Property 14: Real Angular components process mock SDK data end-to-end
 *
 * Validates: Requirements 1.1, 1.2, 1.5, 1.6, 9.5
 *
 * This test creates a minimal standalone Angular component inside the test file,
 * configures it in TestBed with ALL_MOCK_PROVIDERS, and verifies:
 * - Component instantiates without errors
 * - ngOnInit executes and calls mocked SDK methods
 * - Mocked SDK methods are called (verified via spy)
 * - Template renders without errors
 * - MockTranslatePipe works (renders the key as-is)
 * - ChatStateService mock is injectable and functional
 *
 * @module testing/__tests__/integration.spec
 */

import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ALL_MOCK_PROVIDERS, MockTranslatePipe, installSDKMocks } from '../mock-providers';
import type { SDKMockSpies } from '../mock-providers';
import { ChatStateService } from '../../services/chat-state.service';
import { createMockUser } from '../mock-sdk';

// ─── Minimal Test Component ───

@Component({
  selector: 'test-integration',
  standalone: true,
  imports: [MockTranslatePipe],
  template: `
    <div class="test-component">
      <span class="greeting">{{ 'hello_world' | translate }}</span>
      <span class="user-name">{{ userName }}</span>
      <span class="connection-status">{{ connectionStatus }}</span>
    </div>
  `,
})
class TestIntegrationComponent implements OnInit {
  userName = '';
  connectionStatus = '';
  private chatState = inject(ChatStateService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    const user = await CometChat.getLoggedInUser();
    if (user) {
      this.userName = user.getName();
    }
    this.connectionStatus = CometChat.getConnectionStatus() as unknown as string;
    this.cdr.detectChanges();
  }
}

// ─── Helper ───

/** Flush microtasks so async ngOnInit completes. */
async function stabilize(fixture: ComponentFixture<any>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

// ─── Integration Tests ───

describe('Integration: Real Angular Component + Mock SDK', () => {
  let fixture: ComponentFixture<TestIntegrationComponent>;
  let component: TestIntegrationComponent;
  let sdkSpies: SDKMockSpies;

  beforeEach(async () => {
    sdkSpies = installSDKMocks();

    await TestBed.configureTestingModule({
      imports: [TestIntegrationComponent],
      providers: [...ALL_MOCK_PROVIDERS],
    }).compileComponents();

    fixture = TestBed.createComponent(TestIntegrationComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should instantiate the component without errors', () => {
    expect(component).toBeTruthy();
    expect(component).toBeInstanceOf(TestIntegrationComponent);
  });

  it('should execute ngOnInit and call mocked SDK methods', async () => {
    await stabilize(fixture);

    expect(sdkSpies.getLoggedInUser).toHaveBeenCalled();
    expect(sdkSpies.getConnectionStatus).toHaveBeenCalled();
  });

  it('should render template with data from mocked SDK responses', async () => {
    await stabilize(fixture);

    const nativeEl: HTMLElement = fixture.nativeElement;

    const userNameEl = nativeEl.querySelector('.user-name');
    expect(userNameEl).toBeTruthy();
    expect(userNameEl!.textContent).toBe('Logged In User');

    const statusEl = nativeEl.querySelector('.connection-status');
    expect(statusEl).toBeTruthy();
    expect(statusEl!.textContent).toBe('connected');
  });

  it('should render MockTranslatePipe output (key as-is)', async () => {
    await stabilize(fixture);

    const nativeEl: HTMLElement = fixture.nativeElement;
    const greetingEl = nativeEl.querySelector('.greeting');
    expect(greetingEl).toBeTruthy();
    expect(greetingEl!.textContent).toBe('hello_world');
  });

  it('should provide ChatStateService mock that is injectable and functional', () => {
    const chatState = TestBed.inject(ChatStateService) as any;

    expect(chatState).toBeTruthy();
    expect(typeof chatState.setActiveUser).toBe('function');
    expect(typeof chatState.setActiveGroup).toBe('function');
    expect(typeof chatState.setActiveConversation).toBe('function');
    expect(typeof chatState.clearActiveChat).toBe('function');

    const mockUser = createMockUser({ uid: 'test-user', name: 'Test User' });
    chatState.setActiveUser(mockUser);
    expect(chatState.setActiveUser).toHaveBeenCalledWith(mockUser);
  });

  it('should allow overriding SDK mocks per-test without affecting component creation', async () => {
    const customUser = createMockUser({ uid: 'custom-user', name: 'Custom User' });
    (sdkSpies.getLoggedInUser as any).mockResolvedValue(customUser);

    await stabilize(fixture);

    const nativeEl: HTMLElement = fixture.nativeElement;
    const userNameEl = nativeEl.querySelector('.user-name');
    expect(userNameEl!.textContent).toBe('Custom User');
  });

  it('should handle SDK mock returning null gracefully', async () => {
    (sdkSpies.getLoggedInUser as any).mockResolvedValue(null);

    await stabilize(fixture);

    const nativeEl: HTMLElement = fixture.nativeElement;
    const userNameEl = nativeEl.querySelector('.user-name');
    expect(userNameEl!.textContent).toBe('');
  });
});
