/**
 * CometChatSmartReplies Storybook Stories
 *
 * Interactive stories demonstrating the smart replies component variants:
 * - Default with pre-loaded reply suggestions
 * - Multiple default suggestions as clickable chips
 * - Empty suggestions state
 * - All variants showcase
 *
 * Uses a wrapper component to bypass the SDK fetch and set internal
 * signal state directly, allowing stories to render without live AI calls.
 *
 * @module components/cometchat-smart-replies
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

import { CometChatSmartRepliesComponent } from './cometchat-smart-replies.component';
import { MockAIService } from '../../../../../../../.storybook/utils/mock-services';

// ============================================
// Mock Classes
// ============================================

/**
 * Wrapper component that sets internal signals on the child
 * CometChatSmartRepliesComponent after render, bypassing the
 * SDK fetch triggered by ngOnChanges. Re-applies state on input changes.
 */
@Component({
  selector: 'storybook-smart-replies-wrapper',
  standalone: true,
  imports: [CometChatSmartRepliesComponent],
  template: `
    <cometchat-smart-replies
      [keywords]="[]"
      [delayDuration]="0"
      (replyClick)="onReplyClick($event)"
      (closeClick)="onCloseClick()"
    ></cometchat-smart-replies>
  `,
})
class SmartRepliesWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild(CometChatSmartRepliesComponent)
  smartReplies!: CometChatSmartRepliesComponent;

  /** Mock reply suggestions to display. */
  @Input() mockReplies: string[] = [];

  /** Whether to show the loading state. */
  @Input() mockLoading = false;

  /** Whether to show the error state. */
  @Input() mockError = false;

  /** Re-emits the child replyClick event. */
  @Output() replyClick = new EventEmitter<string>();

  /** Re-emits the child closeClick event. */
  @Output() closeClick = new EventEmitter<void>();

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
    this.smartReplies.replies.set(this.mockReplies);
    this.smartReplies.isLoading.set(this.mockLoading);
    this.smartReplies.hasError.set(this.mockError);
  }

  onReplyClick(reply: string): void {
    this.replyClick.emit(reply);
  }

  onCloseClick(): void {
    this.closeClick.emit();
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/AI/Smart Replies',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, SmartRepliesWrapperComponent],
      providers: [MockAIService],
    }),
  ],
  tags: ['autodocs'],
  args: {
    replies: ['Sounds good!', 'Let me check and get back to you.', 'Thanks for letting me know.'],
    isLoading: false,
    hasError: false,
  },
  argTypes: {
    replies: {
      control: 'object',
      description: 'Array of smart reply suggestion strings (max 3 displayed).',
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
      description: 'Show error state when fetching smart replies fails.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    replyClick: {
      action: 'replyClick',
      description: 'Emitted when a smart reply chip is clicked.',
      table: {
        type: { summary: 'EventEmitter<string>' },
        category: 'Events',
      },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close button is clicked.',
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
          'CometChatSmartReplies displays AI-generated reply suggestions as clickable chips. Shows up to 3 suggestions based on the last received message, with loading shimmer, error, and empty states. Supports keyboard navigation (ArrowLeft/ArrowRight) and screen reader announcements.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default smart replies with three pre-loaded suggestions. */
export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      <storybook-smart-replies-wrapper
        [mockReplies]="replies"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (replyClick)="replyClick($event)"
        (closeClick)="closeClick($event)"
      ></storybook-smart-replies-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default smart replies with 3 pre-loaded suggestions displayed as clickable chips. Click a chip to emit the replyClick event. Navigate between chips with ArrowLeft/ArrowRight keys.',
      },
    },
  },
};

/** Multiple default suggestions demonstrating the full chip layout. */
export const DefaultSuggestions: Story = {
  args: {
    replies: [
      'Sure, I can help with that!',
      'Let me think about it.',
      'That sounds like a great idea!',
    ],
    isLoading: false,
    hasError: false,
  },
  render: args => ({
    props: args,
    template: `
      <storybook-smart-replies-wrapper
        [mockReplies]="replies"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (replyClick)="replyClick($event)"
        (closeClick)="closeClick($event)"
      ></storybook-smart-replies-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Smart replies with a different set of suggestions. Demonstrates the full chip layout with three reply options.',
      },
    },
  },
};

/** Empty suggestions state when no replies are available. */
export const EmptySuggestions: Story = {
  args: {
    replies: [],
    isLoading: false,
    hasError: false,
  },
  render: args => ({
    props: args,
    template: `
      <storybook-smart-replies-wrapper
        [mockReplies]="replies"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (replyClick)="replyClick($event)"
        (closeClick)="closeClick($event)"
      ></storybook-smart-replies-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: empty suggestions state when the AI extension returns no replies. The component displays an empty-state message.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all smart replies variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-smart-replies-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-smart-replies-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Smart Replies Variants
        </h3>

        <!-- With Suggestions -->
        <div class="cometchat-smart-replies-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-smart-replies-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Suggestions
          </p>
          <storybook-smart-replies-wrapper
            [mockReplies]="withSuggestions"
            [mockLoading]="false"
            [mockError]="false"
          ></storybook-smart-replies-wrapper>
        </div>

        <!-- Loading State -->
        <div class="cometchat-smart-replies-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-smart-replies-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <storybook-smart-replies-wrapper
            [mockReplies]="emptyReplies"
            [mockLoading]="true"
            [mockError]="false"
          ></storybook-smart-replies-wrapper>
        </div>

        <!-- Error State -->
        <div class="cometchat-smart-replies-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-smart-replies-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <storybook-smart-replies-wrapper
            [mockReplies]="emptyReplies"
            [mockLoading]="false"
            [mockError]="true"
          ></storybook-smart-replies-wrapper>
        </div>

        <!-- Empty Suggestions -->
        <div class="cometchat-smart-replies-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-smart-replies-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty Suggestions
          </p>
          <storybook-smart-replies-wrapper
            [mockReplies]="emptyReplies"
            [mockLoading]="false"
            [mockError]="false"
          ></storybook-smart-replies-wrapper>
        </div>

      </div>
    `,
    props: {
      withSuggestions: [
        'Sounds good!',
        'Let me check and get back to you.',
        'Thanks for letting me know.',
      ],
      emptyReplies: [] as string[],
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all smart replies variants — with suggestions, loading shimmer, error state, and empty suggestions — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
