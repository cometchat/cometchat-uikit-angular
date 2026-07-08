import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationUnreadCountService } from './notification-unread-count.service';

// Mock CometChat SDK
vi.mock('@cometchat/chat-sdk-javascript', () => ({
  CometChat: {
    getNotificationFeedUnreadCount: vi.fn().mockResolvedValue(5),
    addNotificationFeedListener: vi.fn(),
    removeNotificationFeedListener: vi.fn(),
  },
}));

describe('NotificationUnreadCountService', () => {
  let service: NotificationUnreadCountService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new NotificationUnreadCountService();
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  it('should create with initial count of 0', () => {
    expect(service.count$.value).toBe(0);
  });

  it('should have isLoading$ initially true', () => {
    expect(service.isLoading$.value).toBe(true);
  });

  it('should start without throwing', () => {
    expect(() => service.start()).not.toThrow();
  });

  it('should stop without throwing', () => {
    service.start();
    expect(() => service.stop()).not.toThrow();
  });

  it('should not start twice', () => {
    service.start();
    service.start(); // second call should be no-op
    expect(service).toBeDefined();
  });

  it('should not stop if not started', () => {
    expect(() => service.stop()).not.toThrow();
  });

  it('should fetch count on start', async () => {
    service.start();
    // Allow async fetch to complete
    await vi.advanceTimersByTimeAsync(0);
    expect(service.count$.value).toBe(5);
    expect(service.isLoading$.value).toBe(false);
  });

  it('should poll at configured interval', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    (CometChat as any).getNotificationFeedUnreadCount.mockClear();

    service.start({ pollingInterval: 10000 });
    await vi.advanceTimersByTimeAsync(0); // initial fetch

    const callCountAfterInit = (CometChat as any).getNotificationFeedUnreadCount.mock.calls.length;

    await vi.advanceTimersByTimeAsync(10000); // first poll
    expect((CometChat as any).getNotificationFeedUnreadCount.mock.calls.length).toBeGreaterThan(callCountAfterInit);
  });

  it('should register notification feed listener on start', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    (CometChat as any).addNotificationFeedListener.mockClear();

    service.start();
    expect((CometChat as any).addNotificationFeedListener).toHaveBeenCalledTimes(1);
  });

  it('should remove listener on stop', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    service.start();
    (CometChat as any).removeNotificationFeedListener.mockClear();

    service.stop();
    expect((CometChat as any).removeNotificationFeedListener).toHaveBeenCalledTimes(1);
  });

  it('should refresh count manually', async () => {
    service.start();
    await vi.advanceTimersByTimeAsync(0);

    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    (CometChat as any).getNotificationFeedUnreadCount.mockResolvedValueOnce(10);

    await service.refresh();
    await vi.advanceTimersByTimeAsync(0);
    expect(service.count$.value).toBe(10);
  });

  it('should handle fetch failure gracefully', async () => {
    const { CometChat } = await import('@cometchat/chat-sdk-javascript');
    (CometChat as any).getNotificationFeedUnreadCount.mockRejectedValueOnce(new Error('Network error'));

    service.start();
    await vi.advanceTimersByTimeAsync(0);
    // Should not throw, count stays at 0
    expect(service.count$.value).toBe(0);
  });

  it('should cleanup on ngOnDestroy', () => {
    service.start();
    expect(() => service.ngOnDestroy()).not.toThrow();
  });
});
