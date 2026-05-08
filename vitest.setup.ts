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
  return {
    CometChatCalls: {
      init: vi.fn().mockResolvedValue(undefined),
      login: vi.fn().mockResolvedValue({ uid: 'mock-user' }),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
      joinSession: vi.fn().mockResolvedValue({ error: null }),
      leaveSession: vi.fn(),
      addEventListener: vi.fn().mockReturnValue(() => {}),
      removeEventListener: vi.fn(),
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
