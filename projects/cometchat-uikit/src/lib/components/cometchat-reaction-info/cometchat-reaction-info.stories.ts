/**
 * CometChatReactionInfo Storybook Stories
 *
 * Uses a wrapper component to bypass SDK fetch and set internal
 * signal state directly, allowing stories to render without live API calls.
 *
 * @module components/cometchat-reaction-info
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  AfterViewInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CometChatReactionInfoComponent } from './cometchat-reaction-info.component';
import {
  createMockMessage,
  createMockReaction,
} from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Helpers
// ============================================

function createMessageWithReactions(
  reactions: { reaction: string; count: number; reactedByMe?: boolean }[],
  messageId = 400
): any {
  const message = createMockMessage('text', {
    id: messageId,
    text: 'Message with reactions',
  });
  if (reactions.length > 0) {
    message.setReactions(
      reactions.map(r =>
        createMockReaction({
          reaction: r.reaction,
          count: r.count,
          reactedByMe: r.reactedByMe ?? false,
        })
      )
    );
  }
  return message;
}

// ============================================
// Wrapper Component
// ============================================

/**
 * Wrapper component that sets internal signals on the child
 * CometChatReactionInfoComponent after render, bypassing the
 * SDK fetch triggered by ngOnInit.
 */
@Component({
  selector: 'storybook-reaction-info-wrapper',
  standalone: true,
  imports: [CometChatReactionInfoComponent],
  template: `
    <cometchat-reaction-info
      [message]="mockMessage"
      [reaction]="mockEmoji">
    </cometchat-reaction-info>
  `,
})
class ReactionInfoWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild(CometChatReactionInfoComponent)
  reactionInfo!: CometChatReactionInfoComponent;

  /** Names to display in the tooltip (e.g. ['You', 'Alice', 'Bob']). */
  @Input() mockNames: string[] = [];

  /** The emoji character to display. */
  @Input() mockEmoji = '👍';

  /** Total reaction count (used for "and X others" overflow). */
  @Input() mockTotal = 0;

  /** Component state: 'loading', 'loaded', or 'error'. */
  @Input() mockState: 'loading' | 'loaded' | 'error' = 'loaded';

  mockMessage = createMessageWithReactions(
    [{ reaction: '👍', count: 3, reactedByMe: true }],
    400
  );

  private initialized = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.applyState();
      this.initialized = true;
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.initialized) {
      this.applyState();
    }
  }

  private applyState(): void {
    this.reactionInfo.state.set(this.mockState);
    this.reactionInfo.reactionNames.set(this.mockNames);
    this.reactionInfo.totalReactions.set(
      this.mockTotal > 0 ? this.mockTotal : this.mockNames.length
    );
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Misc/Reaction Info',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, ReactionInfoWrapperComponent],
    }),
  ],
  tags: ['autodocs'],
  args: {
    names: ['You', 'Alice', 'Bob'],
    emoji: '👍',
    total: 3,
    state: 'loaded',
  },
  argTypes: {
    names: {
      control: 'object',
      description: 'Array of reactor names to display in the tooltip.',
      table: { type: { summary: 'string[]' }, category: 'Data' },
    },
    emoji: {
      control: 'text',
      description: 'The emoji character to display info for.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'👍'" }, category: 'Data' },
    },
    total: {
      control: 'number',
      description: 'Total reaction count (for "and X others" overflow text).',
      table: { type: { summary: 'number' }, category: 'Data' },
    },
    state: {
      control: 'select',
      options: ['loading', 'loaded', 'error'],
      description: 'Component state: loading, loaded, or error.',
      table: { type: { summary: "'loading' | 'loaded' | 'error'" }, defaultValue: { summary: "'loaded'" }, category: 'State' },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatReactionInfo displays a tooltip showing who reacted with a specific emoji. Shows "You" for the logged-in user placed first, and "and X others" when the count exceeds the fetch limit. Supports loading, loaded, and error states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default loaded state with three reactors including "You". */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-info-wrapper
        [mockNames]="names"
        [mockEmoji]="emoji"
        [mockTotal]="total"
        [mockState]="state">
      </storybook-reaction-info-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Default reaction info tooltip for the 👍 emoji. Shows "You, Alice, Bob" as reactor names.',
      },
    },
  },
};

/** Heart emoji with many reactors and "and X others" overflow. */
export const ManyReactors: Story = {
  args: {
    names: ['Diana', 'Eve', 'Frank'],
    emoji: '❤️',
    total: 7,
    state: 'loaded',
  },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-info-wrapper
        [mockNames]="names"
        [mockEmoji]="emoji"
        [mockTotal]="total"
        [mockState]="state">
      </storybook-reaction-info-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Reaction info for ❤️ with 7 total reactors but only 3 fetched, showing "and 4 others" overflow text.',
      },
    },
  },
};

/** Single reactor. */
export const SingleReactor: Story = {
  args: {
    names: ['Grace'],
    emoji: '😂',
    total: 1,
    state: 'loaded',
  },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-info-wrapper
        [mockNames]="names"
        [mockEmoji]="emoji"
        [mockTotal]="total"
        [mockState]="state">
      </storybook-reaction-info-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Reaction info with a single reactor name displayed.',
      },
    },
  },
};

/** Loading state while fetching reactor info. */
export const Loading: Story = {
  args: {
    names: [],
    emoji: '👍',
    total: 0,
    state: 'loading',
  },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-info-wrapper
        [mockNames]="names"
        [mockEmoji]="emoji"
        [mockTotal]="total"
        [mockState]="state">
      </storybook-reaction-info-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Loading state displayed while reactor details are being fetched from the SDK.',
      },
    },
  },
};

/** Error state when fetching fails. */
export const Error: Story = {
  args: {
    names: [],
    emoji: '👍',
    total: 0,
    state: 'error',
  },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-info-wrapper
        [mockNames]="names"
        [mockEmoji]="emoji"
        [mockTotal]="total"
        [mockState]="state">
      </storybook-reaction-info-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Error state shown when the SDK call to fetch reactor details fails.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all reaction info states in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-reaction-info-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-reaction-info-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Reaction Info Variants
        </h3>

        <!-- Loaded: Thumbs Up (reacted by me) -->
        <div class="cometchat-reaction-info-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-info-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded — Thumbs Up (reacted by me)
          </p>
          <storybook-reaction-info-wrapper
            [mockNames]="thumbsUpNames"
            [mockEmoji]="'👍'"
            [mockTotal]="3"
            [mockState]="'loaded'">
          </storybook-reaction-info-wrapper>
        </div>

        <!-- Loaded: Heart (many reactors, overflow) -->
        <div class="cometchat-reaction-info-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-info-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded — Heart (many reactors, overflow)
          </p>
          <storybook-reaction-info-wrapper
            [mockNames]="heartNames"
            [mockEmoji]="'❤️'"
            [mockTotal]="7"
            [mockState]="'loaded'">
          </storybook-reaction-info-wrapper>
        </div>

        <!-- Loaded: Single reactor -->
        <div class="cometchat-reaction-info-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-info-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded — Single reactor
          </p>
          <storybook-reaction-info-wrapper
            [mockNames]="singleName"
            [mockEmoji]="'😂'"
            [mockTotal]="1"
            [mockState]="'loaded'">
          </storybook-reaction-info-wrapper>
        </div>

        <!-- Loading State -->
        <div class="cometchat-reaction-info-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-info-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <storybook-reaction-info-wrapper
            [mockNames]="emptyNames"
            [mockEmoji]="'👍'"
            [mockTotal]="0"
            [mockState]="'loading'">
          </storybook-reaction-info-wrapper>
        </div>

        <!-- Error State -->
        <div class="cometchat-reaction-info-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-info-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <storybook-reaction-info-wrapper
            [mockNames]="emptyNames"
            [mockEmoji]="'👍'"
            [mockTotal]="0"
            [mockState]="'error'">
          </storybook-reaction-info-wrapper>
        </div>

      </div>
    `,
    props: {
      thumbsUpNames: ['You', 'Alice', 'Bob'],
      heartNames: ['Diana', 'Eve', 'Frank'],
      singleName: ['Grace'],
      emptyNames: [] as string[],
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase displaying all reaction info states — loaded with various reactor counts, loading, and error — in a single view.',
      },
    },
  },
};
