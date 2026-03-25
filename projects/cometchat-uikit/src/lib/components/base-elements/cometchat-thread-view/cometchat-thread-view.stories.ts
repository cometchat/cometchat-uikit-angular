/**
 * CometChatThreadView Storybook Stories
 *
 * Interactive stories demonstrating the thread view component variants:
 * - Default indicator mode with reply count
 * - Thread view display with unread replies and panel mode
 * - All variants showcase
 *
 * @module components/cometchat-thread-view
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatThreadViewComponent } from './cometchat-thread-view.component';
import { createMockMessage, createMockUser } from '../../../../../../../.storybook/utils/mock-data';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatThreadViewComponent> = {
  title: 'Components/Messages/Thread View',
  component: CometChatThreadViewComponent,
  tags: ['!dev', '!autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    mode: 'indicator',
    replyCount: 5,
    unreadReplyCount: 0,
    parentMessage: createMockMessage('text', {
      id: 500,
      text: 'This is the parent message that started the thread.',
      replyCount: 5,
      sentAt: Date.now() / 1000 - 7200,
      sender: createMockUser({ uid: 'user-1', name: 'Alice' }),
    }),
    announceOnOpen: false,
  },
  argTypes: {
    mode: {
      control: 'select',
      options: ['indicator', 'panel'],
      description:
        'The mode of the thread view — indicator shows reply count on messages, panel serves as an accessible container for thread content',
      table: {
        type: { summary: "'indicator' | 'panel'" },
        defaultValue: { summary: "'indicator'" },
      },
    },
    replyCount: {
      control: 'number',
      description:
        'The number of replies in the thread. The indicator only displays when replyCount > 0.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    unreadReplyCount: {
      control: 'number',
      description:
        'The number of unread replies. When > 0, an unread indicator dot is shown and the count text uses bold font.',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    parentMessage: {
      control: false,
      description:
        'The parent message for the thread. Emitted via threadClick when the indicator is activated.',
      table: {
        type: { summary: 'CometChat.BaseMessage' },
      },
    },
    announceOnOpen: {
      control: 'boolean',
      description: 'Whether to announce thread opened via live region on init (panel mode only)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    threadClick: {
      action: 'threadClick',
      description:
        'Emitted when the thread indicator is clicked or activated via keyboard (indicator mode)',
      table: {
        type: { summary: 'EventEmitter<CometChat.BaseMessage>' },
        category: 'Events',
      },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the thread should be closed, triggered by Escape key (panel mode)',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatThreadView displays thread reply indicators on messages and can serve as an accessible thread panel container. In indicator mode it shows a thread icon, reply count, and optional unread dot. In panel mode it provides a role="complementary" container with Escape-to-close and focus restoration.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatThreadViewComponent>;

// ============================================
// Stories
// ============================================

/** Default thread view indicator with reply count and a parent message. */
export const Default: Story = {
  args: {
    mode: 'indicator',
    replyCount: 5,
    unreadReplyCount: 0,
    parentMessage: createMockMessage('text', {
      id: 501,
      text: 'Has anyone reviewed the latest PR for the auth module?',
      replyCount: 5,
      sentAt: Date.now() / 1000 - 7200,
      sender: createMockUser({ uid: 'user-default', name: 'Alice' }),
    }),
    announceOnOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default thread view in indicator mode showing 5 replies with no unread messages. Click or press Enter/Space to emit threadClick with the parent message.',
      },
    },
  },
};

/** Thread view indicator with unread replies and panel mode demonstration. */
export const ThreadViewDisplay: Story = {
  args: {
    mode: 'indicator',
    replyCount: 12,
    unreadReplyCount: 4,
    parentMessage: createMockMessage('text', {
      id: 502,
      text: 'Team standup notes — please add your updates below.',
      replyCount: 12,
      sentAt: Date.now() / 1000 - 3600,
      sender: createMockUser({ uid: 'user-display', name: 'Bob' }),
    }),
    announceOnOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Thread view indicator with 12 replies and 4 unread. The unread state shows a bold reply count and an unread indicator dot to draw attention.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all thread view variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-thread-view-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-thread-view-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Thread View Variants
        </h3>

        <!-- Indicator: Read Replies -->
        <div class="cometchat-thread-view-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-thread-view-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Indicator — Read Replies
          </p>
          <cometchat-thread-view
            [mode]="'indicator'"
            [replyCount]="readReplyCount"
            [unreadReplyCount]="0"
            [parentMessage]="readMessage"
            [announceOnOpen]="false"
          ></cometchat-thread-view>
        </div>

        <!-- Indicator: Unread Replies -->
        <div class="cometchat-thread-view-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-thread-view-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Indicator — Unread Replies
          </p>
          <cometchat-thread-view
            [mode]="'indicator'"
            [replyCount]="unreadReplyCount"
            [unreadReplyCount]="unreadCount"
            [parentMessage]="unreadMessage"
            [announceOnOpen]="false"
          ></cometchat-thread-view>
        </div>

        <!-- Indicator: Single Reply -->
        <div class="cometchat-thread-view-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-thread-view-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Indicator — Single Reply (Singular Form)
          </p>
          <cometchat-thread-view
            [mode]="'indicator'"
            [replyCount]="1"
            [unreadReplyCount]="0"
            [parentMessage]="singleReplyMessage"
            [announceOnOpen]="false"
          ></cometchat-thread-view>
        </div>

        <!-- Panel Mode -->
        <div class="cometchat-thread-view-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-thread-view-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Panel Mode (Container)
          </p>
          <div style="height: var(--cometchat-spacing-8); border: var(--cometchat-border-width-default, 1px) solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-3); overflow: hidden;">
            <cometchat-thread-view
              [mode]="'panel'"
              [replyCount]="panelReplyCount"
              [parentMessage]="panelMessage"
              [announceOnOpen]="false"
            >
              <div style="padding: var(--cometchat-padding-4); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
                Thread content is projected here via ng-content.
              </div>
            </cometchat-thread-view>
          </div>
        </div>

      </div>
    `,
    props: {
      readReplyCount: 5,
      readMessage: createMockMessage('text', {
        id: 510,
        text: 'Has anyone reviewed the latest PR?',
        replyCount: 5,
        sentAt: Date.now() / 1000 - 7200,
        sender: createMockUser({ uid: 'user-read', name: 'Alice' }),
      }),
      unreadReplyCount: 8,
      unreadCount: 3,
      unreadMessage: createMockMessage('text', {
        id: 511,
        text: 'Team standup notes — please add your updates.',
        replyCount: 8,
        sentAt: Date.now() / 1000 - 3600,
        sender: createMockUser({ uid: 'user-unread', name: 'Bob' }),
      }),
      singleReplyMessage: createMockMessage('text', {
        id: 512,
        text: 'Quick question about the API changes.',
        replyCount: 1,
        sentAt: Date.now() / 1000 - 1800,
        sender: createMockUser({ uid: 'user-single', name: 'Charlie' }),
      }),
      panelReplyCount: 10,
      panelMessage: createMockMessage('text', {
        id: 513,
        text: 'Design review discussion thread.',
        replyCount: 10,
        sentAt: Date.now() / 1000 - 600,
        sender: createMockUser({ uid: 'user-panel', name: 'Diana' }),
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying thread view variants — read replies indicator, unread replies indicator with dot, single reply (singular form), and panel mode container — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
