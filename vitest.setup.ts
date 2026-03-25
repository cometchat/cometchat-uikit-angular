import { vi } from 'vitest';

console.log('[vitest.setup.ts] ===== SETUP FILE IS EXECUTING =====');

// ---------------------------------------------------------------------------
// Mock @cometchat/calls-sdk-javascript BEFORE zone.js or Angular loads.
//
// The real Calls SDK references JitsiMeetJS which is not available in jsdom.
// This mock prevents the unhandled ReferenceError and lets tests that need
// the Calls SDK inject their own mocks via _setCallsSDKForTesting().
// ---------------------------------------------------------------------------
vi.mock('@cometchat/calls-sdk-javascript', () => {
  const CallSettingsBuilder = vi.fn().mockImplementation(function (this: any) {
    this.enableDefaultLayout = vi.fn().mockReturnThis();
    this.setIsAudioOnlyCall = vi.fn().mockReturnThis();
    this.setCallListener = vi.fn().mockReturnThis();
    this.build = vi.fn().mockReturnValue({});
  });

  const OngoingCallListener = vi.fn().mockImplementation(function (this: any, callbacks: any) {
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
// Zone.js + Angular TestBed initialization via @analogjs/vitest-angular.
//
// These are pre-compiled .js files that bypass the Angular compiler plugin.
// setup-zone: loads zone.js and patches vitest globals to run in zones.
// setup-testbed: calls initTestEnvironment with BrowserTestingModule.
// ---------------------------------------------------------------------------
import '@analogjs/vitest-angular/setup-zone';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

setupTestBed({ zoneless: false });
