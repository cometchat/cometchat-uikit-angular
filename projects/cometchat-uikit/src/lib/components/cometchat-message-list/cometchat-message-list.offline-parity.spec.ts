/**
 * Offline message list, Android parity (open issues A1-A5).
 *
 * - A1: a thread panel and the main list each show only the notices of their own
 *   level (Android: `acceptsOfflineSendRow` = chat + thread level).
 * - A2: confirming the discard dialog twice discards once and never sends a
 *   server delete for message id 0 (Android: `actionsInFlight` swallows a second tap).
 * - A3: a retried read of a chat the user already left changes nothing, and a
 *   second tap while one read runs starts no second read.
 * - A5: the paging-resume timer of a chat does not outlive the chat.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import {
  installOfflineSdk,
  OfflineSdkFake,
  offlineMessage,
  textMessage,
} from '../../testing/offline-sdk-fake';
import { OfflineHub, OfflineNotice } from '../../utils/offline/offline-hub';
import { LiveAnnouncerService } from '../../services/live-announcer.service';
import { MessageListService } from '../../services/message-list.service';
import { CometChatMessageListComponent } from './cometchat-message-list.component';
import { RESUME_PAGING_AFTER_MS } from './cometchat-message-list.conversation-handlers';
import { States } from '../../Enums/Enums';

const ME = 'me';

function own(text: string, parentId = 0) {
  const m = offlineMessage(textMessage(text, 'peer'), {
    muid: `muid-${text}`,
    localMessageId: `L-${text}`,
    status: 'FAILED',
  });
  m.setSender(new CometChat.User(ME));
  if (parentId) m.setParentMessageId(parentId);
  return m;
}

function notice(message: CometChat.BaseMessage): OfflineNotice {
  return { gen: OfflineHub.getInstance().gen, kind: 'queue_full', message };
}

/** An own failed row of another chat. */
function ownElsewhere(text: string, receiverId: string) {
  const m = offlineMessage(textMessage(text, receiverId), {
    muid: `muid-${text}`,
    localMessageId: `L-${text}`,
    status: 'FAILED',
  });
  m.setSender(new CometChat.User(ME));
  return m;
}

/** The kill switch's notice, which covers several rows of one list. */
function killSwitchNotice(about: CometChat.BaseMessage, count = 2): OfflineNotice {
  return { gen: OfflineHub.getInstance().gen, kind: 'messages_not_sent', count, scopeMessage: about };
}

describe('offline message list, Android parity', () => {
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
    vi.useRealTimers();
  });

  function list(parent?: CometChat.BaseMessage) {
    const fixture = TestBed.createComponent(CometChatMessageListComponent);
    const component = fixture.componentInstance as any;
    component.user = new CometChat.User('peer');
    component.loggedInUser = new CometChat.User(ME);
    if (parent) component.parentMessage = parent;
    return { fixture, component };
  }

  // ── A1 ────────────────────────────────────────────────────────────────────

  describe('A1: notices are scoped to the list level', () => {
    it('the main list shows a notice for a main message, not for a thread reply', () => {
      const { component } = list();
      const hub = OfflineHub.getInstance();
      hub.notice$.next(notice(own('main')));
      hub.notice$.next(notice(own('reply', 55)));
      const shown = component.visibleOfflineNotices.map((n: OfflineNotice) =>
        (n.message as any).getText()
      );
      expect(shown).toEqual(['main']);
    });

    it('a thread panel shows a notice for its own thread only', () => {
      const parent = offlineMessage(textMessage('root'), { id: 55 });
      const { component } = list(parent);
      const hub = OfflineHub.getInstance();
      hub.notice$.next(notice(own('main')));
      hub.notice$.next(notice(own('reply', 55)));
      hub.notice$.next(notice(own('other thread', 99)));
      const shown = component.visibleOfflineNotices.map((n: OfflineNotice) =>
        (n.message as any).getText()
      );
      expect(shown).toEqual(['reply']);
    });

    it('hideOfflineNotices hides every notice of this list', () => {
      const { component } = list();
      OfflineHub.getInstance().notice$.next(notice(own('main')));
      expect(component.visibleOfflineNotices).toHaveLength(1);
      component.hideOfflineNotices = true;
      expect(component.visibleOfflineNotices).toEqual([]);
    });

    /**
     * The kill switch raises ONE notice for all the rows it failed. It had no
     * chat and no thread level on it, so every mounted list showed it - the
     * other conversation and the thread panel included - while the per-message
     * notices above are scoped (Prajwal 2026-11-20T11:54Z on #674).
     */
    it('the kill-switch notice shows on the main list whose sends failed', () => {
      const { component } = list();
      OfflineHub.getInstance().notice$.next(killSwitchNotice(own('main')));
      expect(component.visibleOfflineNotices).toHaveLength(1);
      expect(component.visibleOfflineNotices[0].count).toBe(2);
    });

    it('a thread panel is not told about the main list\'s failed sends', () => {
      const { component } = list(offlineMessage(textMessage('root'), { id: 55 }));
      OfflineHub.getInstance().notice$.next(killSwitchNotice(own('main')));
      expect(component.visibleOfflineNotices).toEqual([]);
    });

    it('the main list is not told about a thread panel\'s failed sends', () => {
      const { component } = list();
      OfflineHub.getInstance().notice$.next(killSwitchNotice(own('reply', 55)));
      expect(component.visibleOfflineNotices).toEqual([]);
    });

    it('a thread panel is told about its own failed sends', () => {
      const { component } = list(offlineMessage(textMessage('root'), { id: 55 }));
      OfflineHub.getInstance().notice$.next(killSwitchNotice(own('reply', 55)));
      expect(component.visibleOfflineNotices).toHaveLength(1);
    });

    it('another conversation is not told about this one\'s failed sends', () => {
      const { component } = list();
      OfflineHub.getInstance().notice$.next(killSwitchNotice(ownElsewhere('theirs', 'stranger')));
      expect(component.visibleOfflineNotices).toEqual([]);
    });

    /**
     * The same scoping applies to what a screen reader is told. A thread panel
     * and the main list are mounted on the same chat at once, and the
     * announcement only checked the conversation, so a failed reply was read
     * out twice (Prajwal 2026-11-20T13:00Z on #674).
     */
    describe('announcing a failed send to a screen reader', () => {
      function announcementsOf(parent?: CometChat.BaseMessage) {
        const made: string[] = [];
        const { component, fixture } = list(parent);
        vi.spyOn(TestBed.inject(LiveAnnouncerService), 'announce').mockImplementation(
          (text: string) => {
            made.push(text);
          }
        );
        return { made, component, fixture };
      }

      function fail(message: CometChat.BaseMessage): void {
        OfflineHub.getInstance().reportSendState(message, 'failed', { direct: true });
      }

      it('the main list announces a failed send of the main chat, once', () => {
        const { made } = announcementsOf();
        fail(own('main'));
        expect(made).toHaveLength(1);
      });

      it('the main list says nothing about a failed thread reply', () => {
        const { made } = announcementsOf();
        fail(own('reply', 55));
        expect(made).toEqual([]);
      });

      it('a thread panel announces its own failed reply, and not the main chat\'s send', () => {
        const parent = offlineMessage(textMessage('root'), { id: 55 });
        const { made } = announcementsOf(parent);
        fail(own('reply', 55));
        expect(made).toHaveLength(1);
        made.length = 0;
        fail(own('main'));
        expect(made).toEqual([]);
      });

      it('another conversation is not announced', () => {
        const { made } = announcementsOf();
        fail(ownElsewhere('theirs', 'stranger'));
        expect(made).toEqual([]);
      });
    });

    it('a notice with no message still shows on a list of either level', () => {
      const { component } = list(offlineMessage(textMessage('root'), { id: 55 }));
      OfflineHub.getInstance().notice$.next({
        gen: OfflineHub.getInstance().gen,
        kind: 'messages_not_sent',
        count: 2,
      });
      expect(component.visibleOfflineNotices).toHaveLength(1);
    });
  });

  // ── A2 ────────────────────────────────────────────────────────────────────

  describe('A2: a double confirm discards once', () => {
    it('the second confirm neither discards again nor deletes id 0 on the server', async () => {
      const { component } = list();
      const unsent = own('unsent');
      let release!: () => void;
      const gate = new Promise<void>(resolve => (release = resolve));
      const discard = vi.spyOn(component, 'discardOfflineMessage').mockImplementation(async () => {
        await gate;
      });
      const deleteSpy = vi.fn().mockResolvedValue({});
      (CometChat as any).deleteMessage = deleteSpy;
      component.requestOfflineDiscard(unsent);

      const first = component.handleDeleteConfirm();
      const second = component.handleDeleteConfirm();
      release();
      await Promise.all([first, second]);

      expect(discard).toHaveBeenCalledTimes(1);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('a confirm after the discard finished still works for the next unsent message', async () => {
      const { component } = list();
      const discard = vi.spyOn(component, 'discardOfflineMessage').mockResolvedValue(undefined);
      component.requestOfflineDiscard(own('a'));
      await component.handleDeleteConfirm();
      component.requestOfflineDiscard(own('b'));
      await component.handleDeleteConfirm();
      expect(discard).toHaveBeenCalledTimes(2);
    });
  });

  // ── A3 ────────────────────────────────────────────────────────────────────

  describe('A3: retrying a failed read', () => {
    it('a second tap while one read runs starts no second read', async () => {
      const { component } = list();
      let release!: (more: boolean) => void;
      const read = vi
        .spyOn(component.messageListService, 'retryOfflineRead')
        .mockImplementation(() => new Promise<boolean>(resolve => (release = resolve)));
      component.retryOfflineRead();
      component.retryOfflineRead();
      expect(read).toHaveBeenCalledTimes(1);
      release(true);
      await Promise.resolve();
      await Promise.resolve();
      component.retryOfflineRead();
      expect(read).toHaveBeenCalledTimes(2);
    });

    it('an answer that comes after a chat switch does not change the new chat', async () => {
      const { component } = list();
      const service = component.messageListService as MessageListService;
      let release!: (more: boolean) => void;
      vi.spyOn(service, 'retryOfflineRead').mockImplementation(
        () => new Promise<boolean>(resolve => (release = resolve))
      );
      component.hasMorePrevious.set(true);
      component.retryOfflineRead();
      // The user opens another chat: the service starts a new fetch generation.
      (service as any).fetchGeneration++;
      release(false);
      await Promise.resolve();
      await Promise.resolve();
      expect(component.hasMorePrevious()).toBe(true);
    });
  });

  // ── A5 ────────────────────────────────────────────────────────────────────

  describe('A5: the paging-resume timer belongs to its chat', () => {
    it('does not turn paging on in a chat opened after it was set', async () => {
      vi.useFakeTimers();
      const { resumePagingIfStillOff } =
        await import('./cometchat-message-list.conversation-handlers');
      let generation = 1;
      const ctx: any = {
        hasMorePrevious: (() => {
          let v = false;
          const f: any = () => v;
          f.set = (n: boolean) => (v = n);
          return f;
        })(),
        messageListService: { getFetchGeneration: () => generation },
      };
      resumePagingIfStillOff(ctx);
      generation = 2; // another chat was opened meanwhile
      vi.advanceTimersByTime(RESUME_PAGING_AFTER_MS + 10);
      expect(ctx.hasMorePrevious()).toBe(false);
    });

    it('still turns paging on when the chat is unchanged', async () => {
      vi.useFakeTimers();
      const { resumePagingIfStillOff } =
        await import('./cometchat-message-list.conversation-handlers');
      const ctx: any = {
        hasMorePrevious: (() => {
          let v = false;
          const f: any = () => v;
          f.set = (n: boolean) => (v = n);
          return f;
        })(),
        messageListService: { getFetchGeneration: () => 1 },
      };
      resumePagingIfStillOff(ctx);
      vi.advanceTimersByTime(RESUME_PAGING_AFTER_MS + 10);
      expect(ctx.hasMorePrevious()).toBe(true);
    });
  });
  // ── role="status" must not wrap a button ───────────────────────────────────

  describe('live regions do not wrap buttons', () => {
    it('the "Connect to load more" footer and a notice keep their buttons outside any status region', () => {
      const { fixture, component } = list();
      fixture.detectChanges();
      component.listState.set(States.loaded);
      (fixture.debugElement.injector.get(MessageListService) as any).offlineFooterSignal.set(
        'connect_to_load_more'
      );
      OfflineHub.getInstance().notice$.next(notice(own('main')));
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('[data-cc-footer="connect-to-load-more"] button')).not.toBeNull();
      expect(root.querySelector('[data-cc-notice="queue_full"] button')).not.toBeNull();
      expect(root.querySelectorAll('[role="status"] button')).toHaveLength(0);
      // the notice text is still announced
      expect(root.querySelector('[data-cc-notice="queue_full"] [role="status"]')).not.toBeNull();
    });
  });
});
