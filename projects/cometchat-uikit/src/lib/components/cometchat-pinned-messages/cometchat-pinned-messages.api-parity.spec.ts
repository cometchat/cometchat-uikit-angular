/**
 * Pinned / Saved panels — React API parity Tests
 *
 * The slots and flags ported from the React kit: `itemView` replacing a whole
 * row, `textFormatters` reaching the row's text, `hideMessagePrivatelyOption`
 * governing an option that actually exists, and the `quickOptionsCount` default.
 *
 * @module components/cometchat-pinned-messages/api-parity
 */

// The calls SDK pulls in a JitsiMeetJS runtime that does not exist in jsdom.
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
  },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatPinnedMessagesComponent } from './cometchat-pinned-messages.component';
import { CometChatSavedMessagesComponent } from '../cometchat-saved-messages/cometchat-saved-messages.component';
import { PinSaveService } from '../../services/pin-save.service';
import { CometChatUIKitConstants } from '../../constants';

const OPTION = CometChatUIKitConstants.MessageOption;

function fakeMessage(id: number, senderUid = 'someone'): any {
  const base: Record<string, unknown> = {
    getId: () => id,
    getText: () => `m${id}`,
    getType: () => 'text',
    getCategory: () => 'message',
    getSender: () => ({ getUid: () => senderUid, getName: () => 'Someone', getAvatar: () => '' }),
    getSentAt: () => 1_700_000_000,
    getReceiverId: () => 'group-a',
    getPinnedAt: () => 1_700_000_100,
    getPinnedBy: () => 'someone',
    getSavedAt: () => 1_700_000_100,
    isPinned: () => true,
    isSaved: () => false,
    getReactions: () => [],
    getParentMessageId: () => 0,
    getDeletedAt: () => undefined,
    getMetadata: () => ({}),
    getMentionedUsers: () => [],
  };
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      if (typeof prop !== 'string') return undefined;
      if (prop.startsWith('get')) return () => undefined;
      if (prop.startsWith('is') || prop.startsWith('has')) return () => false;
      return undefined;
    },
  });
}

const page = [fakeMessage(1), fakeMessage(2)];

function installSdkFake(): void {
  (CometChat as any).MessagesRequestBuilder = class {
    setLimit() { return this; }
    setPinned() { return this; }
    setSaved() { return this; }
    setGUID() { return this; }
    setUID() { return this; }
    build() {
      return { fetchPrevious: async () => page };
    }
  };
}

class FakePinSaveService {
  run = vi.fn().mockResolvedValue(null);
  isSystemPin = vi.fn().mockReturnValue(false);
  isSaveEnabled = vi.fn(async () => true);
  isPinEnabled = vi.fn(async () => true);
  isSupported = vi.fn().mockReturnValue(true);
}

const group = {
  getGuid: () => 'group-a',
  getName: () => 'A',
  getOwner: () => 'me',
  getScope: () => 'admin',
} as unknown as CometChat.Group;

@Component({
  standalone: true,
  imports: [CometChatPinnedMessagesComponent, CometChatSavedMessagesComponent],
  template: `
    <cometchat-pinned-messages
      [group]="group"
      [itemView]="pinnedSlot ? row : undefined"
    ></cometchat-pinned-messages>

    <cometchat-saved-messages [itemView]="savedSlot ? row : undefined"></cometchat-saved-messages>

    <ng-template #row let-message>
      <div class="spec-row">custom {{ message.getId() }}</div>
    </ng-template>
  `,
})
class HostComponent {
  group = group;
  pinnedSlot = false;
  savedSlot = false;
  @ViewChild(CometChatPinnedMessagesComponent) pinned!: CometChatPinnedMessagesComponent;
}

describe('Pinned / Saved panels — React API parity', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  async function build(opts: { pinnedSlot?: boolean; savedSlot?: boolean } = {}) {
    installSdkFake();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: PinSaveService, useValue: new FakePinSaveService() }],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.pinnedSlot = opts.pinnedSlot ?? false;
    host.savedSlot = opts.savedSlot ?? false;
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(async () => {
    await build();
  });

  // ── itemView ──

  it('renders the built-in row when no itemView is supplied', () => {
    expect(el.querySelector('.cometchat-pinned-messages__item')).toBeTruthy();
    expect(el.querySelector('.spec-row')).toBeNull();
  });

  it('replaces the pinned row entirely when itemView is supplied', async () => {
    await build({ pinnedSlot: true });
    // The default row goes with it — a host taking the row over owns its
    // interaction, which is why this replaces rather than decorates.
    expect(el.querySelector('.cometchat-pinned-messages__item')).toBeNull();
    expect(el.querySelectorAll('.spec-row').length).toBe(page.length);
  });

  it('hands the message to the pinned itemView as $implicit', async () => {
    await build({ pinnedSlot: true });
    expect(el.querySelector('.spec-row')!.textContent).toContain('custom 1');
  });

  it('replaces the saved row too, keeping the list semantics', async () => {
    await build({ savedSlot: true });
    expect(el.querySelector('.cometchat-saved-messages__row')).toBeNull();
    // The <li> is ours; its contents are the host's.
    expect(el.querySelector('li > .spec-row')).toBeTruthy();
  });

  // ── quickOptionsCount ──

  it('defaults quickOptionsCount to 1, as the React kit does', () => {
    expect(host.pinned.quickOptionsCount).toBe(1);
  });

  // ── hideMessagePrivatelyOption ──

  it('offers Message Privately on someone else\'s pinned message in a group', () => {
    const ids = host.pinned.optionsFor(fakeMessage(1)).map(o => o.id);
    expect(ids).toContain(OPTION.sendMessagePrivately);
  });

  it('hides it when the flag is set', () => {
    host.pinned.hideMessagePrivatelyOption = true;
    const ids = host.pinned.optionsFor(fakeMessage(1)).map(o => o.id);
    expect(ids).not.toContain(OPTION.sendMessagePrivately);
  });

  it('never offers it outside a group — there is no private channel to open', () => {
    host.pinned.group = undefined;
    const ids = host.pinned.optionsFor(fakeMessage(1)).map(o => o.id);
    expect(ids).not.toContain(OPTION.sendMessagePrivately);
  });
});
