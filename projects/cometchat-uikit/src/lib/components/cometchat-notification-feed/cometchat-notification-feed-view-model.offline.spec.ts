vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { NotificationFeedViewModel } from './cometchat-notification-feed-view-model';
import { NotificationFeedState } from './cometchat-notification-feed.types';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { NOT_CONNECTED, twoPhaseRequest } from '../../testing/two-phase-request-fake';

const item = (id: string): any => ({
  getId: () => id,
  getSentAt: () => 1,
  getReadAt: () => null,
  setReadAt: vi.fn(),
  getCategory: () => 'NEWS',
  getContent: () => ({}),
});

/** Notification feed, offline path: cached then server, deduped by id (UIT-LIST-07). */
describe('NotificationFeedViewModel: two-phase', () => {
  let fake: OfflineSdkFake;
  let states: NotificationFeedState[];
  let vm: NotificationFeedViewModel;

  beforeEach(() => {
    fake = installOfflineSdk();
    states = [];
    (CometChat as any).getNotificationFeedUnreadCount = vi.fn().mockResolvedValue(0);
    (CometChat as any).markFeedItemAsDelivered = vi.fn().mockResolvedValue(undefined);
  });
  afterEach(() => {
    vm?.dispose();
    fake.restore();
    vi.restoreAllMocks();
  });

  let keptRowsErrors: unknown[];
  const open = (request: any) => {
    keptRowsErrors = [];
    vm = new NotificationFeedViewModel(s => states.push({ ...s }), request, undefined, e =>
      keptRowsErrors.push(e)
    );
    return vm;
  };
  const ids = () => vm.getState().items.map(i => i.getId());

  it('the cached page paints first, then the server page replaces it', async () => {
    open(
      twoPhaseRequest('NotificationFeedItems', [
        { cached: [item('1'), item('2')], server: [item('2'), item('3')] },
      ])
    );
    await vm.fetchInitialItems();
    expect(states.some(s => s.items.length === 2 && s.screenState === 'loaded')).toBe(true);
    expect(ids()).toEqual(['2', '3']);
  });

  it('D84 rule 2: offline with nothing newer keeps the cached rows, no error view, and reports nothing', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ cached: [item('1')], error: NOT_CONNECTED }]));
    await vm.fetchInitialItems();
    expect(ids()).toEqual(['1']);
    expect(vm.getState().screenState).toBe('loaded');
    expect(vm.getState().error).toBeNull();
    expect(vm.connectToLoad).toBe(false);
    expect(keptRowsErrors).toEqual([]);
  });

  it('D84 rule 5: a reload the kit starts (cache reset) keeps the rows and stays quiet', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ cached: [item('1')], error: NOT_CONNECTED }]));
    await vm.fetchInitialItems(true);
    expect(vm.getState().screenState).toBe('loaded');
    expect(keptRowsErrors).toEqual([]);
  });

  it('D84 rule 5: an online error over cached rows keeps them and reports once; a pull-to-refresh too; offline refresh reports nothing', async () => {
    open(
      twoPhaseRequest('NotificationFeedItems', [
        { cached: [item('1')], error: { code: 'ERR_X' } },
        { cached: [item('1')], error: { code: 'ERR_Y' } },
        { cached: [item('1')], error: NOT_CONNECTED },
      ])
    );
    await vm.fetchInitialItems();
    expect(vm.getState().screenState).toBe('loaded');
    expect(keptRowsErrors.length).toBe(1);
    await vm.refresh();
    expect(vm.getState().screenState).toBe('loaded');
    expect(vm.getState().isRefreshing).toBe(false);
    expect(keptRowsErrors.length).toBe(2);
    await vm.refresh();
    expect(keptRowsErrors.length).toBe(2);
  });

  it('D84 rule 3: offline with an empty cache is the error state shown as "Connect to load notifications", not empty', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ cached: [], error: NOT_CONNECTED }]));
    await vm.fetchInitialItems();
    expect(vm.getState().screenState).toBe('error');
    expect(vm.getState().error).toEqual(NOT_CONNECTED);
    expect(vm.connectToLoad).toBe(true);
    expect(keptRowsErrors).toEqual([]);
  });

  it('D84 rule 4: a real error with an empty cache is the error view with Retry, not the offline state', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ cached: [], error: { code: 'ERR_X' } }]));
    await vm.fetchInitialItems();
    expect(vm.getState().screenState).toBe('error');
    expect(vm.connectToLoad).toBe(false);
  });

  it('D84 rule 8: that offline state loads once by itself on reconnect; a second reconnect does not read again', async () => {
    const request = twoPhaseRequest('NotificationFeedItems', [
      { error: NOT_CONNECTED },
      { server: [item('1')] },
    ]);
    open(request);
    await vm.fetchInitialItems();
    vm.reloadAfterOfflineError();
    await vi.waitFor(() => expect(vm.getState().screenState).toBe('loaded'));
    expect(ids()).toEqual(['1']);
    expect(vm.connectToLoad).toBe(false);
    vm.reloadAfterOfflineError();
    expect(request.fetchNext).toHaveBeenCalledTimes(2);
  });

  it('D84 rule 8: a non-network error is not reloaded on reconnect', async () => {
    const request = twoPhaseRequest('NotificationFeedItems', [
      { error: { code: 'ERR_X' } },
      { server: [item('1')] },
    ]);
    open(request);
    await vm.fetchInitialItems();
    expect(vm.getState().screenState).toBe('error');
    vm.reloadAfterOfflineError();
    expect(request.fetchNext).toHaveBeenCalledTimes(1);
  });

  it('D84 rule 8: when that reload fails offline again with nothing shown, the offline state stays up', async () => {
    open(
      twoPhaseRequest('NotificationFeedItems', [
        { error: { ...NOT_CONNECTED } },
        { error: { ...NOT_CONNECTED } },
      ])
    );
    await vm.fetchInitialItems();
    const errors = vm.getState().error;
    vm.reloadAfterOfflineError();
    await vi.waitFor(() => expect(vm.getState().error).not.toBe(errors));
    expect(vm.getState().screenState).toBe('error');
    expect(vm.connectToLoad).toBe(true);
  });

  it('D84 rule 6: an empty server page is the empty view', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ server: [] }]));
    await vm.fetchInitialItems();
    expect(vm.getState().screenState).toBe('empty');
    expect(keptRowsErrors).toEqual([]);
  });

  it('"load more" never repeats a row and keeps server order', async () => {
    open(
      twoPhaseRequest('NotificationFeedItems', [
        { server: [item('1'), item('2')] },
        { cached: [item('2'), item('3')], server: [item('2'), item('3'), item('4')] },
      ])
    );
    await vm.fetchInitialItems();
    await vm.fetchNextPage();
    expect(ids()).toEqual(['1', '2', '3', '4']);
    expect(vm.getState().hasMorePages).toBe(true);
  });

  it('offline "load more" past the cache offers a retry and keeps the rows', async () => {
    open(
      twoPhaseRequest('NotificationFeedItems', [{ server: [item('1')] }, { error: NOT_CONNECTED }])
    );
    await vm.fetchInitialItems();
    await vm.fetchNextPage();
    expect(ids()).toEqual(['1']);
    expect(vm.getState().paginationError).toBe(true);
  });

  it('only an empty server page ends the list', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ server: [item('1')] }, { server: [] }]));
    await vm.fetchInitialItems();
    await vm.fetchNextPage();
    expect(vm.getState().hasMorePages).toBe(false);
  });

  it('delivered is reported for server rows only', async () => {
    open(twoPhaseRequest('NotificationFeedItems', [{ cached: [item('1')], server: [item('2')] }]));
    await vm.fetchInitialItems();
    const reported = ((CometChat as any).markFeedItemAsDelivered as any).mock.calls.map(
      (c: any[]) => c[0].getId()
    );
    expect(reported).toEqual(['2']);
  });

  it('offline off: one plain read (P1)', async () => {
    fake.setEnabled(false);
    const request = twoPhaseRequest('NotificationFeedItems', [{ server: [item('1')] }]);
    open(request);
    await vm.fetchInitialItems();
    expect(request.fetchNext).toHaveBeenCalledWith();
    expect(ids()).toEqual(['1']);
  });
});
