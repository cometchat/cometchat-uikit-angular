/**
 * CometChatCreatePoll Storybook Stories
 *
 * Interactive stories demonstrating the poll creation dialog:
 * - Default poll form with user receiver
 * - Default form with group receiver
 * - Form with pre-filled answer options
 * - All variants showcase
 *
 * The component depends on MessageComposerService for poll creation,
 * which is provided as a no-op mock to avoid live SDK calls.
 *
 * @module components/cometchat-create-poll
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { fn } from 'storybook/test';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CometChatCreatePollComponent } from './cometchat-create-poll.component';
import { createMockUser, createMockGroup } from '../../../../../../.storybook/utils/mock-data';
import { MessageComposerService } from '../../services/message-composer.service';

// ============================================
// Mock Classes
// ============================================

/**
 * No-op mock for MessageComposerService so the component renders
 * in Storybook without requiring CometChat SDK initialisation.
 */
class MockMessageComposerService {
  async createPoll(): Promise<void> {}
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatCreatePollComponent> = {
  title: 'Components/Misc/Create Poll',
  component: CometChatCreatePollComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FormsModule],
      providers: [{ provide: MessageComposerService, useClass: MockMessageComposerService }],
    }),
  ],
  args: {
    user: createMockUser({ uid: 'user-1', name: 'Alice' }),
    defaultAnswers: 2,
    closeClick: fn(),
    pollCreated: fn(),
    error: fn(),
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed at the top of the poll creation form',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    user: {
      control: false,
      description: 'CometChat User to send the poll to (for 1-on-1 conversations)',
      table: {
        type: { summary: 'CometChat.User' },
        defaultValue: { summary: 'undefined' },
      },
    },
    group: {
      control: false,
      description: 'CometChat Group to send the poll to (for group conversations)',
      table: {
        type: { summary: 'CometChat.Group' },
        defaultValue: { summary: 'undefined' },
      },
    },
    replyToMessage: {
      control: false,
      description: 'Message to reply to when creating a poll as a quoted reply',
      table: {
        type: { summary: 'CometChat.BaseMessage' },
        defaultValue: { summary: 'undefined' },
      },
    },
    defaultAnswers: {
      control: 'number',
      description: 'Number of initial answer option fields shown (minimum 2)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    questionPlaceholderText: {
      control: 'text',
      description: 'Placeholder text for the question input field',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    answerPlaceholderText: {
      control: 'text',
      description: 'Placeholder text for each answer option input',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    answerHelpText: {
      control: 'text',
      description: 'Help text label for the answers section',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    addAnswerText: {
      control: 'text',
      description: 'Text for the add option button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    createPollButtonText: {
      control: 'text',
      description: 'Text for the create poll submit button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close button is clicked',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    pollCreated: {
      action: 'pollCreated',
      description: 'Emitted when a poll is successfully created',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted when an error occurs during poll creation',
      table: {
        type: { summary: 'EventEmitter<CometChat.CometChatException>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatCreatePoll is a modal dialog for creating poll messages. It provides a question field, 2–12 dynamic answer options with add/remove controls, input validation, loading state, error handling, and full keyboard accessibility with focus trapping.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCreatePollComponent>;

// ============================================
// Stories
// ============================================

/** Default poll creation dialog targeting a user conversation with two empty answer fields. */
export const Default: Story = {
  render: (args) => ({
    template: `
      <div style="width: 420px;">
        <cometchat-create-poll [user]="user" [defaultAnswers]="defaultAnswers"></cometchat-create-poll>
      </div>
    `,
    props: args,
  }),
  args: {
    user: createMockUser({ uid: 'user-1', name: 'Alice' }),
    defaultAnswers: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default poll creation dialog with a user receiver and two initial answer option fields. This is the most common usage for 1-on-1 conversations.',
      },
    },
  },
};

/** Default form targeting a group conversation. */
export const DefaultForm: Story = {
  render: (args) => ({
    template: `
      <div style="width: 420px;">
        <cometchat-create-poll [group]="group" [defaultAnswers]="defaultAnswers"></cometchat-create-poll>
      </div>
    `,
    props: args,
  }),
  args: {
    group: createMockGroup({ guid: 'group-1', name: 'Design Team' }),
    user: undefined,
    defaultAnswers: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Poll creation form targeting a group conversation. The form starts with two empty answer fields and the default localized labels.',
      },
    },
  },
};

/** Form initialized with four answer option fields for pre-filling. */
export const FormWithPreFilledOptions: Story = {
  render: (args) => ({
    template: `
      <div style="width: 420px;">
        <cometchat-create-poll
          [user]="user"
          [defaultAnswers]="defaultAnswers"
          [questionPlaceholderText]="questionPlaceholderText"
          [answerPlaceholderText]="answerPlaceholderText"
        ></cometchat-create-poll>
      </div>
    `,
    props: args,
  }),
  args: {
    user: createMockUser({ uid: 'user-2', name: 'Bob' }),
    defaultAnswers: 4,
    questionPlaceholderText: 'What should we have for lunch?',
    answerPlaceholderText: 'Add an option...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Poll form initialized with four answer option fields and custom placeholder text. Demonstrates the defaultAnswers input for pre-expanding the options list.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all create poll variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-create-poll-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5); max-height: 90vh; overflow-y: auto;">

        <h3 class="cometchat-create-poll-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Create Poll Variants
        </h3>

        <!-- User Conversation -->
        <div class="cometchat-create-poll-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-create-poll-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            User Conversation (2 options)
          </p>
          <div style="width: 420px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
            <cometchat-create-poll [user]="userReceiver" [defaultAnswers]="2"></cometchat-create-poll>
          </div>
        </div>

        <!-- Group Conversation -->
        <div class="cometchat-create-poll-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-create-poll-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Group Conversation (2 options)
          </p>
          <div style="width: 420px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
            <cometchat-create-poll [group]="groupReceiver" [defaultAnswers]="2"></cometchat-create-poll>
          </div>
        </div>

        <!-- Expanded Options -->
        <div class="cometchat-create-poll-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-create-poll-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Expanded Options (4 fields)
          </p>
          <div style="width: 420px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
            <cometchat-create-poll [user]="userReceiver" [defaultAnswers]="4"></cometchat-create-poll>
          </div>
        </div>

      </div>
    `,
    props: {
      userReceiver: createMockUser({ uid: 'user-1', name: 'Alice' }),
      groupReceiver: createMockGroup({ guid: 'group-1', name: 'Design Team' }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying the create poll dialog in different configurations — user conversation, group conversation, and expanded options — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
