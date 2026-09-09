/**
 * CometChatThreadHeader Storybook Stories
 *
 * Interactive stories demonstrating the thread header component:
 * - Default thread header with text parent message
 * - Image parent message
 * - Single reply (singular form)
 * - Zero replies
 * - Follow control, not following and following
 * - Optimistic toggle while the write is still on the wire
 * - Follow control in a 1:1 thread and in a group thread
 * - Follow control hidden: feature off, SDK too old, thread gone, surface opted out
 * - All subscription states showcase
 *
 * All variants render centered in both docs preview and fullscreen story pages.
 *
 * @module components/cometchat-thread-header
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatThreadHeaderComponent } from './cometchat-thread-header.component';
import { ThreadSubscriptionService } from '../../services/thread-subscription.service';
import { COMETCHAT_GLOBAL_CONFIG } from '../../services/global-config.service';
import { CometChatThreadEvents } from '../../events/CometChatThreadEvents';
import { createMockMessage, createMockUser } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ============================================
// Full-screen centered wrapper style
// ============================================

const fullScreenCenterStyle = `
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 80px;
  box-sizing: border-box;
  padding: 16px;
`;

const cardStyle = `
  width: 500px;
  border: 1px solid var(--cometchat-border-color-light, #eee);
  border-radius: var(--cometchat-radius-2, 8px);
  overflow: hidden;
`;

// ============================================
// Shared render helper
// ============================================

const threadRender = (args: Record<string, unknown>) => ({
  props: args,
  template: `
    <div style="${fullScreenCenterStyle}">
      <div style="${cardStyle}">
        <cometchat-thread-header
          [parentMessage]="parentMessage"
          [replyCount]="replyCount"
          (closeClick)="closeClick($event)"
          (backClick)="backClick($event)">
        </cometchat-thread-header>
      </div>
    </div>
  `,
});

/**
 * Same wrapper as {@link threadRender}, plus the follow control's own input and
 * output. Kept separate so the four original stories keep rendering exactly the
 * markup they were written against.
 */
const threadSubscriptionRender = (args: Record<string, unknown>) => ({
  props: args,
  template: `
    <div style="${fullScreenCenterStyle}">
      <div style="${cardStyle}">
        <cometchat-thread-header
          [parentMessage]="parentMessage"
          [replyCount]="replyCount"
          [hideThreadSubscriptionToggle]="hideThreadSubscriptionToggle"
          (closeClick)="closeClick($event)"
          (backClick)="backClick($event)"
          (threadSubscriptionChange)="threadSubscriptionChange($event)">
        </cometchat-thread-header>
      </div>
    </div>
  `,
});

// ============================================
// Mock Classes
// ============================================

/** Options for {@link createMockThreadSubscriptionService}. */
interface MockThreadSubscriptionOptions {
  /** false stands in for a Chat SDK that predates the thread-subscription API. */
  supported?: boolean;
  /** Thread ids the server has answered 403/404 for. */
  unavailableThreadIds?: number[];
  /**
   * When set, the pretended write fails after this many milliseconds and the
   * flip is published in reverse — the revert the real service performs.
   */
  revertAfterMs?: number;
}

/**
 * Stands in for ThreadSubscriptionService, whose real toggle() puts a request on
 * the wire and whose constructor subscribes to the logged-in user stream.
 *
 * Mirrors the real contract rather than a simplified one: state is read off the
 * message, and the optimistic flip reaches the header as a bus event instead of
 * as a return value the component stores. That is why a story can drive the
 * control by publishing on the bus alone.
 */
function createMockThreadSubscriptionService(options: MockThreadSubscriptionOptions = {}) {
  const { supported = true, unavailableThreadIds = [], revertAfterMs } = options;
  const gone = new Set(unavailableThreadIds);

  return {
    isSupported: () => supported,
    isUnavailable: (parentMessageId: number) => gone.has(Number(parentMessageId)),
    isFollowing: (message: CometChat.BaseMessage | null | undefined) =>
      !!(message && typeof message.isThreadSubscribed === 'function' && message.isThreadSubscribed()),
    mirrorSubscribed: () => {},
    applyIncomingReply: () => {},
    toggle: (message: CometChat.BaseMessage) => {
      const parentMessageId = message.getId();
      const subscribed = !message.isThreadSubscribed();
      CometChatThreadEvents.publishThreadSubscriptionChanged({ parentMessageId, subscribed });
      if (revertAfterMs !== undefined) {
        // The server was never written, so the control must not keep claiming
        // otherwise — publishing the reverse is how the real service backs out.
        setTimeout(() => {
          CometChatThreadEvents.publishThreadSubscriptionChanged({
            parentMessageId,
            subscribed: !subscribed,
          });
        }, revertAfterMs);
      }
      return subscribed;
    },
  };
}

/** Options for {@link createThreadParent}. */
interface ThreadParentOptions {
  id: number;
  text?: string;
  sender?: CometChat.User;
  receiverType?: string;
  sentAt?: number;
  /** Whether the viewer follows this thread. */
  subscribed?: boolean;
}

/**
 * A parent message carrying a subscription flag.
 *
 * The shared mock factory has no override for it, and the flag is what the
 * control reads on every change-detection pass — so it is stamped here with the
 * SDK setter, which is local only and never touches a server.
 *
 * Give every story its own id: the thread event bus is a process-wide subject,
 * so two headers sharing an id would flip together on one docs page.
 */
function createThreadParent(options: ThreadParentOptions): CometChat.BaseMessage {
  const message = createMockMessage('text', {
    id: options.id,
    text: options.text ?? 'This is the parent message that started the thread.',
    sender: options.sender ?? createMockUser({ uid: 'user-1', name: 'Alice' }),
    receiverType: options.receiverType ?? CometChat.RECEIVER_TYPE.GROUP,
    sentAt: options.sentAt ?? Date.now() / 1000 - 7200,
  });
  message.setThreadSubscribed(!!options.subscribed);
  return message;
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatThreadHeaderComponent> = {
  title: 'Components/Messages/Thread Header',
  component: CometChatThreadHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    parentMessage: createMockMessage('text', {
      id: 400,
      text: 'This is the parent message that started the thread.',
      sentAt: Date.now() / 1000 - 7200,
      sender: createMockUser({ uid: 'user-1', name: 'Alice' }),
    }),
    replyCount: 3,
    hideThreadSubscriptionToggle: false,
  },
  argTypes: {
    parentMessage: {
      control: false,
      description:
        'The parent message of the thread. Determines the message preview text and media icon displayed in the header.',
      table: { type: { summary: 'CometChat.BaseMessage' } },
    },
    replyCount: {
      control: 'number',
      description:
        'The initial number of replies in the thread. Updates in real-time as new replies arrive.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    hideThreadSubscriptionToggle: {
      control: 'boolean',
      description:
        'Hide the follow/unfollow control without turning the feature off, for apps that want the action-sheet entry point only.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    trailingView: {
      control: false,
      description:
        'Template rendered in place of the follow/unfollow control. The close button beside it still renders.',
      table: { type: { summary: 'TemplateRef<unknown>' } },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close button is clicked or Escape is pressed',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
    backClick: {
      action: 'backClick',
      description: 'Deprecated — use closeClick instead. Kept for backward compatibility.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
    threadSubscriptionChange: {
      action: 'threadSubscriptionChange',
      description:
        'Emitted on every change to this thread\'s subscription, whoever caused it — this control, the message action sheet, or the server.',
      table: { type: { summary: 'EventEmitter<IThreadSubscriptionChange>' }, category: 'Events' },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatThreadHeader displays the header for threaded message views, including a truncated parent message preview, reply count with real-time updates, sender name, media type icon for non-text messages, an optional follow/unfollow control for the thread, and a close button to return to the main chat.',
      },
    },
  },
  render: threadRender,
};

export default meta;
type Story = StoryObj<CometChatThreadHeaderComponent>;

// ============================================
// Stories
// ============================================

/** Default thread header with a text parent message and reply count. */
export const Default: Story = {
  args: {
    parentMessage: createMockMessage('text', {
      id: 401,
      text: 'This is the parent message that started the thread discussion.',
      sentAt: Date.now() / 1000 - 7200,
      sender: createMockUser({ uid: 'user-1', name: 'Alice' }),
    }),
    replyCount: 5,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Default thread header showing a text parent message preview with 5 replies.',
      },
    },
  },
};

/** Thread header displaying an image parent message with a higher reply count. */
export const ImageParentMessage: Story = {
  args: {
    parentMessage: createMockMessage('image', {
      id: 402,
      sentAt: Date.now() / 1000 - 3600,
      sender: createMockUser({ uid: 'user-2', name: 'Bob' }),
    }),
    replyCount: 12,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Thread header for a media (image) parent message with 12 replies. Shows a localized media description and media type icon.',
      },
    },
  },
};

/** Thread header with a single reply (singular form). */
export const SingleReply: Story = {
  args: {
    parentMessage: createMockMessage('text', {
      id: 403,
      text: 'Quick question about the API changes.',
      sentAt: Date.now() / 1000 - 1800,
      sender: createMockUser({ uid: 'user-3', name: 'Charlie' }),
    }),
    replyCount: 1,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Thread header with a single reply, showing the singular form of the reply count label.',
      },
    },
  },
};

/** Thread header with zero replies. */
export const ZeroReplies: Story = {
  args: {
    parentMessage: createMockMessage('text', {
      id: 404,
      text: 'Has anyone looked into this issue yet?',
      sentAt: Date.now() / 1000 - 600,
      sender: createMockUser({ uid: 'user-4', name: 'Diana' }),
    }),
    replyCount: 0,
  },
  render: threadRender,
  parameters: {
    docs: {
      description: {
        story: 'Thread header with zero replies, showing the initial state before any thread responses.',
      },
    },
  },
};

// ============================================
// Stories — Thread Subscription
// ============================================

/** Follow control on a thread the viewer does not follow. */
export const SubscriptionNotFollowing: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 410,
      text: 'Shipping the new onboarding flow on Thursday.',
      subscribed: false,
    }),
    replyCount: 4,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'The follow control in its resting state, left of the close button. The bell carries a cut line, aria-pressed is false, and the tooltip reads "Subscribe to thread" — the label names the action the click performs, not the state you are in.',
      },
    },
  },
};

/** Follow control on a thread the viewer follows. */
export const SubscriptionFollowing: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 411,
      text: 'Shipping the new onboarding flow on Thursday.',
      subscribed: true,
    }),
    replyCount: 4,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'The same control on a followed thread: the cut line is gone, aria-pressed is true and the tooltip reads "Unsubscribe from thread". Both states share one icon colour on purpose, so the slash and the label carry the state rather than a tint.',
      },
    },
  },
};

/** Toggle that flips immediately while the write is still on the wire. */
export const SubscriptionPendingToggle: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 412,
      text: 'Anyone reviewing the migration plan today?',
      subscribed: false,
    }),
    replyCount: 7,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'Click the bell: it flips at once, because the toggle is optimistic and this story\'s write never comes back. There is deliberately no spinner and no disabled state — an in-flight toggle is pixel-identical to a settled one, and a second click inside 400 ms is swallowed whole rather than queued.',
      },
    },
  },
};

/** Toggle that flips back after the write fails. */
export const SubscriptionRevertOnFailure: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ThreadSubscriptionService,
          useValue: createMockThreadSubscriptionService({ revertAfterMs: 1200 }),
        },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 413,
      text: 'Anyone reviewing the migration plan today?',
      subscribed: false,
    }),
    replyCount: 7,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'Click the bell and it flips, then flips back about a second later — the write failed and the control must not claim a state the server never took. In the running kit an error toast reads "Couldn\'t update. Please try again." and the throttle is cleared so a deliberate retry goes through at once.',
      },
    },
  },
};

/** Follow control in a 1:1 thread. */
export const SubscriptionInDirectMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 414,
      text: 'Sending over the contract draft tonight.',
      receiverType: CometChat.RECEIVER_TYPE.USER,
      sender: createMockUser({ uid: 'user-5', name: 'Erin' }),
      subscribed: true,
    }),
    replyCount: 2,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'The control on a thread inside a 1:1 conversation. It looks and behaves exactly as it does in a group, which is the point of the story: a subscription decides whether replies reach you, and unsubscribing genuinely silences them in a 1:1 too, so receiverType gates nothing here.',
      },
    },
  },
};

/** Follow control in a group thread. */
export const SubscriptionInGroup: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 415,
      text: 'Standup notes for the platform team are in the doc.',
      receiverType: CometChat.RECEIVER_TYPE.GROUP,
      sender: createMockUser({ uid: 'user-6', name: 'Frank' }),
      subscribed: true,
    }),
    replyCount: 18,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'The same followed control on a group thread, side by side with the 1:1 story above. Compare the two: nothing about the control changes, only the surrounding conversation.',
      },
    },
  },
};

/** Control hidden because the integrator has not enabled the feature. */
export const SubscriptionHiddenWhenFeatureOff: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: {} },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 416,
      text: 'Shipping the new onboarding flow on Thursday.',
      subscribed: false,
    }),
    replyCount: 4,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'Global config without enableThreadSubscription, which is the default for every integrator and therefore the header most apps actually ship. Nothing renders where the bell would be and the close button keeps its place.',
      },
    },
  },
};

/** Control hidden on a Chat SDK without the thread-subscription API. */
export const SubscriptionHiddenOnUnsupportedSdk: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ThreadSubscriptionService,
          useValue: createMockThreadSubscriptionService({ supported: false }),
        },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 417,
      text: 'Shipping the new onboarding flow on Thursday.',
      subscribed: false,
    }),
    replyCount: 4,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'The feature is enabled but the linked Chat SDK predates subscribeToThread. Calling a method that is not there throws synchronously, so the control asks first and renders nothing rather than offering a button that breaks on click.',
      },
    },
  },
};

/** Control hidden after the server said the thread is gone. */
export const SubscriptionHiddenWhenThreadUnavailable: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ThreadSubscriptionService,
          useValue: createMockThreadSubscriptionService({ unavailableThreadIds: [418] }),
        },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 418,
      text: 'Budget thread for the archived project.',
      subscribed: false,
    }),
    replyCount: 9,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'The thread answered 403 or 404 once — the viewer lost access, or the parent message is gone. The control is removed rather than disabled, because a retry cannot help; the kit stops offering it instead of leaving a button that always fails.',
      },
    },
  },
};

/** Control hidden on this surface only, feature still on. */
export const SubscriptionToggleHidden: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 419,
      text: 'Shipping the new onboarding flow on Thursday.',
      subscribed: true,
    }),
    replyCount: 4,
    hideThreadSubscriptionToggle: true,
  },
  render: threadSubscriptionRender,
  parameters: {
    docs: {
      description: {
        story:
          'hideThreadSubscriptionToggle set while the feature stays enabled, for apps that want the action-sheet entry point only. This input hides one surface; the message option is a separate input on the message list and is untouched here.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

const showcaseNotFollowing = createThreadParent({
  id: 420,
  text: 'Shipping the new onboarding flow on Thursday.',
  subscribed: false,
});

const showcaseFollowing = createThreadParent({
  id: 421,
  text: 'Standup notes for the platform team are in the doc.',
  sender: createMockUser({ uid: 'user-6', name: 'Frank' }),
  subscribed: true,
});

const showcaseUnavailable = createThreadParent({
  id: 422,
  text: 'Budget thread for the archived project.',
  sender: createMockUser({ uid: 'user-7', name: 'Grace' }),
  subscribed: false,
});

const showcaseHiddenToggle = createThreadParent({
  id: 423,
  text: 'Sending over the contract draft tonight.',
  sender: createMockUser({ uid: 'user-5', name: 'Erin' }),
  subscribed: true,
});

/** Every subscription state the header can show, stacked in one view. */
export const AllSubscriptionStatesShowcase: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: ThreadSubscriptionService,
          useValue: createMockThreadSubscriptionService({ unavailableThreadIds: [422] }),
        },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  render: () => ({
    props: {
      notFollowing: showcaseNotFollowing,
      following: showcaseFollowing,
      unavailable: showcaseUnavailable,
      hiddenToggle: showcaseHiddenToggle,
    },
    template: `
      <div class="cometchat-thread-header-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5, 20px); padding: var(--cometchat-padding-4, 16px);">
        <h3 class="cometchat-thread-header-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-medium); color: var(--cometchat-text-color-primary);">
          Thread subscription states
        </h3>

        <div class="cometchat-thread-header-showcase__section">
          <p class="cometchat-thread-header-showcase__section-label" style="margin: 0 0 var(--cometchat-spacing-2, 8px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
            Not following — slashed bell, aria-pressed false
          </p>
          <div class="cometchat-thread-header-showcase__panel" style="${cardStyle}">
            <cometchat-thread-header [parentMessage]="notFollowing" [replyCount]="4"></cometchat-thread-header>
          </div>
        </div>

        <div class="cometchat-thread-header-showcase__section">
          <p class="cometchat-thread-header-showcase__section-label" style="margin: 0 0 var(--cometchat-spacing-2, 8px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
            Following — plain bell, aria-pressed true
          </p>
          <div class="cometchat-thread-header-showcase__panel" style="${cardStyle}">
            <cometchat-thread-header [parentMessage]="following" [replyCount]="18"></cometchat-thread-header>
          </div>
        </div>

        <div class="cometchat-thread-header-showcase__section">
          <p class="cometchat-thread-header-showcase__section-label" style="margin: 0 0 var(--cometchat-spacing-2, 8px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
            Thread gone — control removed, not disabled
          </p>
          <div class="cometchat-thread-header-showcase__panel" style="${cardStyle}">
            <cometchat-thread-header [parentMessage]="unavailable" [replyCount]="9"></cometchat-thread-header>
          </div>
        </div>

        <div class="cometchat-thread-header-showcase__section">
          <p class="cometchat-thread-header-showcase__section-label" style="margin: 0 0 var(--cometchat-spacing-2, 8px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
            Surface opted out — feature still on
          </p>
          <div class="cometchat-thread-header-showcase__panel" style="${cardStyle}">
            <cometchat-thread-header
              [parentMessage]="hiddenToggle"
              [replyCount]="2"
              [hideThreadSubscriptionToggle]="true">
            </cometchat-thread-header>
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The four states a reviewer needs to compare — following, not following, and the two ways the control disappears — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders thread header container */
export const TestDefaultRendersThreadHeader: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-thread-header');
    expect(container).not.toBeNull();
  },
};

/** Verifies the follow control reports the followed state to assistive tech. */
export const TestSubscriptionControlPressedState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 430,
      text: 'Followed thread used by the pressed-state test.',
      subscribed: true,
    }),
    replyCount: 6,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const button = canvasElement.querySelector(
      '.cometchat-thread-header__subscription-button, [class*="thread-header"] [class*="subscription-button"]'
    ) as HTMLElement;
    expect(button).not.toBeNull();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    // The tooltip and the accessible name must stay one string, so a voice
    // user can say what the tooltip showed them.
    expect(button.getAttribute('title')).toBe(button.getAttribute('aria-label'));
    expect(button.getAttribute('aria-label')!.length).toBeGreaterThan(0);
  },
};

/** Verifies clicking the control flips the pressed state. */
export const TestSubscriptionToggleFlipsPressedState: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: { enableThreadSubscription: true } },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 431,
      text: 'Thread used by the toggle test.',
      subscribed: false,
    }),
    replyCount: 3,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const button = canvasElement.querySelector(
      '.cometchat-thread-header__subscription-button, [class*="thread-header"] [class*="subscription-button"]'
    ) as HTMLElement;
    expect(button).not.toBeNull();

    // Asserted as a flip rather than an absolute value: the flag lives on the
    // message object, so a re-run of this play() starts from where the last
    // click left it.
    const before = button.getAttribute('aria-pressed');
    button.click();
    await new Promise(r => setTimeout(r, 500));

    expect(button.getAttribute('aria-pressed')).toBe(before === 'true' ? 'false' : 'true');
  },
};

/** Verifies the control is absent when the feature has not been enabled. */
export const TestSubscriptionControlHiddenWhenFeatureOff: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        { provide: ThreadSubscriptionService, useValue: createMockThreadSubscriptionService() },
        { provide: COMETCHAT_GLOBAL_CONFIG, useValue: {} },
      ],
    }),
  ],
  args: {
    parentMessage: createThreadParent({
      id: 432,
      text: 'Thread used by the feature-gate test.',
      subscribed: false,
    }),
    replyCount: 2,
    hideThreadSubscriptionToggle: false,
  },
  render: threadSubscriptionRender,
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const button = canvasElement.querySelector('.cometchat-thread-header__subscription-button');
    expect(button).toBeNull();
    // Only the follow control is gated — the close button still renders.
    const close = canvasElement.querySelector('.cometchat-thread-header__close-button');
    expect(close).not.toBeNull();
  },
};
