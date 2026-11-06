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

  // A slow earlier search must not overwrite a newer one (#632 review).
  describe('overlapping searches', () => {
    /** Each buildRequest gets the next request; each request resolves when the test says so. */
    function pendingRequests(count: number) {
      const resolvers: ((m: unknown[]) => void)[] = [];
      const requests = Array.from({ length: count }, () => ({
        fetchPrevious: vi.fn(() => new Promise<unknown[]>((r) => resolvers.push(r))),
      }));
      vi.spyOn(service as any, 'buildRequest').mockImplementation(() => requests.shift());
      return resolvers;
    }
    const msg = (id: string) => ({ id });

    it("keeps chat B's results when chat A's search resolves last", async () => {
      const resolvers = pendingRequests(2);
      const a = service.search('hi', [], 'user-a');
      const b = service.search('hi', [], 'user-b');
      resolvers[1]([msg('from-B')]);
      await b;
      resolvers[0]([msg('from-A')]);
      await a;
      expect(service.messages()).toEqual([msg('from-B')]);
      expect(service.fetchState()).toBe(States.loaded);
    });

    it("ignores an earlier search's failure once a newer one has started", async () => {
      vi.spyOn(service as any, 'buildRequest')
        .mockImplementationOnce(() => ({ fetchPrevious: () => Promise.reject(new Error('A failed')) }))
        .mockImplementationOnce(() => ({ fetchPrevious: () => new Promise(() => undefined) }));
      const a = service.search('hi', [], 'user-a');
      void service.search('hi', [], 'user-b');
      await expect(a).resolves.toBeUndefined();
      expect(service.fetchState()).toBe(States.loading);
    });

    it('drops a search that resolves after reset', async () => {
      const resolvers = pendingRequests(1);
      const a = service.search('hi', [], 'user-a');
      service.reset();
      resolvers[0]([msg('late')]);
      await a;
      expect(service.messages()).toEqual([]);
    });

    it("drops a page of the previous search's results", async () => {
      const resolvers = pendingRequests(3);
      const a = service.search('hi', [], 'user-a');
      resolvers[0](Array.from({ length: 30 }, (_, i) => msg(`a${i}`)));
      await a;
      const more = service.loadMore();
      const b = service.search('hi', [], 'user-b');
      resolvers[2]([msg('from-B')]);
      await b;
      resolvers[1]([msg('a-page-2')]);
      await more;
      expect(service.messages()).toEqual([msg('from-B')]);
    });
  });
});
