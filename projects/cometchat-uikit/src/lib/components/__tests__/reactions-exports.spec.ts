/**
 * Unit tests for Reactions System public API exports.
 *
 * Verifies that CometChatReactionsComponent, CometChatReactionInfoComponent,
 * and CometChatReactionListComponent are importable from the library.
 *
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { describe, it, expect } from 'vitest';
import {
  CometChatReactionsComponent,
  CometChatReactionInfoComponent,
  CometChatReactionListComponent,
} from '../index';

describe('Reactions System Public API Exports', () => {
  it('should export CometChatReactionsComponent as an Angular component class', () => {
    expect(CometChatReactionsComponent).toBeDefined();
    expect(typeof CometChatReactionsComponent).toBe('function');
  });

  it('should export CometChatReactionInfoComponent as an Angular component class', () => {
    expect(CometChatReactionInfoComponent).toBeDefined();
    expect(typeof CometChatReactionInfoComponent).toBe('function');
  });

  it('should export CometChatReactionListComponent as an Angular component class', () => {
    expect(CometChatReactionListComponent).toBeDefined();
    expect(typeof CometChatReactionListComponent).toBe('function');
  });
});
