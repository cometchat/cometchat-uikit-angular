/**
 * CometChatPinnedMessages Storybook Stories
 *
 * Interactive stories demonstrating the pinned messages panel variants:
 * - Default pinned list for a group conversation
 * - One-to-one conversation pins
 * - A single pinned message
 * - Your own pin beside another member's
 * - Pinned media messages
 * - Long, overflowing message text
 * - Empty state when nothing is pinned
 * - Loading state with the transcript-shaped shimmer
 * - Error state with retry
 * - Pin cap reached
 * - All variants showcase
 *
 * @module components/cometchat-pinned-messages
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { within, expect } from '@storybook/test';

import { CometChatPinnedMessagesComponent } from './cometchat-pinned-messages.component';
import { CometChatUIKit } from '../../cometchat-uikit';
import { PinSaveService } from '../../services/pin-save.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import {
  createMockUser,
  createMockGroup,
  createMockMessage,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

const loggedInUser = createMockUser({
  uid: 'user-john-doe',
  name: 'John Doe',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
});

const nancyGrace = createMockUser({
  uid: 'user-nancy-grace',
  name: 'Nancy Grace',
  avatar: MOCK_AVATARS.nancyGrace,
  status: CometChat.USER_STATUS.ONLINE,
});

const georgeAlan = createMockUser({
  uid: 'user-george-alan',
  name: 'George Alan',
  avatar: MOCK_AVATARS.georgeAlan,
  status: CometChat.USER_STATUS.OFFLINE,
});

const designTeam = createMockGroup({
  guid: 'group-design-team',
  name: 'Design Team',
  membersCount: 12,
  type: CometChat.GROUP_TYPE.PUBLIC,
});

/** The conversation the pin-cap story acts on, kept apart from the others. */
const releaseTeam = createMockGroup({
  guid: 'group-release-team',
  name: 'Release Team',
  membersCount: 8,
  type: CometChat.GROUP_TYPE.PUBLIC,
});

/** Whole seconds, matching what the SDK stamps on a pin. */
const NOW = Math.floor(Date.now() / 1000);

/** The cap the pin-cap story's app is configured with. */
const PIN_CAP = 10;

/**
 * The panel colours a row and writes "You" by comparing each sender against the
 * logged-in user, which it reads off the static kit — and Storybook never logs
 * anyone in. The stand-in is released again once the last panel is gone, since
 * other story files patch the same static and would otherwise inherit this one.
 */
const originalGetLoggedInUser = CometChatUIKit.getLoggedInUser;
let livePanelCount = 0;

function useStoryLoggedInUser(): void {
  livePanelCount++;
  CometChatUIKit.getLoggedInUser = () => loggedInUser;
}

function releaseStoryLoggedInUser(): void {
  livePanelCount = Math.max(0, livePanelCount - 1);
  if (livePanelCount === 0) {
    CometChatUIKit.getLoggedInUser = originalGetLoggedInUser;
  }
}

/**
 * A pinned message, built on the shared message factory.
 *
 * `pinnedAt` is not decoration: its presence IS the pinned flag — there is no
 * separate boolean — and it is the key the panel orders by. A fixture without
 * it renders as an ordinary message in a list that then looks unsorted.
 */
function createPinnedMessage(options: {
  id: number;
  pinnedAt: number;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  text?: string;
  sender?: CometChat.User;
  sentAt?: number;
  saved?: boolean;
  receiverId?: string;
  receiverType?: string;
  url?: string;
  fileName?: string;
}): CometChat.BaseMessage {
  const sender = options.sender ?? nancyGrace;
  const message = createMockMessage(options.type ?? 'text', {
    id: options.id,
    text: options.text,
    sender,
    sentAt: options.sentAt ?? options.pinnedAt,
    receiverId: options.receiverId ?? designTeam.getGuid(),
    receiverType: options.receiverType ?? CometChat.RECEIVER_TYPE.GROUP,
    url: options.url,
    fileName: options.fileName,
  });

  message.setPinnedAt(options.pinnedAt);
  message.setPinnedBy(sender.getUid());
  if (options.saved) {
    message.setSavedAt(options.pinnedAt);
  }

  return message;
}

/** The default group fixture — deliberately out of pin order, so the sort shows. */
function createGroupPins(): CometChat.BaseMessage[] {
  return [
    createPinnedMessage({
      id: 1001,
      pinnedAt: NOW - 60 * 30,
      sender: nancyGrace,
      text: 'Kick-off is Monday at 10:00. Agenda is in the shared doc.',
    }),
    createPinnedMessage({
      id: 1002,
      pinnedAt: NOW - 60 * 60 * 26,
      sender: georgeAlan,
      text: 'Design freeze is the 14th — nothing new lands after that date.',
    }),
    createPinnedMessage({
      id: 1003,
      pinnedAt: NOW - 60 * 5,
      sender: loggedInUser,
      text: 'Staging is back up. Please re-run your checks against it.',
      saved: true,
    }),
    createPinnedMessage({
      id: 1004,
      pinnedAt: NOW - 60 * 60 * 4,
      sender: georgeAlan,
      type: 'file',
      fileName: 'brand-guidelines.pdf',
      url: 'https://example.com/brand-guidelines.pdf',
    }),
    createPinnedMessage({
      id: 1005,
      pinnedAt: NOW - 60 * 60 * 9,
      sender: nancyGrace,
      text: 'Support rota for this quarter: Nancy, George, then John.',
    }),
    createPinnedMessage({
      id: 1006,
      pinnedAt: NOW - 60 * 60 * 48,
      sender: loggedInUser,
      text: 'Reminder: raise a ticket before you touch the release branch.',
    }),
  ];
}

/**
 * Stands in for MessagesRequestBuilder.
 *
 * The panel uses the builder it is HANDED (re-asserting `setPinned` and the
 * conversation scope on it), so a story can feed the list without going near
 * the SDK — unlike the saved-messages panel, which always builds its own.
 */
function createMockRequestBuilder(
  fetchPrevious: () => Promise<CometChat.BaseMessage[]>
): any {
  const builder: any = {};
  const chainMethods = [
    'setLimit', 'setPinned', 'setSaved', 'setUID', 'setGUID', 'setCategories',
    'setTypes', 'hideReplies', 'setTimestamp', 'setMessageId', 'setParentMessageId',
    'withParent', 'hideDeletedMessages', 'setAttachmentTypes', 'hasLinks',
    'setSearchKeyword', 'setUnread', 'setConversationType',
  ];
  chainMethods.forEach(m => { builder[m] = () => builder; });
  builder.build = () => ({ fetchPrevious, fetchNext: async () => [] });
  return builder;
}

/**
 * Stands in for PinSaveService.
 *
 * The panel awaits `isSaveEnabled()` before it will offer Save or Unsave, and
 * the real service answers false after a one-second timeout when there is no
 * SDK session — so without this the row menu quietly loses an option and the
 * panel looks broken rather than feature-flagged.
 */
function createMockPinSaveService(): any {
  return {
    run: async (action: 'pin' | 'unpin' | 'save' | 'unsave', message: CometChat.BaseMessage) => {
      const now = Math.floor(Date.now() / 1000);
      switch (action) {
        case 'pin':
          message.setPinnedAt(now);
          message.setPinnedBy('user-john-doe');
          CometChatPinSaveEvents.publishMessagePinned({ message });
          break;
        case 'unpin':
          // Cleared rather than zeroed — the presence of the timestamp IS the
          // boolean, so a leftover 0 would read as pinned at the epoch.
          message.setPinnedAt(undefined);
          message.setPinnedBy(undefined);
          CometChatPinSaveEvents.publishMessageUnpinned({ message });
          break;
        case 'save':
          message.setSavedAt(now);
          CometChatPinSaveEvents.publishMessageSaved({ message });
          break;
        case 'unsave':
          message.setSavedAt(undefined);
          CometChatPinSaveEvents.publishMessageUnsaved({ message });
          break;
      }
      return message;
    },
    isSupported: () => true,
    isPinned: (message: CometChat.BaseMessage) => !!message?.getPinnedAt?.(),
    isSaved: (message: CometChat.BaseMessage) => !!message?.getSavedAt?.(),
    pinnedBy: (message: CometChat.BaseMessage) => message?.getPinnedBy?.() ?? null,
    isSystemPin: (message: CometChat.BaseMessage) => message?.getPinnedBy?.() === 'app_system',
    isPinEnabled: async () => true,
    isSaveEnabled: async () => true,
    isPinConversationEnabled: async () => true,
    getConfiguredLimit: async () => null,
  };
}

/**
 * Stands in for FocusTrapService.
 *
 * The real one pulls focus into the panel on mount and installs a document-level
 * key handler. On a docs page carrying several panels they fight each other for
 * focus and scroll the page around, so only a story about focus wants it.
 */
function createNoopFocusTrapService(): any {
  return {
    activate: () => {},
    deactivate: () => {},
    isActive: () => false,
    hasActiveTraps: () => false,
  };
}

/**
 * Feeds the panel a page of pinned messages without an SDK session.
 *
 * The panel needs a sized parent to fill — its host is `height: 100%` — so the
 * wrapper carries the height through rather than letting it collapse onto the
 * header.
 */
@Component({
  selector: 'cometchat-pinned-messages-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatPinnedMessagesComponent],
  template: `
    <cometchat-pinned-messages
      [user]="user"
      [group]="group"
      [messagesRequestBuilder]="mockRequestBuilder"
      [hideCloseButton]="hideCloseButton"
      [quickOptionsCount]="quickOptionsCount"
      [hideUnpinMessageOption]="hideUnpinMessageOption"
      [hideSaveMessageOption]="hideSaveMessageOption"
      [hideUnsaveMessageOption]="hideUnsaveMessageOption"
      [hideMessageInfoOption]="hideMessageInfoOption"
      [hideTranslateMessageOption]="hideTranslateMessageOption"
      [hideCopyMessageOption]="hideCopyMessageOption"
      [hideFlagMessageOption]="hideFlagMessageOption"
      [hideMessagePrivatelyOption]="hideMessagePrivatelyOption">
    </cometchat-pinned-messages>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }
  `],
})
class CometChatPinnedMessagesStoryWrapperComponent implements OnChanges, OnDestroy {
  @Input() user?: CometChat.User;
  @Input() group?: CometChat.Group;
  @Input() hideCloseButton = false;
  @Input() quickOptionsCount = 1;
  @Input() hideUnpinMessageOption = false;
  @Input() hideSaveMessageOption = false;
  @Input() hideUnsaveMessageOption = false;
  @Input() hideMessageInfoOption = false;
  @Input() hideTranslateMessageOption = false;
  @Input() hideCopyMessageOption = false;
  @Input() hideFlagMessageOption = false;
  @Input() hideMessagePrivatelyOption = false;

  @Input() mockMessages: CometChat.BaseMessage[] = [];
  @Input() simulateEmpty = false;
  @Input() simulateError = false;

  /**
   * Cached builder — built once when inputs arrive so Angular sees a stable
   * object reference and doesn't re-trigger fetches on every CD cycle.
   */
  mockRequestBuilder: any = null;

  constructor() {
    useStoryLoggedInUser();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this._buildRequestBuilder();
  }

  ngOnDestroy(): void {
    releaseStoryLoggedInUser();
  }

  private _buildRequestBuilder(): void {
    if (this.simulateError) {
      this.mockRequestBuilder = createMockRequestBuilder(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        throw new Error('Failed to fetch pinned messages. Please try again.');
      });
      return;
    }

    if (this.simulateEmpty) {
      this.mockRequestBuilder = createMockRequestBuilder(async () => []);
      return;
    }

    if (this.mockMessages.length > 0) {
      const page = this.mockMessages;
      this.mockRequestBuilder = createMockRequestBuilder(async () => page);
      return;
    }

    // Nothing to hand back and nothing simulated: hold the panel in its loading
    // state rather than letting it fall through to the real builder, which has
    // no session here and would land on the error state instead.
    this.mockRequestBuilder = createMockRequestBuilder(
      () => new Promise<CometChat.BaseMessage[]>(() => {})
    );
  }
}

/**
 * Drives a refused pin against the REAL PinSaveService.
 *
 * The cap has no state of its own anywhere in the kit — nothing is greyed out
 * or disabled as the list fills. It surfaces only as a rejected call: the pin
 * flips optimistically, the server refuses it, the flip reverts and a toast
 * quotes the app's configured cap. Showing that honestly means letting the real
 * service classify a real rejection, so the four SDK entry points it reaches
 * for are stubbed here — and put back on the way out, because they are global.
 */
@Component({
  selector: 'cometchat-pinned-messages-cap-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatPinnedMessagesComponent],
  template: `
    <cometchat-pinned-messages
      [group]="group"
      [messagesRequestBuilder]="mockRequestBuilder">
    </cometchat-pinned-messages>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
    }
  `],
})
class CometChatPinnedMessagesCapStoryWrapperComponent implements OnChanges, OnDestroy {
  @Input() group?: CometChat.Group;
  @Input() mockMessages: CometChat.BaseMessage[] = [];
  /** The message the conversation has no room for. */
  @Input() overflowMessage?: CometChat.BaseMessage;
  @Input() pinLimit = PIN_CAP;

  mockRequestBuilder: any = null;

  private readonly pinSave = inject(PinSaveService);
  private readonly originalSdk: Record<string, unknown> = {};

  constructor() {
    useStoryLoggedInUser();
    this._installSdkStubs();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.mockRequestBuilder) return;
    const page = this.mockMessages;
    this.mockRequestBuilder = createMockRequestBuilder(async () => page);
  }

  ngOnDestroy(): void {
    this._restoreSdk();
    releaseStoryLoggedInUser();
  }

  /** One more pin than the conversation is allowed to hold. */
  attemptPin(): void {
    if (!this.overflowMessage) return;
    void this.pinSave.run('pin', this.overflowMessage);
  }

  private _installSdkStubs(): void {
    const sdk = CometChat as unknown as Record<string, unknown>;
    const names = [
      'pinMessage', 'unpinMessage', 'saveMessage', 'unsaveMessage',
      'getPinnedMessagesLimit', 'isPinMessageEnabled', 'isSaveMessageEnabled',
      'isPinConversationEnabled',
    ];
    names.forEach(name => { this.originalSdk[name] = sdk[name]; });

    sdk['pinMessage'] = async () => {
      // A refusal costs a round trip, and the optimistic row is meant to be
      // seen arriving before it is taken away again.
      await new Promise(resolve => setTimeout(resolve, 700));
      // Shaped like the server's refusal: the service reads the code to decide
      // whether the cap is the reason, and only then quotes a number.
      const rejection = new Error('Pinned message limit reached') as Error & { code: string };
      rejection.code = 'ERR_PIN_LIMIT_REACHED';
      throw rejection;
    };
    sdk['unpinMessage'] = async () => null;
    sdk['saveMessage'] = async () => null;
    sdk['unsaveMessage'] = async () => null;
    // The number in the toast comes from app settings, never from the rejection.
    sdk['getPinnedMessagesLimit'] = async () => this.pinLimit;
    sdk['isPinMessageEnabled'] = async () => true;
    sdk['isSaveMessageEnabled'] = async () => true;
    sdk['isPinConversationEnabled'] = async () => true;
  }

  private _restoreSdk(): void {
    const sdk = CometChat as unknown as Record<string, unknown>;
    Object.keys(this.originalSdk).forEach(name => { sdk[name] = this.originalSdk[name]; });
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatPinnedMessagesComponent> = {
  title: 'Components/Messages/CometChat Pinned Messages',
  component: CometChatPinnedMessagesComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        CometChatPinnedMessagesStoryWrapperComponent,
        CometChatPinnedMessagesCapStoryWrapperComponent,
      ],
    }),
  ],
  args: {
    hideCloseButton: false,
    quickOptionsCount: 1,
    hideUnpinMessageOption: false,
    hideSaveMessageOption: false,
    hideUnsaveMessageOption: false,
    hideMessageInfoOption: false,
    hideTranslateMessageOption: false,
    hideCopyMessageOption: false,
    hideFlagMessageOption: false,
    hideMessagePrivatelyOption: false,
  },
  argTypes: {
    // Data Configuration
    user: {
      control: false,
      description: 'CometChat.User object scoping the panel to a 1-on-1 conversation',
      table: {
        type: { summary: 'CometChat.User' },
        category: 'Data Configuration',
      },
    },
    group: {
      control: false,
      description: 'CometChat.Group object scoping the panel to a group conversation',
      table: {
        type: { summary: 'CometChat.Group' },
        category: 'Data Configuration',
      },
    },
    messagesRequestBuilder: {
      control: false,
      description:
        'Custom messages request builder. Used as supplied apart from setPinned and the conversation scope, which are re-asserted',
      table: {
        type: { summary: 'CometChat.MessagesRequestBuilder' },
        category: 'Data Configuration',
      },
    },
    textFormatters: {
      control: false,
      description:
        'Text formatters applied to each row. Falls back to the global config set when unset',
      table: {
        type: { summary: 'CometChatTextFormatter[]' },
        category: 'Data Configuration',
      },
    },

    // Display Controls
    hideCloseButton: {
      control: 'boolean',
      description: 'Hide the header close button, for hosts that supply their own chrome',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    quickOptionsCount: {
      control: 'number',
      description:
        'How many row options stay outside the overflow menu as bare icons. Unpin is first',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
        category: 'Display Controls',
      },
    },

    // Message Options
    hideUnpinMessageOption: {
      control: 'boolean',
      description: 'Hide the Unpin option',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideSaveMessageOption: {
      control: 'boolean',
      description: 'Hide the Save option on messages that are not saved',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideUnsaveMessageOption: {
      control: 'boolean',
      description: 'Hide the Unsave option on messages that are already saved',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideMessageInfoOption: {
      control: 'boolean',
      description: 'Hide the Message Information option, offered on your own messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideTranslateMessageOption: {
      control: 'boolean',
      description: 'Hide the Translate option, offered on text messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideCopyMessageOption: {
      control: 'boolean',
      description: 'Hide the Copy option, offered on text messages',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideFlagMessageOption: {
      control: 'boolean',
      description: "Hide the Report option, offered on other members' messages",
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },
    hideMessagePrivatelyOption: {
      control: 'boolean',
      description: "Hide the Message Privately option, offered on others' messages in groups",
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Message Options',
      },
    },

    // Custom Views
    headerView: {
      control: false,
      description: 'Custom template replacing the default header row',
      table: {
        type: { summary: 'TemplateRef<unknown>' },
        category: 'Custom Views',
      },
    },
    emptyView: {
      control: false,
      description: 'Custom template for the empty state',
      table: {
        type: { summary: 'TemplateRef<unknown>' },
        category: 'Custom Views',
      },
    },
    errorView: {
      control: false,
      description: 'Custom template for the error state, retry included',
      table: {
        type: { summary: 'TemplateRef<unknown>' },
        category: 'Custom Views',
      },
    },
    loadingView: {
      control: false,
      description: 'Custom template replacing the shimmer',
      table: {
        type: { summary: 'TemplateRef<unknown>' },
        category: 'Custom Views',
      },
    },
    itemView: {
      control: false,
      description:
        'Custom template replacing a whole row, its click and keyboard handling included',
      table: {
        type: {
          summary:
            'TemplateRef<{ $implicit: CometChat.BaseMessage; message: CometChat.BaseMessage }>',
        },
        category: 'Custom Views',
      },
    },

    // Events
    closeClick: {
      action: 'closeClick',
      description: 'Emitted by the close button, or by Escape with no overlay on top',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    messageClick: {
      action: 'messageClick',
      description: 'Emitted when a row is activated by click, Enter or Space',
      table: {
        type: { summary: 'EventEmitter<CometChat.BaseMessage>' },
        category: 'Events',
      },
    },
    messageOptionClick: {
      action: 'messageOptionClick',
      description:
        'Emitted for options the panel cannot complete itself — Translate, Report and Message Privately',
      table: {
        type: {
          summary:
            'EventEmitter<{ option: ContextMenuItem; message: CometChat.BaseMessage }>',
        },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted when the fetch fails',
      table: {
        type: { summary: 'EventEmitter<CometChat.CometChatException>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatPinnedMessages lists the pinned messages of one conversation, newest pin first, rendering each row as a full message bubble with its author, avatar and date; it is read-only, so opening it marks nothing as read and moves no unread count, and each row offers Unpin, Save/Unsave, Info, Translate, Copy, Report and Message Privately, with the two removing actions behind a confirmation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatPinnedMessagesComponent>;

// ============================================
// Stories
// ============================================

/** Default pinned list for a group conversation. */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: createGroupPins(),
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [hideCloseButton]="hideCloseButton"
          [quickOptionsCount]="quickOptionsCount"
          [hideUnpinMessageOption]="hideUnpinMessageOption"
          [hideSaveMessageOption]="hideSaveMessageOption"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideMessageInfoOption]="hideMessageInfoOption"
          [hideTranslateMessageOption]="hideTranslateMessageOption"
          [hideCopyMessageOption]="hideCopyMessageOption"
          [hideFlagMessageOption]="hideFlagMessageOption"
          [hideMessagePrivatelyOption]="hideMessagePrivatelyOption">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Six pinned messages from a group, fed to the panel in a deliberately scrambled order. They arrive sorted newest pin first, not newest message first, and every row runs down the left with your own pins carrying the outgoing colour and the name "You".',
      },
    },
  },
};

/** Pins of a one-to-one conversation. */
export const OneToOneConversation: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      user: nancyGrace,
      mockMessages: [
        createPinnedMessage({
          id: 2001,
          pinnedAt: NOW - 60 * 12,
          sender: nancyGrace,
          receiverId: nancyGrace.getUid(),
          receiverType: CometChat.RECEIVER_TYPE.USER,
          text: 'Here is the address for Thursday: 14 Rue Lafayette, 3rd floor.',
        }),
        createPinnedMessage({
          id: 2002,
          pinnedAt: NOW - 60 * 60 * 20,
          sender: loggedInUser,
          receiverId: nancyGrace.getUid(),
          receiverType: CometChat.RECEIVER_TYPE.USER,
          text: 'My flight lands at 08:40, so I should be with you by 10:00.',
        }),
      ],
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [user]="user"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The same panel scoped with `user` rather than `group`. Message Privately is dropped from the row menu outside a group, since there is no separate private channel to open, so the overflow menu is one item shorter than the group story\'s.',
      },
    },
  },
};

/** A conversation with exactly one pin. */
export const SingleItem: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: [
        createPinnedMessage({
          id: 3001,
          pinnedAt: NOW - 60 * 3,
          sender: georgeAlan,
          text: 'Wi-Fi password for the studio: cometchat-guest-2025',
        }),
      ],
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A single pinned message — the most common shape in practice, since most conversations pin one thing and leave it there. The row sits at the top of an otherwise empty list rather than being centred, which is what tells the reader the panel is a list and not a card.',
      },
    },
  },
};

/** Your own pin beside another member's. */
export const OwnAndReceivedPins: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: [
        createPinnedMessage({
          id: 4001,
          pinnedAt: NOW - 60 * 2,
          sender: loggedInUser,
          text: 'Release checklist is in the doc — I have pinned it so nobody has to hunt.',
        }),
        createPinnedMessage({
          id: 4002,
          pinnedAt: NOW - 60 * 8,
          sender: nancyGrace,
          text: 'The checklist is missing the rollback step. Adding it now.',
        }),
      ],
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'One pin from the logged-in user and one from another member. Both run down the left because this is a list of pins rather than a dialogue, so authorship is carried by the bubble colour and by the "You" label instead of by the side of the panel a row sits on.',
      },
    },
  },
};

/** Pinned media — image, video, audio and file. */
export const PinnedMediaMessages: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: [
        createPinnedMessage({
          id: 5001,
          pinnedAt: NOW - 60 * 4,
          sender: nancyGrace,
          type: 'image',
          url: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-2.webp',
          fileName: 'homepage-hero.jpg',
        }),
        createPinnedMessage({
          id: 5002,
          pinnedAt: NOW - 60 * 40,
          sender: loggedInUser,
          type: 'video',
          url: '/assets/sample-video.mp4',
          fileName: 'walkthrough.mp4',
        }),
        createPinnedMessage({
          id: 5003,
          pinnedAt: NOW - 60 * 90,
          sender: georgeAlan,
          type: 'audio',
          url: '/audio/sample-audio.mp3',
          fileName: 'standup-recap.mp3',
        }),
        createPinnedMessage({
          id: 5004,
          pinnedAt: NOW - 60 * 60 * 6,
          sender: georgeAlan,
          type: 'file',
          url: 'https://example.com/q3-report.pdf',
          fileName: 'q3-report.pdf',
        }),
      ],
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Pinned attachments rendered by their real bubbles — image, video, audio and file. Media is what people pin most, and each bubble is capped to the panel width so a wide attachment clips instead of introducing a sideways scrollbar; Copy and Translate drop out of these rows, because there is no text to act on.',
      },
    },
  },
};

/** Long message text, wrapped inside a narrow panel. */
export const LongMessageText: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: [
        createPinnedMessage({
          id: 6001,
          pinnedAt: NOW - 60,
          sender: nancyGrace,
          text:
            'Release process, pinned so nobody has to ask again. Cut the branch on the Monday, ' +
            'freeze it on the Wednesday, and run the full regression suite overnight against ' +
            'staging. If anything red comes back, raise it in this channel before you touch ' +
            'the branch — the person who cut it owns the fix, and a second pair of eyes signs ' +
            'it off. Once the suite is green twice in a row, tag the release, publish the ' +
            'notes, and let support know an hour before it goes out so they can watch the ' +
            'inbox. Anything that slips this window waits for the next train rather than ' +
            'being squeezed in on the day.',
        }),
        createPinnedMessage({
          id: 6002,
          pinnedAt: NOW - 60 * 20,
          sender: loggedInUser,
          text:
            'Dashboard: https://internal.example.com/observability/dashboards/release-train/overview?range=7d&team=platform',
        }),
      ],
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A long paragraph and a long unbroken URL, both pinned. The panel is narrower than the conversation it comes from, so this is the case that shows whether text wraps and clips cleanly — the list must never scroll sideways, and a row must never push the panel wider than its host.',
      },
    },
  },
};

/** Empty state when nothing is pinned. */
/** A conversation pinned right up to its cap — the longest this panel ever gets. */
export const ManyPins: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: Array.from({ length: PIN_CAP }, (_, i) =>
        createPinnedMessage({
          id: 8001 + i,
          pinnedAt: NOW - i * 1200,
          sender: i % 2 === 0 ? nancyGrace : georgeAlan,
          text: `Pinned item ${i + 1} — kept at the top for the whole conversation.`,
        })
      ),
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The panel at full length. `PIN_CAP` rather than an arbitrary large number is the honest ceiling here: the pinned list is not cursor-paginated — the server ignores the cursor under `pinned=1` and returns the whole capped list in one page — so a conversation at its cap IS the longest this panel can be, and scrolling has to work at exactly this size and no further. [PinCapReached](?path=/story/components-messages-cometchat-pinned-messages--pin-cap-reached) shows the same length from the other side: what happens when someone tries to add one more.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      simulateEmpty: true,
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [simulateEmpty]="simulateEmpty">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A conversation with nothing pinned: illustration, "No pinned messages yet", and a line saying what pinning is for. The panel reaches this state two ways — an empty page from the server, and being mounted with neither a `user` nor a `group`, which short-circuits before any fetch.',
      },
    },
  },
};

/** Loading state while the pins are being fetched. */
export const LoadingState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The panel while its one request is in flight, held here by a fetch that never resolves. The skeleton is transcript-shaped — avatar, header line, bubble — rather than row-shaped, because that is what the loaded list looks like and a skeleton that reshapes on arrival reads as a flicker.',
      },
    },
  },
};

/** Error state with a retry. */
export const ErrorState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      simulateError: true,
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [simulateError]="simulateError">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The fetch rejected. This is the only state the user can act on, so it carries a Retry that reloads from scratch; the `error` output fires alongside it, letting the host log or report the failure without the panel changing shape.',
      },
    },
  },
};

/** Pin cap reached — a refused pin, reverted, with the cap quoted in a toast. */
export const PinCapReached: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        // The real service, so the refusal is classified by the code that ships
        // rather than by the story: a limit-shaped rejection is what turns the
        // generic error copy into the cap message.
        PinSaveService,
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    props: {
      group: releaseTeam,
      pinLimit: PIN_CAP,
      mockMessages: Array.from({ length: PIN_CAP }, (_, i) =>
        createPinnedMessage({
          id: 7001 + i,
          pinnedAt: NOW - i * 900,
          sender: i % 2 === 0 ? nancyGrace : loggedInUser,
          receiverId: releaseTeam.getGuid(),
          text: `Pinned note ${i + 1} of ${PIN_CAP} — this conversation is at its cap.`,
        })
      ),
      // Built without pin timestamps on purpose: the attempt is what pins it,
      // and a fixture that arrives already pinned would skip the flip the story
      // exists to show.
      overflowMessage: createMockMessage('text', {
        id: 7100,
        sender: georgeAlan,
        sentAt: NOW,
        receiverId: releaseTeam.getGuid(),
        receiverType: CometChat.RECEIVER_TYPE.GROUP,
        text: 'One more for the pile — this is the pin the conversation has no room for.',
      }),
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3); align-items: center;">
        <button
          type="button"
          (click)="capDemo.attemptPin()"
          style="padding: var(--cometchat-padding-2) var(--cometchat-padding-4); border: 1px solid var(--cometchat-border-color-default); border-radius: var(--cometchat-radius-2); background: var(--cometchat-background-color-01); color: var(--cometchat-text-color-primary); font: var(--cometchat-font-body-medium); cursor: pointer;">
          Pin one more message
        </button>
        <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
          <cometchat-pinned-messages-cap-story-wrapper
            #capDemo
            [group]="group"
            [pinLimit]="pinLimit"
            [mockMessages]="mockMessages"
            [overflowMessage]="overflowMessage">
          </cometchat-pinned-messages-cap-story-wrapper>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A conversation sitting on its ten-pin cap, with the button attempting an eleventh. Nothing about the panel says "full" — the cap has no disabled or greyed-out state anywhere in the kit — so watch instead for the optimistic row arriving at the top, being taken away again when the server refuses, and a toast quoting the cap read from app settings rather than scraped from the rejection.',
      },
    },
  },
};

/** A deliberately narrowed option set, for a panel that should mostly be read. */
export const TrimmedOptions: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: {
    hideSaveMessageOption: true,
    hideUnsaveMessageOption: true,
    hideTranslateMessageOption: true,
    hideFlagMessageOption: true,
    quickOptionsCount: 0,
  },
  render: args => ({
    props: {
      ...args,
      group: designTeam,
      mockMessages: createGroupPins(),
    },
    template: `
      <div class="cometchat-pinned-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [quickOptionsCount]="quickOptionsCount"
          [hideSaveMessageOption]="hideSaveMessageOption"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideTranslateMessageOption]="hideTranslateMessageOption"
          [hideFlagMessageOption]="hideFlagMessageOption">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Save, unsave, translate and flag all hidden, and `quickOptionsCount: 0` folding what remains into the overflow menu — so a row offers Unpin and little else. Two independent levers are at work and they are easy to confuse: the `hide*` inputs decide which options EXIST, while `quickOptionsCount` decides how many of the survivors sit outside the menu as bare icons. Setting the count without hiding anything just moves options around; hiding without the count leaves the first survivor promoted to an icon.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Every panel state in a single view — loaded, empty and error. */
export const AllVariantsShowcase: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    props: {
      group: designTeam,
      loadedMessages: createGroupPins(),
    },
    template: `
      <div class="cometchat-pinned-messages-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-pinned-messages-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Pinned Messages Variants
        </h3>

        <!-- Loaded -->
        <div class="cometchat-pinned-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-pinned-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded — newest pin first
          </p>
          <div class="cometchat-pinned-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-pinned-messages-story-wrapper
              [group]="group"
              [mockMessages]="loadedMessages">
            </cometchat-pinned-messages-story-wrapper>
          </div>
        </div>

        <!-- Empty -->
        <div class="cometchat-pinned-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-pinned-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty — nothing pinned yet
          </p>
          <div class="cometchat-pinned-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-pinned-messages-story-wrapper
              [group]="group"
              [simulateEmpty]="true">
            </cometchat-pinned-messages-story-wrapper>
          </div>
        </div>

        <!-- Error -->
        <div class="cometchat-pinned-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-pinned-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error — with retry
          </p>
          <div class="cometchat-pinned-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-pinned-messages-story-wrapper
              [group]="group"
              [simulateError]="true">
            </cometchat-pinned-messages-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The loaded, empty and error states of the panel in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

/** Verifies the loaded list renders a row per pinned message. */
export const TestListRendersRows: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    props: {
      group: designTeam,
      mockMessages: createGroupPins(),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const list = canvasElement.querySelector('.cometchat-pinned-messages__list, [class*="pinned-messages"] [class*="__list"]');
    expect(list).not.toBeNull();

    const rows = canvasElement.querySelectorAll('.cometchat-pinned-messages__item');
    expect(rows.length).toBe(6);

    // Rows render full bubbles, not compact previews.
    const bubbles = canvasElement.querySelectorAll('.cometchat-pinned-messages__item cometchat-message-bubble');
    expect(bubbles.length).toBeGreaterThan(0);
  },
};

/** Verifies the empty state renders its illustration and copy. */
export const TestEmptyStateRendersIllustration: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    props: {
      group: designTeam,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [simulateEmpty]="true">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 3000));
    const empty = canvasElement.querySelector('.cometchat-pinned-messages__state--empty, [class*="pinned-messages"] [class*="--empty"]');
    expect(empty).not.toBeNull();

    const illustration = canvasElement.querySelector('.cometchat-pinned-messages__empty-icon');
    expect(illustration).not.toBeNull();

    const title = canvasElement.querySelector('.cometchat-pinned-messages__empty-title');
    expect(title).not.toBeNull();
    expect(title!.textContent!.trim()).toContain('No pinned messages');

    const subtitle = canvasElement.querySelector('.cometchat-pinned-messages__empty-subtitle');
    expect(subtitle).not.toBeNull();

    // Nothing to list, so no rows and no scroller.
    const rows = canvasElement.querySelectorAll('.cometchat-pinned-messages__item');
    expect(rows.length).toBe(0);
  },
};

/** Verifies hideCloseButton=true removes the header close button. */
export const TestHideCloseButton: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: PinSaveService,
          useFactory: () => createMockPinSaveService(),
        },
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    props: {
      group: designTeam,
      mockMessages: createGroupPins(),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-pinned-messages-story-wrapper
          [group]="group"
          [mockMessages]="mockMessages"
          [hideCloseButton]="true">
        </cometchat-pinned-messages-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 2000));
    const header = canvasElement.querySelector('.cometchat-pinned-messages__header');
    expect(header).not.toBeNull();

    const closeButtons = canvasElement.querySelectorAll('.cometchat-pinned-messages__close');
    expect(closeButtons.length).toBe(0);
  },
};
