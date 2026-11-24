/**
 * Message-list SDK listener ids are unique per list.
 *
 * The SDK keys listeners by id and replaces one registered under the same id.
 * Two lists (a chat and its thread panel) created in the same millisecond used
 * to build the same `message_list_${Date.now()}` ids, so the second list's
 * listener replaced the first, and cleaning one list up removed the other's.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageListService } from './message-list.service';
import {
  generateCallListenerId,
  generateConnectionListenerId,
  generateGroupListenerId,
  generateMessageListenerId,
} from './message-list.types';

describe('message list listener ids', () => {
  const registered = new Set<string>();
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    registered.clear();
    vi.spyOn(CometChat, 'addMessageListener').mockImplementation(((id: string) => {
      registered.add(id);
    }) as any);
    vi.spyOn(CometChat, 'removeMessageListener').mockImplementation(((id: string) => {
      registered.delete(id);
    }) as any);
    TestBed.configureTestingModule({});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const create = () => TestBed.runInInjectionContext(() => new MessageListService());
  const ids = (s: MessageListService) => [
    s.getMessageListenerId(),
    s.getGroupListenerId(),
    s.getCallListenerId(),
    s.getConnectionListenerId(),
  ];

  it('two lists created in the same millisecond get different ids', () => {
    const a = create();
    const b = create();
    for (const id of ids(a)) expect(ids(b)).not.toContain(id);
    expect(new Set(ids(a)).size).toBe(4);
  });

  it('cleaning one list up leaves the other list registered', () => {
    const a = create();
    const b = create();
    (a as any).setupMessageListener();
    (b as any).setupMessageListener();
    expect(registered.size).toBe(2);
    a.cleanup();
    expect(registered.has(b.getMessageListenerId())).toBe(true);
    // The ids a list takes after cleanup do not collide with a live list either.
    for (const id of ids(a)) expect(ids(b)).not.toContain(id);
  });

  it('the generate*ListenerId helpers never repeat within a millisecond', () => {
    for (const generate of [
      generateMessageListenerId,
      generateGroupListenerId,
      generateCallListenerId,
      generateConnectionListenerId,
    ]) {
      expect(generate()).not.toBe(generate());
    }
  });
});
