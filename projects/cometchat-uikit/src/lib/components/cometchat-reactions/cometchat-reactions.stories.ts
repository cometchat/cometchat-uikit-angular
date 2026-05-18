/**
 * CometChatReactions Storybook Stories
 *
 * Interactive stories demonstrating the reactions component variants:
 * - Default reactions display with multiple emoji pills
 * - Message with many reactions showing overflow behavior
 * - Empty reactions (no reactions on message)
 * - All variants showcase
 *
 * @module components/cometchat-reactions
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatReactionsComponent } from './cometchat-reactions.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { within, expect } from '@storybook/test';
import {
  createMockMessage,
  createMockReactions,
  createMockReaction,
} from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Helpers
// ============================================

/**
 * Creates a mock text message with the specified number of reactions attached.
 */
function createMessageWithReactions(reactionCount: number): any {
  const message = createMockMessage('text', {
    id: 100 + reactionCount,
    text: 'Hello, this message has reactions!',
  });
  if (reactionCount > 0) {
    const reactions = createMockReactions(reactionCount);
    message.setReactions(reactions);
  }
  return message;
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatReactionsComponent> = {
  title: 'Components/Misc/Reactions',
  component: CometChatReactionsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    message: createMessageWithReactions(3),
    alignment: MessageBubbleAlignment.left,
    hoverDebounceTime: 500,
  },
  argTypes: {
    message: {
      control: false,
      description: 'The CometChat message object containing reactions to display as emoji pills',
      table: {
        type: { summary: 'CometChat.BaseMessage' },
        category: 'Inputs',
      },
    },
    alignment: {
      control: 'select',
      options: [MessageBubbleAlignment.left, MessageBubbleAlignment.right],
      description:
        'Message bubble alignment — left for incoming, right for outgoing. Determines popover placement for the overflow list',
      table: {
        type: { summary: 'MessageBubbleAlignment' },
        defaultValue: { summary: 'MessageBubbleAlignment.left' },
        category: 'Inputs',
      },
    },
    reactionsRequestBuilder: {
      control: false,
      description: 'Optional custom reactions request builder for fetching reaction details',
      table: {
        type: { summary: 'CometChat.ReactionsRequestBuilder' },
        category: 'Inputs',
      },
    },
    hoverDebounceTime: {
      control: 'number',
      description: 'Debounce time in milliseconds for hover tooltips on reaction pills',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '500' },
        category: 'Inputs',
      },
    },
    reactionClick: {
      action: 'reactionClick',
      description: 'Emitted when a reaction pill is clicked',
      table: {
        type: { summary: 'EventEmitter<{ reaction: ReactionCount; message: BaseMessage }>' },
        category: 'Events',
      },
    },
    reactionListItemClick: {
      action: 'reactionListItemClick',
      description: 'Emitted when a reaction list item is clicked from the overflow popover',
      table: {
        type: { summary: 'EventEmitter<{ reaction: Reaction; message: BaseMessage }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatReactions renders emoji reaction pills on a message bubble footer. It dynamically calculates how many pills to show based on container width and provides overflow handling via a "+N" button with a popover list. Supports left/right alignment and hover tooltips with reaction info.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatReactionsComponent>;

// ============================================
// Stories
// ============================================

/** Default reactions display with three emoji pills on a received message. */
export const Default: Story = {
  args: {
    message: createMessageWithReactions(3),
    alignment: MessageBubbleAlignment.left,
    hoverDebounceTime: 500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default reactions display with three emoji pills (👍, ❤️, 😂) on a received message. This is the most common usage.',
      },
    },
  },
};

/** Message with many reactions demonstrating overflow behavior. */
export const MessageWithReactions: Story = {
  args: {
    message: createMessageWithReactions(8),
    alignment: MessageBubbleAlignment.left,
    hoverDebounceTime: 500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Eight different emoji reactions on a message. Demonstrates overflow handling with the "+N" button when pills exceed available container width.',
      },
    },
  },
};

/** Empty reactions — message with no reactions attached. */
export const EmptyReactions: Story = {
  args: {
    message: createMessageWithReactions(0),
    alignment: MessageBubbleAlignment.left,
    hoverDebounceTime: 500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: a message with no reactions. The component renders nothing when the message has an empty reactions array.',
      },
    },
  },
};

/** No reactions — alias for EmptyReactions. */
export const NoReactions: Story = {
  args: {
    message: createMessageWithReactions(0),
    alignment: MessageBubbleAlignment.left,
    hoverDebounceTime: 500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Message with no reactions. The reactions component renders nothing when there are no reactions on the message.',
      },
    },
  },
};

/** Single reaction reacted by the logged-in user — shows highlighted pill. */
export const ReactedByMe: Story = {
  args: {
    message: (() => {
      const msg = createMockMessage('text', { id: 202, text: 'Message I reacted to' });
      msg.setReactions([
        createMockReaction({ reaction: '👍', count: 3, reactedByMe: true }),
        createMockReaction({ reaction: '❤️', count: 1, reactedByMe: false }),
      ]);
      return msg;
    })(),
    alignment: MessageBubbleAlignment.right,
    hoverDebounceTime: 500,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Reactions where the logged-in user has reacted. The 👍 pill is highlighted with a different background to indicate the user\'s own reaction.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all reaction variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-reactions-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-reactions-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Reactions Variants
        </h3>

        <!-- Few Reactions -->
        <div class="cometchat-reactions-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reactions-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Few Reactions (3 emojis)
          </p>
          <cometchat-reactions [message]="fewReactions" [alignment]="leftAlignment"></cometchat-reactions>
        </div>

        <!-- Many Reactions (Overflow) -->
        <div class="cometchat-reactions-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reactions-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Many Reactions (8 emojis — overflow)
          </p>
          <cometchat-reactions [message]="manyReactions" [alignment]="leftAlignment"></cometchat-reactions>
        </div>

        <!-- Single Reaction (Reacted by Me) -->
        <div class="cometchat-reactions-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reactions-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Single Reaction (reacted by me)
          </p>
          <cometchat-reactions [message]="singleReaction" [alignment]="rightAlignment"></cometchat-reactions>
        </div>

        <!-- Empty Reactions -->
        <div class="cometchat-reactions-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reactions-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty Reactions (no reactions)
          </p>
          <cometchat-reactions [message]="emptyReactions" [alignment]="leftAlignment"></cometchat-reactions>
        </div>

        <!-- Right Alignment -->
        <div class="cometchat-reactions-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reactions-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Right Alignment (sent message)
          </p>
          <div style="display: flex; justify-content: flex-end;">
            <cometchat-reactions [message]="rightAlignedReactions" [alignment]="rightAlignment"></cometchat-reactions>
          </div>
        </div>

      </div>
    `,
    props: {
      fewReactions: createMessageWithReactions(3),
      manyReactions: createMessageWithReactions(8),
      singleReaction: (() => {
        const msg = createMockMessage('text', { id: 201, text: 'Single reaction message' });
        msg.setReactions([createMockReaction({ reaction: '👍', count: 5, reactedByMe: true })]);
        return msg;
      })(),
      emptyReactions: createMessageWithReactions(0),
      rightAlignedReactions: createMessageWithReactions(4),
      leftAlignment: MessageBubbleAlignment.left,
      rightAlignment: MessageBubbleAlignment.right,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all reaction variants — few reactions, many reactions with overflow, single reaction reacted by me, empty reactions, and right alignment — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders reactions container */
export const TestDefaultRendersReactions: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-reactions');
    expect(container).not.toBeNull();
  },
};
