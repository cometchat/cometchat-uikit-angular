import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SearchConversationsService } from './search-conversations.service';
import { States, CometChatSearchFilter } from '../Enums/Enums';

describe('SearchConversationsService', () => {
  let service: SearchConversationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchConversationsService],
    });
    service = TestBed.inject(SearchConversationsService);
    service.reset();
  });

  describe('initial state', () => {
    it('should have empty conversations', () => {
      expect(service.conversations()).toEqual([]);
    });

    it('should have loaded fetch state', () => {
      expect(service.fetchState()).toBe(States.loaded);
    });

    it('should have no more results', () => {
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should have empty typing indicator map', () => {
      expect(service.typingIndicatorMap().size).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      service.fetchState.set(States.error);
      service.hasMoreResults.set(true);
      service.reset();

      expect(service.conversations()).toEqual([]);
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.hasMoreResults()).toBe(false);
      expect(service.typingIndicatorMap().size).toBe(0);
    });

    it('should be idempotent', () => {
      service.reset();
      service.reset();

      expect(service.conversations()).toEqual([]);
      expect(service.fetchState()).toBe(States.loaded);
    });
  });

  describe('search — validation boundary', () => {
    it('should short-circuit to empty for no keyword and no filters', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', []);
      expect(service.fetchState()).toBe(States.empty);
      expect(buildSpy).not.toHaveBeenCalled(); // never reached SDK
    });

    it('should short-circuit to empty for whitespace-only keyword', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('   ', []);
      expect(service.fetchState()).toBe(States.empty);
      expect(buildSpy).not.toHaveBeenCalled();
    });

    it('should short-circuit to empty for Photos filter (message filter, invalid for conversations)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [CometChatSearchFilter.Photos]);
      expect(service.fetchState()).toBe(States.empty);
      expect(buildSpy).not.toHaveBeenCalled();
    });

    it('should proceed to SDK for Unread filter (valid conversation filter)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [CometChatSearchFilter.Unread]);
      expect(buildSpy).toHaveBeenCalled();
      expect(service.fetchState()).toBe(States.empty);
    });

    it('should proceed to SDK for Groups filter (valid conversation filter)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [CometChatSearchFilter.Groups]);
      expect(buildSpy).toHaveBeenCalled();
      expect(service.fetchState()).toBe(States.empty);
    });

    it('should proceed to SDK for keyword search', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('hello', []);
      expect(buildSpy).toHaveBeenCalled();
    });
  });

  describe('attachListeners', () => {
    it('should not throw when called with a mock user', () => {
      const mockUser = { getUid: () => 'test-user' } as any;
      expect(() => service.attachListeners(mockUser)).not.toThrow();
    });
  });

  describe('detachListeners', () => {
    it('should not throw when called without prior attach', () => {
      expect(() => service.detachListeners()).not.toThrow();
    });

    it('should not throw after attachListeners', () => {
      const mockUser = { getUid: () => 'test-user' } as any;
      service.attachListeners(mockUser);
      expect(() => service.detachListeners()).not.toThrow();
    });
  });

  describe('reset lifecycle', () => {
    it('should detach listeners on reset', () => {
      const mockUser = { getUid: () => 'test-user' } as any;
      service.attachListeners(mockUser);
      expect(() => service.reset()).not.toThrow();
      expect(service.conversations()).toEqual([]);
    });
  });

  describe('loadMore', () => {
    it('should not throw when called without prior search', async () => {
      await expect(service.loadMore()).resolves.toBeUndefined();
    });
  });
});
