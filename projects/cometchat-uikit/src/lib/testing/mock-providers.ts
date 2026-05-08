/**
 * Common Angular TestBed Providers for Testing
 *
 * Pre-configured provider arrays for use in TestBed.configureTestingModule().
 * These mock providers eliminate boilerplate across 100+ spec files by providing
 * ready-to-use mocks for localization, chat state, and CometChat SDK calls.
 *
 * @module testing/mock-providers
 * _Requirements: 15.5_
 *
 * @example
 * ```ts
 * import { MOCK_LOCALIZE_PROVIDERS, MOCK_CHAT_STATE_PROVIDERS } from '../../testing';
 *
 * beforeEach(async () => {
 *   await TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [...MOCK_LOCALIZE_PROVIDERS, ...MOCK_CHAT_STATE_PROVIDERS],
 *   }).compileComponents();
 * });
 * ```
 */

import { Provider } from '@angular/core';

// Re-export everything from the split files for backward compatibility
export {
  MockTranslatePipe,
  createMockChatStateService,
  createMockConversationsService,
  MOCK_LOCALIZE_PROVIDERS,
  MOCK_CHAT_STATE_PROVIDERS,
  mockCometChatLocalize,
} from './mock-providers-services';
export type { MockChatStateServiceType } from './mock-providers-services';

export {
  getRegisteredListener,
  clearListenerRegistry,
  installSDKMocks,
  MOCK_SDK_PROVIDERS,
} from './mock-providers-calls';
export type { SDKMockSpies } from './mock-providers-calls';

import { MOCK_LOCALIZE_PROVIDERS } from './mock-providers-services';
import { MOCK_CHAT_STATE_PROVIDERS } from './mock-providers-services';
import { MOCK_SDK_PROVIDERS } from './mock-providers-calls';

/**
 * Convenience: all mock providers combined.
 *
 * Includes localization, chat state, and SDK mocks.
 */
export const ALL_MOCK_PROVIDERS: Provider[] = [
  ...MOCK_LOCALIZE_PROVIDERS,
  ...MOCK_CHAT_STATE_PROVIDERS,
  ...MOCK_SDK_PROVIDERS,
];
