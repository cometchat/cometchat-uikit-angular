/**
 * CometChatSavedMessages Storybook Stories
 *
 * Interactive stories demonstrating the saved messages list component variants:
 * - Default list of saves spanning several conversations
 * - A single saved message
 * - Saved media messages, captioned and uncaptioned
 * - Long message text
 * - Read-only list with the unsave action hidden
 * - Empty state when nothing is saved
 * - Loading state with shimmer/skeleton UI
 * - Error state with retry
 * - All variants showcase
 *
 * @module components/cometchat-saved-messages
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { within, expect } from '@storybook/test';

import { CometChatSavedMessagesComponent } from './cometchat-saved-messages.component';
import { CometChatUIKit } from '../../cometchat-uikit';
import { PinSaveService } from '../../services/pin-save.service';
import { FocusTrapService } from '../../services/focus-trap.service';
import { CometChatPinSaveEvents } from '../../events/CometChatPinSaveEvents';
import {
  createMockGroup,
  createMockMessage,
  createMockUser,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Data
// ============================================

const loggedInUser = createMockUser({
  uid: 'user-john-doe',
  name: 'John Doe',
  avatar: MOCK_AVATARS.andrewJoseph,
});

/**
 * A save is private to one person, and the panel has to know who that is: it
 * decides which side of a 1-1 gives the row its title, and which group rows read
 * "You:". Storybook never logs anyone in, so a stand-in is installed while a
 * panel is on screen and released once the last one is gone — other story files
 * patch the same static and would otherwise inherit this one.
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

const nancyGrace = createMockUser({
  uid: 'user-nancy-grace',
  name: 'Nancy Grace',
  avatar: MOCK_AVATARS.nancyGrace,
});

const georgeAlan = createMockUser({
  uid: 'user-george-alan',
  name: 'George Alan',
  avatar: MOCK_AVATARS.georgeAlan,
});

const designTeam = createMockGroup({
  guid: 'group-design-team',
  name: 'Design Team',
  membersCount: 12,
});

const supportEscalations = createMockGroup({
  guid: 'group-support-escalations',
  name: 'Support Escalations',
  membersCount: 34,
});

const productLaunch = createMockGroup({
  guid: 'group-product-launch',
  name: 'Product Launch — Q3 Planning, Rollout and Retrospective',
  membersCount: 46,
});

/**
 * Every conversation the fixtures point at, keyed by the id the panel resolves.
 *
 * A saved row carries only a raw uid or guid, so the panel looks the
 * conversation up to title the row. Anything missing here stays on screen as its
 * raw id — which is exactly what the panel does when a real lookup fails.
 */
const sourceDirectory = new Map<string, CometChat.User | CometChat.Group>([
  [nancyGrace.getUid(), nancyGrace],
  [georgeAlan.getUid(), georgeAlan],
  [designTeam.getGuid(), designTeam],
  [supportEscalations.getGuid(), supportEscalations],
  [productLaunch.getGuid(), productLaunch],
]);

/** Rows are keyed by message id, so every fixture needs its own. */
let nextMessageId = 9001;

const BASE_TIME = Math.floor(Date.now() / 1000);

/** Any parent id marks a row as a thread reply; the value itself is never shown. */
const THREAD_PARENT_ID = 8001;

type SavedMessageType = 'text' | 'image' | 'video' | 'audio' | 'file';

interface SavedMessageOptions {
  type?: SavedMessageType;
  text?: string;
  /** A captioned attachment previews its caption instead of naming its type. */
  caption?: string;
  /** Sent by the logged-in user rather than by the other party. */
  fromMe?: boolean;
  minutesAgo?: number;
  threadReply?: boolean;
}

function buildSavedMessage(
  params: SavedMessageOptions & {
    receiverId: string;
    receiverType: string;
    sender: CometChat.User;
  }
): CometChat.BaseMessage {
  const sentAt = BASE_TIME - (params.minutesAgo ?? 0) * 60;

  const message = createMockMessage(params.type ?? 'text', {
    id: nextMessageId++,
    receiverId: params.receiverId,
    receiverType: params.receiverType,
    sender: params.sender,
    text: params.text,
    sentAt,
    parentMessageId: params.threadReply ? THREAD_PARENT_ID : undefined,
  });

  // The panel trusts the query rather than reading this back, but a fixture on a
  // saved list should still carry the stamp the server would have set.
  message.setSavedAt(sentAt + 60);

  if (params.caption) {
    (message as CometChat.MediaMessage).setCaption(params.caption);
  }

  return message;
}

/**
 * A saved message from a 1-1 conversation with `peer`.
 *
 * Which side receives it matters: on a message you received the receiver is you,
 * so the panel titles the row with the sender instead — get this backwards and
 * every incoming save files itself under your own name.
 */
function savedDirectMessage(
  peer: CometChat.User,
  options: SavedMessageOptions = {}
): CometChat.BaseMessage {
  const fromMe = options.fromMe ?? false;
  return buildSavedMessage({
    ...options,
    receiverId: fromMe ? peer.getUid() : loggedInUser.getUid(),
    receiverType: CometChat.RECEIVER_TYPE.USER,
    sender: fromMe ? loggedInUser : peer,
  });
}

/** A saved message from a group, spoken by `sender`. */
function savedGroupMessage(
  group: CometChat.Group,
  sender: CometChat.User,
  options: SavedMessageOptions = {}
): CometChat.BaseMessage {
  return buildSavedMessage({
    ...options,
    receiverId: group.getGuid(),
    receiverType: CometChat.RECEIVER_TYPE.GROUP,
    sender,
  });
}

/** Saves spread across four conversations, both directions, mixed types. */
function createSavedMessages(): CometChat.BaseMessage[] {
  return [
    savedDirectMessage(nancyGrace, {
      text: 'Address for Friday: 214 Bridge Street, second floor.',
      minutesAgo: 12,
    }),
    savedGroupMessage(designTeam, georgeAlan, {
      text: 'Signed off: [Design spec v4](https://example.com/spec-v4)',
      minutesAgo: 95,
    }),
    savedGroupMessage(designTeam, loggedInUser, {
      text: 'Booked the small room for the review on Thursday.',
      minutesAgo: 140,
    }),
    savedDirectMessage(georgeAlan, {
      type: 'image',
      caption: 'The wiring diagram we agreed on',
      // Saved from your own side of the chat: the row is still titled with
      // George, because a 1-1 row names the other party either way.
      fromMe: true,
      minutesAgo: 320,
    }),
    savedGroupMessage(supportEscalations, nancyGrace, {
      type: 'file',
      minutesAgo: 700,
    }),
    savedDirectMessage(nancyGrace, {
      text: 'Yes — start with the second option.',
      threadReply: true,
      minutesAgo: 1500,
    }),
  ];
}

/** One saved message, for the smallest list the panel can show. */
function createSingleSavedMessage(): CometChat.BaseMessage[] {
  return [
    savedDirectMessage(nancyGrace, {
      text: 'The venue confirmed for the 14th.',
      minutesAgo: 8,
    }),
  ];
}

/** One of every attachment type, captioned and not. */
function createSavedMediaMessages(): CometChat.BaseMessage[] {
  return [
    savedDirectMessage(nancyGrace, {
      type: 'image',
      caption: 'Shortlist for the cover',
      minutesAgo: 20,
    }),
    savedDirectMessage(nancyGrace, { type: 'image', minutesAgo: 45 }),
    savedGroupMessage(designTeam, georgeAlan, { type: 'video', minutesAgo: 180 }),
    savedGroupMessage(designTeam, georgeAlan, { type: 'audio', minutesAgo: 240 }),
    savedDirectMessage(georgeAlan, { type: 'file', minutesAgo: 600 }),
  ];
}

const LONG_MESSAGE_TEXT =
  'Recapping the whole thread so it is in one place: we are keeping the current ' +
  'onboarding order, moving the address step behind the payment step, and dropping ' +
  'the interstitial entirely — Nancy is writing the copy and George is picking the ' +
  'screenshots, both due the Monday after the review.';

/** Text longer than a row can hold, in both a 1-1 and a long-named group. */
function createLongTextMessages(): CometChat.BaseMessage[] {
  return [
    savedDirectMessage(nancyGrace, { text: LONG_MESSAGE_TEXT, minutesAgo: 5 }),
    savedGroupMessage(productLaunch, georgeAlan, {
      text: LONG_MESSAGE_TEXT,
      minutesAgo: 60,
    }),
  ];
}

// ============================================
// Mock Classes
// ============================================

/** What one story's panel should read back from the SDK. */
interface SavedMessagesScenario {
  /** Pages served in order, one per fetch. */
  pages: CometChat.BaseMessage[][];
  /** Never resolve, so the panel stays on its shimmer. */
  hang?: boolean;
  /** Reject, so the panel shows its error state and Retry button. */
  fail?: boolean;
}

/**
 * Story data, keyed by the page size the panel will ask for.
 *
 * Unlike the message list, this panel cannot be fed through its
 * `messagesRequestBuilder` input: a builder is single-shot, so the panel only
 * READS a supplied one — for its limit — and then builds its own. That limit is
 * therefore the one value that travels from a story into the request, so each
 * story takes a unique one and the fake serves the pages registered under it.
 * Keying on a global "current story" instead would break the showcase, where
 * Angular runs every sibling's ngOnInit before it creates any of their panels.
 */
const scenariosByPageSize = new Map<number, SavedMessagesScenario>();

/** Distinctive enough not to collide with a real page size in a reader's mind. */
let nextScenarioPageSize = 101;

const EMPTY_SCENARIO: SavedMessagesScenario = { pages: [[]] };

/**
 * Stands in for CometChat.MessagesRequestBuilder while a story is mounted.
 *
 * Only the three members the panel touches are implemented; `limit` is a plain
 * field because the SDK exposes no getter for it and the panel reads it directly.
 */
class StorySavedMessagesRequestBuilder {
  limit = 30;

  private scenario: SavedMessagesScenario = EMPTY_SCENARIO;

  setLimit(limit: number): this {
    this.limit = limit;
    this.scenario = scenariosByPageSize.get(limit) ?? EMPTY_SCENARIO;
    return this;
  }

  setSaved(): this {
    return this;
  }

  build(): CometChat.MessagesRequest {
    const scenario = this.scenario;
    let page = 0;
    return {
      fetchPrevious: async () => {
        if (scenario.hang) return new Promise<CometChat.BaseMessage[]>(() => {});
        if (scenario.fail) {
          // A beat of loading first, so the shimmer is seen before the error.
          await new Promise(r => setTimeout(r, 300));
          throw new Error('Failed to fetch saved messages.');
        }
        return scenario.pages[page++] ?? [];
      },
    } as unknown as CometChat.MessagesRequest;
  }
}

let sdkFakeUsers = 0;
let realMessagesRequestBuilder: unknown = null;
let realGetUser: unknown = null;
let realGetGroup: unknown = null;

/**
 * Point the SDK at story data.
 *
 * Counted, because the patch is process-wide and a docs page mounts every story
 * at once: the last story to unmount is the one that must put the real SDK back,
 * or the message-list and search stories that run after this file would read
 * from the fake.
 */
function installSavedMessagesSdkFake(): void {
  if (sdkFakeUsers++ > 0) return;

  const sdk = CometChat as unknown as Record<string, unknown>;
  realMessagesRequestBuilder = sdk['MessagesRequestBuilder'];
  realGetUser = sdk['getUser'];
  realGetGroup = sdk['getGroup'];

  sdk['MessagesRequestBuilder'] = StorySavedMessagesRequestBuilder;
  // Rows show the raw uid or guid until the conversation resolves, so without
  // these the whole list reads as a column of ids.
  sdk['getUser'] = async (uid: string) => {
    const user = sourceDirectory.get(uid);
    if (!user) throw new Error(`No mock user for ${uid}`);
    return user;
  };
  sdk['getGroup'] = async (guid: string) => {
    const group = sourceDirectory.get(guid);
    if (!group) throw new Error(`No mock group for ${guid}`);
    return group;
  };
}

function uninstallSavedMessagesSdkFake(): void {
  if (sdkFakeUsers === 0 || --sdkFakeUsers > 0) return;

  const sdk = CometChat as unknown as Record<string, unknown>;
  sdk['MessagesRequestBuilder'] = realMessagesRequestBuilder;
  sdk['getUser'] = realGetUser;
  sdk['getGroup'] = realGetGroup;
}

/**
 * Feeds one story's saved messages to the panel.
 *
 * The fake SDK has to be in place before the panel initialises — it fetches from
 * ngOnInit — and a parent's ngOnInit runs before its children exist, so this is
 * the last safe moment to install it.
 */
@Component({
  selector: 'cometchat-saved-messages-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatSavedMessagesComponent],
  template: `
    <cometchat-saved-messages
      [messagesRequestBuilder]="scenarioBuilder"
      [hideUnsaveMessageOption]="hideUnsaveMessageOption"
      [hideCloseButton]="hideCloseButton">
    </cometchat-saved-messages>
  `,
  // A custom element is inline by default, which would leave the panel's
  // height: 100% resolving against an auto-height parent and collapsing it —
  // the empty state would then sit under the header instead of centred.
  styles: [':host { display: flex; min-height: 0; height: 100%; }'],
})
class CometChatSavedMessagesStoryWrapperComponent implements OnInit, OnDestroy {
  /** The saved messages the first page returns. */
  @Input() messages: CometChat.BaseMessage[] = [];
  @Input() simulateLoading = false;
  @Input() simulateError = false;
  @Input() hideUnsaveMessageOption = false;
  @Input() hideCloseButton = false;

  scenarioBuilder?: CometChat.MessagesRequestBuilder;

  /** This story's handle on the fake — see scenariosByPageSize. */
  private readonly pageSize = nextScenarioPageSize++;

  ngOnInit(): void {
    useStoryLoggedInUser();
    installSavedMessagesSdkFake();
    scenariosByPageSize.set(this.pageSize, {
      pages: [this.messages],
      hang: this.simulateLoading,
      fail: this.simulateError,
    });
    this.scenarioBuilder = new StorySavedMessagesRequestBuilder().setLimit(
      this.pageSize
    ) as unknown as CometChat.MessagesRequestBuilder;
  }

  ngOnDestroy(): void {
    scenariosByPageSize.delete(this.pageSize);
    uninstallSavedMessagesSdkFake();
    releaseStoryLoggedInUser();
  }
}

/**
 * Stands in for the root PinSaveService.
 *
 * The panel only ever asks it to run an unsave, but the real one registers SDK
 * listeners and drives toasts the moment it is constructed, which a story has no
 * session for.
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
    isPinConversationEnabled: async () => false,
    getConfiguredLimit: async () => null,
  };
}

/**
 * A focus trap that does nothing.
 *
 * The real one pulls focus into the panel as it mounts; on a docs page holding
 * several panels they would fight each other for it and scroll the page.
 */
function createNoopFocusTrapService(): any {
  return {
    activate: () => {},
    deactivate: () => {},
    isActive: () => false,
    hasActiveTraps: () => false,
  };
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatSavedMessagesComponent> = {
  title: 'Components/Messages/CometChat Saved Messages',
  component: CometChatSavedMessagesComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatSavedMessagesStoryWrapperComponent],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  argTypes: {
    // Data Configuration
    messagesRequestBuilder: {
      control: false,
      description:
        'Custom request builder. Only its page size is read — the panel always builds its own request, because a builder is single-shot and saves span every conversation',
      table: {
        type: { summary: 'CometChat.MessagesRequestBuilder' },
        category: 'Data Configuration',
      },
    },
    textFormatters: {
      control: false,
      description:
        'Text formatters for row text. Declared for parity with the pinned panel; rows render plain preview text, so nothing consumes it yet',
      table: {
        type: { summary: 'CometChatTextFormatter[]' },
        category: 'Data Configuration',
      },
    },

    // Display Controls
    hideUnsaveMessageOption: {
      control: 'boolean',
      description: 'Hide the per-row unsave button, making the list read-only',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
      },
    },
    hideCloseButton: {
      control: 'boolean',
      description: 'Hide the header close button, for hosts that supply their own chrome',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Controls',
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
      description: 'Custom template for the loading state',
      table: {
        type: { summary: 'TemplateRef<unknown>' },
        category: 'Custom Views',
      },
    },
    itemView: {
      control: false,
      description:
        'Custom template replacing a whole row, its click and keyboard handling included. The message arrives as $implicit and again as message',
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
      description: 'Emitted by the close button, or by Escape with no dialog on top',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    messageClick: {
      action: 'messageClick',
      description:
        'Emitted when a row is activated by click, Enter or Space — the host opens that conversation and jumps to the message',
      table: {
        type: { summary: 'EventEmitter<CometChat.BaseMessage>' },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description:
        'Emitted when the initial fetch fails. A failed scroll page does not emit; it only stops paging',
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
          'CometChatSavedMessages lists the logged-in user\'s saved messages across every conversation, newest message first, as conversation-style rows that carry the source avatar and name, the speaker on group rows, a media-aware preview, a thread marker on replies, and an inline unsave action that asks for confirmation before it removes a row.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatSavedMessagesComponent>;

// ============================================
// Stories
// ============================================

/** Default saved list — four conversations, both directions, mixed types. */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: createSavedMessages(),
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Six saves from four conversations, newest message first — an order the panel imposes itself, because the server does not return one. Group rows name the speaker ("You:" for your own), 1-1 rows do not, and the unsave button appears on whichever row the pointer is over.',
      },
    },
  },
};

/** A single saved message — the smallest list the panel can show. */
export const SingleItem: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: createSingleSavedMessage(),
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'One saved message from a 1-1 conversation. Worth checking on its own because a list of one is how most people first meet this panel, and the row has to hold the top of the list rather than lean on its neighbours.',
      },
    },
  },
};

/** Saved attachments — a caption wins over the type label, an icon leads each preview. */
export const SavedMediaMessages: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: createSavedMediaMessages(),
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'An image with a caption, an image without one, a video, an audio message and a file. Rows are previews rather than bubbles, so an attachment has to read as itself here: the caption is shown when there is one, the type name when there is not, and a glyph leads the line either way.',
      },
    },
  },
};

/** Long message text, in a 1-1 row and behind a long group name. */
export const LongMessageText: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: createLongTextMessages(),
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A long message in a 1-1 row, and the same text in a group whose name is also too long for the row. The panel is a narrow drawer, so both the title and the preview have to clip to one line each and the unsave button has to keep its place at the end of the row.',
      },
    },
  },
};

/** Read-only list — the unsave action is hidden. */
export const ReadOnlyList: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: true,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: createSavedMessages(),
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The same list with hideUnsaveMessageOption set, so no row renders an unsave button. This is the only option flag the panel has — rows are list items with one inline action, not bubbles with a menu — and it is how a host offers the list purely for reference.',
      },
    },
  },
};

/** Empty state shown when nothing has been saved. */
/** A long saved list — the case the pinned panel cannot have. */
export const ManySaves: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: Array.from({ length: 20 }, (_, i) =>
        i % 3 === 0
          ? savedDirectMessage(nancyGrace, {
              text: `Saved note ${i + 1} — something worth coming back to.`,
              minutesAgo: 15 * (i + 1),
            })
          : savedGroupMessage(i % 3 === 1 ? designTeam : supportEscalations, georgeAlan, {
              text: `Saved note ${i + 1} — something worth coming back to.`,
              minutesAgo: 15 * (i + 1),
            })
      ),
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Twenty saves, drawn from a 1-1 and two different groups. Length matters more here than on the pinned panel: a save is per-user and spans every conversation, so this list grows without a small per-conversation cap to hold it back, and it pages on a real cursor keyed on `sentAt` rather than arriving whole. Twenty sits under the panel\'s page size of 30, so this is one page — enough to show that rows from unrelated conversations stay readable in a run, each carrying its own conversation as context.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: [],
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The fetch succeeded and returned nothing, so the panel shows its illustration and an explanation of what saving is for. This is the first thing most people see, and it is also where the list lands again after the last row is unsaved — without a refetch.',
      },
    },
  },
};

/** Loading state while the first page is being fetched. */
export const LoadingState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      simulateLoading: true,
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [simulateLoading]="simulateLoading"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The fetch never resolves, so the shimmer stays on screen. The skeleton is row-shaped — avatar, title line, subtitle line — deliberately unlike the pinned panel\'s transcript-shaped one, so the wait already tells you which panel you opened.',
      },
    },
  },
};

/** Error state with a retry that fails again. */
export const ErrorState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div class="cometchat-saved-messages-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [simulateError]="simulateError"
          [hideUnsaveMessageOption]="hideUnsaveMessageOption"
          [hideCloseButton]="hideCloseButton">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The first fetch fails, so the panel reports it and offers Retry; the retry here fails again after a short wait. This is the only recoverable state the panel has, and it is also the only one that emits the error output.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Every state of the saved list side by side — loaded, empty, loading, error. */
export const AllVariantsShowcase: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  render: () => ({
    props: {
      showcaseMessages: createSavedMessages(),
    },
    template: `
      <div class="cometchat-saved-messages-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-6); align-items: center; padding: var(--cometchat-padding-4);">
        <h3 class="cometchat-saved-messages-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Saved Messages States
        </h3>

        <div class="cometchat-saved-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-saved-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Saved messages
          </p>
          <div class="cometchat-saved-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-saved-messages-story-wrapper [messages]="showcaseMessages">
            </cometchat-saved-messages-story-wrapper>
          </div>
        </div>

        <div class="cometchat-saved-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-saved-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty
          </p>
          <div class="cometchat-saved-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-saved-messages-story-wrapper>
            </cometchat-saved-messages-story-wrapper>
          </div>
        </div>

        <div class="cometchat-saved-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-saved-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading
          </p>
          <div class="cometchat-saved-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-saved-messages-story-wrapper [simulateLoading]="true">
            </cometchat-saved-messages-story-wrapper>
          </div>
        </div>

        <div class="cometchat-saved-messages-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2); align-items: center;">
          <p class="cometchat-saved-messages-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error
          </p>
          <div class="cometchat-saved-messages-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-saved-messages-story-wrapper [simulateError]="true">
            </cometchat-saved-messages-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The loaded list, the empty state, the shimmer and the error state in a single view, so the four can be compared at the width the drawer actually has. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

/** Verifies the populated list renders a row per saved message with its source name. */
export const TestListRendersRows: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: createSavedMessages(),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="false"
          [hideCloseButton]="false">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));

    const title = canvasElement.querySelector('.cometchat-saved-messages__title, [class*="saved-messages"] h2');
    expect(title).not.toBeNull();
    expect(title!.textContent!.trim()).toContain('Saved Messages');

    const rows = canvasElement.querySelectorAll('.cometchat-saved-messages__row');
    expect(rows.length).toBeGreaterThan(0);

    // Newest first, so the top row is the most recent save — and its title is the
    // resolved conversation name, not the raw uid it starts out as.
    expect(rows[0].textContent!).toContain('Nancy Grace');
  },
};

/** Verifies an empty result renders the empty state and no rows. */
export const TestEmptyStateRendersIllustration: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: PinSaveService, useFactory: () => createMockPinSaveService() },
        { provide: FocusTrapService, useFactory: () => createNoopFocusTrapService() },
      ],
    }),
  ],
  args: {
    hideUnsaveMessageOption: false,
    hideCloseButton: false,
  },
  render: args => ({
    props: {
      ...args,
      messages: [],
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-saved-messages-story-wrapper
          [messages]="messages"
          [hideUnsaveMessageOption]="false"
          [hideCloseButton]="false">
        </cometchat-saved-messages-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));

    const empty = canvasElement.querySelector('.cometchat-saved-messages__state--empty, [class*="saved-messages"] [class*="empty"]');
    expect(empty).not.toBeNull();

    const rows = canvasElement.querySelectorAll('.cometchat-saved-messages__row');
    expect(rows.length).toBe(0);
  },
};
