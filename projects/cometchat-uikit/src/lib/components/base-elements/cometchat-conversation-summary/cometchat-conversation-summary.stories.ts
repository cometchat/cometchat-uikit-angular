/**
 * CometChatConversationSummary Storybook Stories
 *
 * Interactive stories demonstrating the conversation summary component variants:
 * - Default with a pre-loaded AI-generated summary
 * - Summary display with longer content
 * - All variants showcase (loading, loaded, empty, error)
 *
 * Uses a wrapper component to bypass the SDK fetch and set internal
 * signal state directly, allowing stories to render without live AI calls.
 *
 * @module components/cometchat-conversation-summary
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

import { CometChatConversationSummaryComponent } from './cometchat-conversation-summary.component';
import { MockAIService } from '../../../../../../../.storybook/utils/mock-services';
import { States } from '../../../Enums/Enums';

// ============================================
// Mock Classes
// ============================================

/**
 * Wrapper component that sets internal signals on the child
 * CometChatConversationSummaryComponent after render, bypassing the
 * SDK fetch triggered by ngOnInit. Re-applies state on input changes.
 */
@Component({
  selector: 'storybook-conversation-summary-wrapper',
  standalone: true,
  imports: [CometChatConversationSummaryComponent],
  template: `
    <cometchat-conversation-summary
      [closeCallback]="onClose.bind(this)"
    ></cometchat-conversation-summary>
  `,
})
class ConversationSummaryWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild(CometChatConversationSummaryComponent)
  summary!: CometChatConversationSummaryComponent;

  /** Mock summary text to display. */
  @Input() mockSummaryText = '';

  /** Whether to show the loading state. */
  @Input() mockLoading = false;

  /** Whether to show the error state. */
  @Input() mockError = false;

  /** Re-emits the close action. */
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
    if (this.mockLoading) {
      this.summary.state.set(States.loading);
    } else if (this.mockError) {
      this.summary.state.set(States.error);
    } else if (this.mockSummaryText && this.mockSummaryText.trim().length > 0) {
      this.summary.summaryText.set(this.mockSummaryText);
      this.summary.state.set(States.loaded);
    } else {
      this.summary.state.set(States.empty);
    }
  }

  onClose(): void {
    this.closeClick.emit();
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/AI/Conversation Summary',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, ConversationSummaryWrapperComponent],
      providers: [MockAIService],
    }),
  ],
  tags: ['autodocs'],
  args: {
    summaryText:
      'Alice asked about the project deadline. Bob confirmed it is next Friday. They discussed splitting the remaining tasks and agreed to sync again on Wednesday.',
    isLoading: false,
    hasError: false,
  },
  argTypes: {
    summaryText: {
      control: 'text',
      description: 'The AI-generated conversation summary text to display in the panel body.',
      table: {
        type: { summary: 'string' },
        category: 'Data',
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading shimmer bars while fetching the AI summary.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    hasError: {
      control: 'boolean',
      description: 'Show error state when fetching the conversation summary fails.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close button is clicked to dismiss the summary panel.',
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
          'CometChatConversationSummary displays an AI-generated summary of the conversation in a panel with a localized title, close button, and body area. Supports loading shimmer, loaded summary text, empty state, and error state. The close button is keyboard accessible (Enter/Space).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default conversation summary with a pre-loaded AI-generated summary. */
export const Default: Story = {
  render: args => ({
    props: args,
    template: `
      <storybook-conversation-summary-wrapper
        [mockSummaryText]="summaryText"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (closeClick)="closeClick($event)"
      ></storybook-conversation-summary-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default conversation summary with a pre-loaded AI-generated summary displayed in the panel body. Click the close button to dismiss the panel.',
      },
    },
  },
};

/** Summary display with a longer, multi-topic conversation summary. */
export const SummaryDisplay: Story = {
  args: {
    summaryText:
      'The team discussed three main topics: 1) The upcoming product launch scheduled for March 15th, including marketing materials and press releases. 2) Bug fixes for the authentication module — two critical issues were identified and assigned to the backend team. 3) A proposal for a new onboarding flow was reviewed, with feedback to simplify the first three steps. Action items were assigned and a follow-up meeting was set for Thursday.',
    isLoading: false,
    hasError: false,
  },
  render: args => ({
    props: args,
    template: `
      <storybook-conversation-summary-wrapper
        [mockSummaryText]="summaryText"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (closeClick)="closeClick($event)"
      ></storybook-conversation-summary-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Conversation summary with a longer, multi-topic summary text. Demonstrates how the panel handles detailed AI-generated content covering multiple discussion points.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all conversation summary variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-conversation-summary-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-conversation-summary-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Conversation Summary Variants
        </h3>

        <!-- Loaded Summary -->
        <div class="cometchat-conversation-summary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-summary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded Summary
          </p>
          <storybook-conversation-summary-wrapper
            [mockSummaryText]="loadedSummary"
            [mockLoading]="false"
            [mockError]="false"
          ></storybook-conversation-summary-wrapper>
        </div>

        <!-- Loading State -->
        <div class="cometchat-conversation-summary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-summary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <storybook-conversation-summary-wrapper
            [mockSummaryText]="emptySummary"
            [mockLoading]="true"
            [mockError]="false"
          ></storybook-conversation-summary-wrapper>
        </div>

        <!-- Error State -->
        <div class="cometchat-conversation-summary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-summary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <storybook-conversation-summary-wrapper
            [mockSummaryText]="emptySummary"
            [mockLoading]="false"
            [mockError]="true"
          ></storybook-conversation-summary-wrapper>
        </div>

        <!-- Empty State -->
        <div class="cometchat-conversation-summary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-conversation-summary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <storybook-conversation-summary-wrapper
            [mockSummaryText]="emptySummary"
            [mockLoading]="false"
            [mockError]="false"
          ></storybook-conversation-summary-wrapper>
        </div>

      </div>
    `,
    props: {
      loadedSummary:
        'Alice asked about the project deadline. Bob confirmed it is next Friday. They discussed splitting the remaining tasks and agreed to sync again on Wednesday.',
      emptySummary: '',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all conversation summary variants — loaded summary, loading shimmer, error state, and empty state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
