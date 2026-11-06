// The calls SDK reaches for JitsiMeetJS at import time, which jsdom has no window for.
vi.mock('@cometchat/calls-sdk-javascript', () => ({ CometChatCalls: { init: vi.fn() } }));

/**
 * hideUserStatus on the real CometChatUserItem: the online/offline dot on the avatar, and that an
 * explicit input wins over the global config.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatUserItemComponent } from './cometchat-user-item.component';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';

const user = (status: string) =>
  ({
    getUid: () => 'u1',
    getName: () => 'Ana',
    getAvatar: () => '',
    getStatus: () => status,
    getRole: () => 'default',
    getBlockedByMe: () => false,
    getHasBlockedMe: () => false,
    getLastActiveAt: () => 0,
  }) as unknown as CometChat.User;

function render(status: string, opts: { hideUserStatus?: boolean; globalHide?: boolean } = {}) {
  TestBed.configureTestingModule({
    imports: [CometChatUserItemComponent],
    providers:
      opts.globalHide === undefined ? [] : [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: { hideUserStatus: opts.globalHide } }],
  });
  const fixture = TestBed.createComponent(CometChatUserItemComponent);
  fixture.componentRef.setInput('user', user(status));
  if (opts.hideUserStatus !== undefined) fixture.componentRef.setInput('hideUserStatus', opts.hideUserStatus);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.cometchat-user-item__status') as HTMLElement | null;
}

describe('CometChatUserItemComponent hideUserStatus', () => {
  it('shows the online dot by default', () => {
    expect(render('online')?.classList).toContain('cometchat-user-item__status--online');
  });

  it('hideUserStatus=true removes the dot', () => {
    expect(render('online', { hideUserStatus: true })).toBeNull();
  });

  it('an explicit hideUserStatus=false wins over a global config that hides it', () => {
    expect(render('online', { globalHide: true })).toBeNull();
    TestBed.resetTestingModule();
    expect(render('online', { globalHide: true, hideUserStatus: false })?.classList).toContain(
      'cometchat-user-item__status--online'
    );
  });
});
