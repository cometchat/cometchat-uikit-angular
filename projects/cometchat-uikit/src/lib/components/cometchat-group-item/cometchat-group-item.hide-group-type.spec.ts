// The calls SDK reaches for JitsiMeetJS at import time, which jsdom has no window for.
vi.mock('@cometchat/calls-sdk-javascript', () => ({ CometChatCalls: { init: vi.fn() } }));

/**
 * hideGroupType on the real CometChatGroupItem: the type badge a private or password group shows,
 * and that an explicit input wins over the global config.
 */
import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import type { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroupItemComponent } from './cometchat-group-item.component';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';

const group = (type: string) =>
  ({
    getGuid: () => 'g1',
    getName: () => 'Design',
    getIcon: () => '',
    getType: () => type,
    getMembersCount: () => 3,
    getHasJoined: () => true,
    getScope: () => 'participant',
  }) as unknown as CometChat.Group;

function render(type: string, opts: { hideGroupType?: boolean; globalHide?: boolean } = {}) {
  TestBed.configureTestingModule({
    imports: [CometChatGroupItemComponent],
    providers:
      opts.globalHide === undefined ? [] : [{ provide: COMETCHAT_GLOBAL_CONFIG, useValue: { hideGroupType: opts.globalHide } }],
  });
  const fixture = TestBed.createComponent(CometChatGroupItemComponent);
  fixture.componentRef.setInput('group', group(type));
  if (opts.hideGroupType !== undefined) fixture.componentRef.setInput('hideGroupType', opts.hideGroupType);
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.cometchat-group-item__type-indicator') as HTMLElement | null;
}

describe('CometChatGroupItemComponent hideGroupType', () => {
  it('shows the type badge for a private group by default', () => {
    expect(render('private')?.dataset['type']).toBe('private');
  });

  it('hideGroupType=true removes the badge', () => {
    expect(render('password', { hideGroupType: true })).toBeNull();
  });

  it('an explicit hideGroupType=false wins over a global config that hides it', () => {
    expect(render('private', { globalHide: true })).toBeNull();
    TestBed.resetTestingModule();
    expect(render('private', { globalHide: true, hideGroupType: false })?.dataset['type']).toBe('private');
  });
});
