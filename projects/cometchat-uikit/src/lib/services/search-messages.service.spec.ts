import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SearchMessagesService } from './search-messages.service';
import { States, CometChatSearchFilter } from '../Enums/Enums';

describe('SearchMessagesService', () => {
  let service: SearchMessagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchMessagesService],
    });
    service = TestBed.inject(SearchMessagesService);
    service.reset();
  });

  describe('initial state', () => {
    it('should have empty messages', () => {
      expect(service.messages()).toEqual([]);
    });

    it('should have loaded fetch state', () => {
      expect(service.fetchState()).toBe(States.loaded);
    });

    it('should have no more results', () => {
      expect(service.hasMoreResults()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      service.fetchState.set(States.error);
      service.hasMoreResults.set(true);
      service.reset();
      expect(service.messages()).toEqual([]);
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should be idempotent', () => {
      service.reset();
      service.reset();
      expect(service.messages()).toEqual([]);
      expect(service.fetchState()).toBe(States.loaded);
      expect(service.hasMoreResults()).toBe(false);
    });

    it('should clear searchRequest so loadMore is a no-op', async () => {
      service.reset();
      await expect(service.loadMore()).resolves.toBeUndefined();
    });
  });

  describe('search — validation boundary', () => {
    it('should short-circuit to empty for no keyword, no filters, no uid/guid', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [], undefined, undefined);
      expect(service.fetchState()).toBe(States.empty);
      expect(buildSpy).not.toHaveBeenCalled();
    });

    it('should short-circuit to empty for whitespace-only keyword', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('   ', [], undefined, undefined);
      expect(service.fetchState()).toBe(States.empty);
      expect(buildSpy).not.toHaveBeenCalled();
    });

    it('should proceed to SDK for uid (valid criteria without keyword)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [], 'user1', undefined);
      expect(buildSpy).toHaveBeenCalled();
    });

    it('should proceed to SDK for guid (valid criteria without keyword)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [], undefined, 'group1');
      expect(buildSpy).toHaveBeenCalled();
    });

    it('should proceed to SDK for Photos filter (valid message filter)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [CometChatSearchFilter.Photos], undefined, undefined);
      expect(buildSpy).toHaveBeenCalled();
    });

    it('should proceed to SDK for Links filter (valid message filter)', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('', [CometChatSearchFilter.Links], undefined, undefined);
      expect(buildSpy).toHaveBeenCalled();
    });

    it('should proceed to SDK for keyword search', async () => {
      const buildSpy = vi.spyOn(service as any, 'buildRequest');
      await service.search('hello', [], undefined, undefined);
      expect(buildSpy).toHaveBeenCalled();
    });
  });

  describe('loadMore', () => {
    it('should not throw when called without prior search', async () => {
      await expect(service.loadMore()).resolves.toBeUndefined();
    });
  });
});
