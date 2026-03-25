/**
 * CometChatConversationStarter Storybook Stories
 *
 * Interactive stories demonstrating the conversation starter component variants:
 * - Default with pre-loaded starter suggestions
 * - Multiple starter suggestions as clickable chips
 * - All variants showcase
 *
 * Uses a wrapper component to bypass the SDK fetch and set internal
 * signal state directly, allowing stories to render without live AI calls.
 *
 * @module components/cometchat-conversation-starter
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from '@angular/core';

import { CometChatConversationStarterComponent } from './cometchat-conversation-starter.component';
import { MockAIService } from '../../../../../../../.storybook/utils/mock-services';

// ============================================
// Mock Classes
// ============================================

/**
 * Wrapper component that sets internal signals on the child
 * CometChatConversationStarterComponent after render, bypassing the
 * SDK fetch triggered by ngOnInit. Re-applies state on input changes.
 */
@Component({
  selector: 'storybook-conversation-starter-wrapper',
  standalone: true,
  imports: [CometChatConversationStarterComponent],
  template: `
    <cometchat-conversation-starter
      (starterClick)="onStarterClick($event)"
    ></cometchat-conversation-starter>
  `,
})
class ConversationStarterWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild(CometChatConversationStarterComponent)
  starter!: CometChatConversationStarterComponent;

  /** Mock starter suggestions to display. */
  @Input() mockStarters: string[] = [];

  /** Whether to show the loading state. */
  @Input() mockLoading = false;

  /** Whether to show the error state. */
  @Input() mockError = false;

  /** Re-emits the child starterClick event. */
  @Output() starterClick = new EventEmitter<string>();

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
    this.starter.starters.set(this.mockStarters);
    this.starter.isLoading.set(this.mockLoading);
    this.starter.hasError.set(this.mockError);
  }

  onStarterClick(starter: string): void {
    this.starterClick.emit(starter);
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/AI/Conversation Starter',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, ConversationStarterWrapperComponent],
      providers: [MockAIService],
    }),
  ],
  tags: ['autodocs'],
  args: {
    starters: [
      'Hey! How are you doing?',
      'What are you working on today?',
      'Did you see the latest update?',
      'Want to grab coffee later?',
    ],
    isLoading: false,
    hasError: false,
  },
  argTypes: {
    starters: {
      control: 'object',
      description: 'Array of conversation starter suggestion strings (max 4 displayed).',
      table: {
        type: { summary: 'string[]' },
        category: 'Data',
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading shimmer bars while fetching AI suggestions.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    hasError: {
      control: 'boolean',
      description: 'Show error state when fetching conversation starters fails.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    starterClick: {
      action: 'starterClick',
      description: 'Emitted when a conversation starter chip is clicked.',
      table: {
        type: { summary: 'EventEmitter<string>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatConversationStarter displays AI-generated conversation starter suggestions as clickable chips. Shows up to 4 suggestions for new or empty conversations, with loading shimmer, error, and empty states. Supports keyboard navigation (ArrowLeft/ArrowRight) and screen reader announcements.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default conversation starter with four pre-loaded suggestions. */
export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      <storybook-conversation-starter-wrapper
        [mockStarters]="starters"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (starterClick)="starterClick($event)"
      ></storybook-conversation-starter-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default conversation starter with 4 pre-loaded suggestions displayed as clickable chips. Click a chip to emit the starterClick event. Navigate between chips with ArrowLeft/ArrowRight keys.',
      },
    },
  },
};

/** Starter suggestions demonstrating a different set of contextual prompts. */
export const StarterSuggestions: Story = {
  args: {
    starters: [
      'How was your weekend?',
      'Any plans for the holidays?',
      'Have you tried the new feature?',
    ],
    isLoading: false,
    hasError: false,
  },
  render: args => ({
    props: args,
    template: `
      <storybook-conversation-starter-wrapper
        [mockStarters]="starters"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (starterClick)="starterClick($event)"
      ></storybook-conversation-starter-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Conversation starter with a different set of contextual suggestions. Demonstrates the chip layout with three starter options.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all conversation starter variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-conversation-starter-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-conversation-starter-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Conversation Starter Variants
        </h3>

        <!-- With Suggestions -->
        <div class="cometchat-conversation-starter-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-starter-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Suggestions (4 starters)
          </p>
          <storybook-conversation-starter-wrapper
            [mockStarters]="withStarters"
            [mockLoading]="false"
            [mockError]="false"
          ></storybook-conversation-starter-wrapper>
        </div>

        <!-- Loading State -->
        <div class="cometchat-conversation-starter-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-starter-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <storybook-conversation-starter-wrapper
            [mockStarters]="emptyStarters"
            [mockLoading]="true"
            [mockError]="false"
          ></storybook-conversation-starter-wrapper>
        </div>

        <!-- Error State -->
        <div class="cometchat-conversation-starter-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-starter-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <storybook-conversation-starter-wrapper
            [mockStarters]="emptyStarters"
            [mockLoading]="false"
            [mockError]="true"
          ></storybook-conversation-starter-wrapper>
        </div>

        <!-- Empty Suggestions -->
        <div class="cometchat-conversation-starter-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-starter-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty Suggestions
          </p>
          <storybook-conversation-starter-wrapper
            [mockStarters]="emptyStarters"
            [mockLoading]="false"
            [mockError]="false"
          ></storybook-conversation-starter-wrapper>
        </div>

      </div>
    `,
    props: {
      withStarters: [
        'Hey! How are you doing?',
        'What are you working on today?',
        'Did you see the latest update?',
        'Want to grab coffee later?',
      ],
      emptyStarters: [] as string[],
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all conversation starter variants — with suggestions, loading shimmer, error state, and empty suggestions — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
