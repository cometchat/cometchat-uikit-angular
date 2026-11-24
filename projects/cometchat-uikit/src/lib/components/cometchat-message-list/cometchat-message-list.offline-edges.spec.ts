/**
 * D84 in the message list (and threads, which are the same component), offline on:
 * - Rule 3: nothing on screen and no connection is the offline state "Connect to load messages" with
 *   no Retry, in place of the error view; a real error is still the error view with Retry.
 * - Rule 9: a "Connect to load more" row stands at its edge (top for older, bottom for newer), reads
 *   "Connect to load more", and the page behind it loads once by itself when the connection returns
 *   (older edge first).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { MessageListService } from '../../services/message-list.service';
import { CometChatMessageListComponent } from './cometchat-message-list.component';
import { States } from '../../Enums/Enums';

describe('message list: the offline state and the "Connect to load more" rows (D84)', () => {
  let fake: OfflineSdkFake;
  beforeEach(async () => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    await TestBed.configureTestingModule({
      imports: [CometChatMessageListComponent],
    }).compileComponents();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  function list() {
    const fixture = TestBed.createComponent(CometChatMessageListComponent);
    const component = fixture.componentInstance as any;
    component.user = new CometChat.User('peer');
    component.loggedInUser = new CometChat.User('me');
    const service = component.messageListService as any;
    return { fixture, component, service, root: fixture.nativeElement as HTMLElement };
  }
  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  describe('rule 3: nothing on screen and no connection', () => {
    it('shows "Connect to load messages" with no Retry, as an offline state and not an error', () => {
      const { fixture, component, service, root } = list();
      fixture.detectChanges();
      service.offlineReloadOnConnect = true;
      service.loadingStateSignal.set(false);
      service.errorStateSignal.set(new Error('not connected'));
      fixture.detectChanges();
      expect(component.listState()).toBe(States.error);
      const state = root.querySelector('[data-testid="cc-empty"][data-cc-reason="connect-to-load"]');
      expect(state).not.toBeNull();
      expect(state!.textContent).toContain('Connect to load messages');
      expect(root.querySelector('[data-testid="cc-error"]')).toBeNull();
      expect(root.querySelector('cometchat-button')).toBeNull();
    });

    it('a real error with nothing on screen is still the error view with Retry', () => {
      const { fixture, component, service, root } = list();
      fixture.detectChanges();
      service.loadingStateSignal.set(false);
      service.errorStateSignal.set(new Error('server'));
      fixture.detectChanges();
      expect(component.listState()).toBe(States.error);
      expect(root.querySelector('[data-testid="cc-error"][data-cc-reason="error"]')).not.toBeNull();
      expect(root.querySelector('cometchat-button')).not.toBeNull();
      expect(root.querySelector('[data-cc-reason="connect-to-load"]')).toBeNull();
    });
  });

  describe('rule 9: the "Connect to load more" rows', () => {
    it('the older edge is a tappable row at the top that reads "Connect to load more"', () => {
      const { fixture, component, service, root } = list();
      fixture.detectChanges();
      service.loadingStateSignal.set(false);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: true, next: false };
      fixture.detectChanges();
      expect(component.listState()).toBe(States.loaded);
      const top = root.querySelector('[data-cc-footer="connect-to-load-more"][data-cc-edge="previous"] button');
      expect(top).not.toBeNull();
      expect(top!.textContent).toContain('Connect to load more');
      expect(root.querySelector('[data-cc-edge="next"]')).toBeNull();
    });

    it('a blocked newer edge is a row at the bottom, not the top', () => {
      const { fixture, component, service, root } = list();
      fixture.detectChanges();
      service.loadingStateSignal.set(false);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: false, next: true };
      fixture.detectChanges();
      expect(component.listState()).toBe(States.loaded);
      expect(root.querySelector('[data-cc-edge="next"] button')).not.toBeNull();
      expect(root.querySelector('[data-cc-edge="previous"]')).toBeNull();
    });

    it('a tap on the row reads the blocked edge', async () => {
      const { component, service } = list();
      const read = vi.spyOn(service, 'retryOfflineRead').mockResolvedValue(true);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: false, next: true };
      component.retryOfflineRead();
      await settle();
      expect(read).toHaveBeenCalledTimes(1);
      // A tap clears the whole mark, as before (no direction is passed).
      expect(read.mock.calls[0]).toEqual([undefined]);
    });

    it('when the connection returns, the older edge loads once by itself', async () => {
      const { component, service } = list();
      const read = vi.spyOn(service, 'retryOfflineRead').mockResolvedValue(true);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: true, next: false };
      service.markOfflineConnected();
      await settle();
      expect(read).toHaveBeenCalledTimes(1);
      expect(read).toHaveBeenCalledWith('previous');
      expect(component.isFetchingPrevious()).toBe(false);
    });

    it('with both edges blocked, the older one loads first and the newer one after it settles', async () => {
      const { service } = list();
      const order: string[] = [];
      let release!: () => void;
      vi.spyOn(service, 'retryOfflineRead').mockImplementation(((direction: string) => {
        order.push(`${direction}:start`);
        return new Promise<boolean>(resolve => {
          release = () => {
            order.push(`${direction}:end`);
            resolve(true);
          };
          if (direction === 'next') release();
        });
      }) as any);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: true, next: true };
      service.markOfflineConnected();
      await settle();
      expect(order).toEqual(['previous:start']);
      release();
      await settle();
      await settle();
      expect(order).toEqual(['previous:start', 'previous:end', 'next:start', 'next:end']);
    });

    it('an edge whose direction is already reading is left to that read', async () => {
      const { component, service } = list();
      const read = vi.spyOn(service, 'retryOfflineRead').mockResolvedValue(true);
      component.isFetchingPrevious.set(true);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: true, next: false };
      service.markOfflineConnected();
      await settle();
      expect(read).not.toHaveBeenCalled();
    });

    it('nothing loads by itself when no row is showing', async () => {
      const { service } = list();
      const read = vi.spyOn(service, 'retryOfflineRead').mockResolvedValue(true);
      service.markOfflineConnected();
      await settle();
      expect(read).not.toHaveBeenCalled();
    });

    it('a reconnect that fails offline again keeps the row and loads nothing more by itself', async () => {
      const { service } = list();
      const read = vi.spyOn(service, 'retryOfflineRead').mockImplementation((async () => {
        service.offlineFooterSignal.set('connect_to_load_more');
        return false;
      }) as any);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: true, next: false };
      service.markOfflineConnected();
      await settle();
      expect(read).toHaveBeenCalledTimes(1);
      expect(service.offlineFooter()).toBe('connect_to_load_more');
    });
  });

  describe('the service keeps the other edge marked while one edge reloads', () => {
    it('retryOfflineRead(direction) clears only that edge; a tap clears both', async () => {
      TestBed.configureTestingModule({ providers: [MessageListService] });
      const service = TestBed.inject(MessageListService) as any;
      vi.spyOn(service, 'fetchPreviousMessages').mockResolvedValue(true);
      vi.spyOn(service, 'fetchNextMessages').mockResolvedValue(true);
      service.offlineFooterSignal.set('connect_to_load_more');
      service.offlineBlocked = { previous: true, next: true };
      await service.retryOfflineRead('previous');
      expect(service.offlineBlocked).toEqual({ previous: false, next: true });
      service.offlineBlocked = { previous: true, next: true };
      await service.retryOfflineRead();
      expect(service.offlineBlocked).toBeUndefined();
    });
  });
});
