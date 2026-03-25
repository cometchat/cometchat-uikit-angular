/**
 * CometChatCallLogs Storybook Stories
 *
 * Interactive stories demonstrating the call logs component variants:
 * - Default call logs list with mock call history
 * - Call history with multiple call types and statuses
 * - Empty logs state
 * - All variants showcase
 *
 * @module components/cometchat-call-logs
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatCallLogsComponent } from './cometchat-call-logs.component';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

/**
 * Mock CometChat.User shape for call log stories.
 */
class MockCallUser {
  uid: string;
  name: string;
  avatar: string;

  constructor(uid: string, name: string, avatar?: string) {
    this.uid = uid;
    this.name = name;
    this.avatar = avatar || '';
  }
  getUid(): string {
    return this.uid;
  }
  getName(): string {
    return this.name;
  }
  getAvatar(): string {
    return this.avatar;
  }
}

/** Logged-in user identity for determining call direction. */
const LOGGED_IN_USER = new MockCallUser('logged-in-user', 'Me');

/**
 * Mock CometChat.getLoggedinUser so the component can resolve the logged-in user
 * without SDK initialization. This enables getCallUser() to show names and avatars.
 */
CometChat.getLoggedinUser = (() => Promise.resolve(LOGGED_IN_USER)) as any;

/**
 * Creates a mock call log entry matching the shape consumed by CometChatCallLogs.
 */
function createMockCallLog(overrides?: {
  sessionId?: string;
  type?: 'audio' | 'video';
  status?: string;
  initiator?: MockCallUser;
  receiver?: MockCallUser;
  initiatedAt?: number;
}): any {
  const sessionId = overrides?.sessionId || `session-${Math.random().toString(36).slice(2, 11)}`;
  const type = overrides?.type || 'audio';
  const status = overrides?.status || 'ended';
  const initiatedAt =
    overrides?.initiatedAt || Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400);
  const initiator =
    overrides?.initiator ||
    new MockCallUser(`initiator-${sessionId}`, `Caller ${sessionId.slice(-4)}`);
  const receiver =
    overrides?.receiver ||
    new MockCallUser(`receiver-${sessionId}`, `Receiver ${sessionId.slice(-4)}`);

  return {
    getSessionID: () => sessionId,
    getInitiator: () => initiator,
    getReceiver: () => receiver,
    getStatus: () => status,
    getType: () => type,
    initiatedAt,
    type,
  };
}

/**
 * Creates an array of realistic mock call logs with varied types, statuses, and participants.
 */
function createMockCallLogs(count: number): any[] {
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Ross',
    'Edward Norton',
    'Fiona Apple',
    'George Lucas',
    'Hannah Montana',
    'Ivan Petrov',
    'Julia Roberts',
    'Kevin Hart',
    'Lisa Simpson',
  ];
  const statuses = ['ended', 'ended', 'ended', 'unanswered', 'cancelled', 'busy'];
  const types: ('audio' | 'video')[] = ['audio', 'video'];

  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length];
    const isOutgoing = i % 3 === 0;
    const photoMap: Record<string, string> = {
      'Alice Johnson': MOCK_AVATARS.nancyGrace,
      'Bob Smith': MOCK_AVATARS.georgeAlan,
      'Charlie Brown': MOCK_AVATARS.andrewJoseph,
    };
    const otherUser = new MockCallUser(
      `user-${name.toLowerCase().replace(/\s/g, '-')}`,
      name,
      photoMap[name]
    );

    return createMockCallLog({
      sessionId: `session-${i + 1}`,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      initiator: isOutgoing ? LOGGED_IN_USER : otherUser,
      receiver: isOutgoing ? otherUser : LOGGED_IN_USER,
      initiatedAt: Math.floor(Date.now() / 1000) - i * 3600,
    });
  });
}

// ============================================
// Wrapper Component
// ============================================

/**
 * Wrapper component that injects a mock CallLogRequestBuilder into CometChatCallLogs.
 * This avoids SDK initialization while providing realistic data for stories.
 */
@Component({
  selector: 'cometchat-call-logs-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatCallLogsComponent],
  template: `
    <cometchat-call-logs
      [activeCall]="activeCall"
      [showScrollbar]="showScrollbar"
      [callLogRequestBuilder]="mockRequestBuilder"
      [onError]="handleError"
    >
    </cometchat-call-logs>
  `,
})
class CallLogsStoryWrapperComponent implements OnInit {
  @Input() mockCallLogs: any[] = [];
  @Input() activeCall: any = null;
  @Input() showScrollbar = false;
  @Input() simulateEmpty = false;
  @Input() simulateError = false;

  mockRequestBuilder: any = null;
  private shouldError = false;

  handleError = (_error: any): void => {
    // Error occurred - on retry, show shimmer for 300ms then error again
    if (this.simulateError) {
      setTimeout(() => {
        this.shouldError = true;
        this.mockRequestBuilder = this.createErrorRequestBuilder();
      }, 300);
    }
  };

  ngOnInit(): void {
    this.shouldError = this.simulateError;
    this.buildRequestBuilder();
  }

  private buildRequestBuilder(): void {
    if (this.simulateEmpty) {
      this.mockRequestBuilder = this.createEmptyRequestBuilder();
    } else if (this.simulateError || this.shouldError) {
      this.mockRequestBuilder = this.createErrorRequestBuilder();
    } else if (this.mockCallLogs.length > 0) {
      this.mockRequestBuilder = this.createDataRequestBuilder();
    }
  }

  private createEmptyRequestBuilder(): any {
    return {
      build: () => ({
        fetchNext: async () => [],
      }),
    };
  }

  private createErrorRequestBuilder(): any {
    return {
      build: () => ({
        fetchNext: async () => {
          const error = new Error('Failed to fetch call logs');
          (error as any).code = 'ERROR';
          (error as any).details = 'Mock error for Storybook demo';
          throw error;
        },
      }),
    };
  }

  private createDataRequestBuilder(): any {
    const calls = this.mockCallLogs;
    let fetched = false;
    return {
      build: () => ({
        fetchNext: async () => {
          if (!fetched) {
            fetched = true;
            return calls;
          }
          return [];
        },
      }),
    };
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatCallLogsComponent> = {
  title: 'Components/Calls/CometChat Call Logs',
  component: CometChatCallLogsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CallLogsStoryWrapperComponent],
    }),
  ],
  args: {
    activeCall: null,
    showScrollbar: false,
  },
  argTypes: {
    activeCall: {
      control: false,
      description: 'The currently selected/active call log for highlighting',
      table: {
        type: { summary: 'any' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    callLogRequestBuilder: {
      control: false,
      description:
        'Custom CallLogRequestBuilder from CometChatCalls. Overrides the default builder when provided.',
      table: {
        type: { summary: 'any' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    callInitiatedDateTimeFormat: {
      control: false,
      description: 'Custom date format for the call initiation timestamp',
      table: {
        type: { summary: 'CalendarObject | null' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Whether to show the scrollbar on the call logs list',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    onError: {
      control: false,
      description: 'Error callback invoked for any error during operations',
      table: {
        type: { summary: '((error: CometChatException) => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    menuView: {
      control: false,
      description: 'Custom template for the menu area in the header',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    itemView: {
      control: false,
      description: 'Custom template for each call log item (replaces entire list item)',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    leadingView: {
      control: false,
      description: 'Custom template for the leading position (replaces avatar)',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    titleView: {
      control: false,
      description: 'Custom template for the title (replaces caller name)',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    subtitleView: {
      control: false,
      description: 'Custom template for the subtitle (replaces direction icon + date)',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    trailingView: {
      control: false,
      description: 'Custom template for the trailing position (replaces call button)',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    loadingView: {
      control: false,
      description: 'Custom template for the loading state (replaces shimmer)',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    emptyView: {
      control: false,
      description: 'Custom template for the empty state',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    errorView: {
      control: false,
      description: 'Custom template for the error state',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when a call log list item is clicked',
      table: {
        type: { summary: 'EventEmitter<any>' },
        category: 'Events',
      },
    },
    callButtonClicked: {
      action: 'callButtonClicked',
      description: 'Emitted when the trailing call button is clicked',
      table: {
        type: { summary: 'EventEmitter<any>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatCallLogs displays a paginated list of call history records with caller avatars, call direction icons, timestamps, and audio/video call buttons. Supports active call highlighting, keyboard navigation, and full template customization for all sections.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCallLogsComponent>;

// ============================================
// Stories
// ============================================

/** Default call logs list with a set of recent call history entries. */
export const Default: Story = {
  render: args => ({
    props: {
      ...args,
      mockCallLogs: createMockCallLogs(8),
    },
    template: `
      <div style="width: 400px; height: 600px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
        <cometchat-call-logs-story-wrapper
          [showScrollbar]="showScrollbar"
          [mockCallLogs]="mockCallLogs">
        </cometchat-call-logs-story-wrapper>
      </div>
    `,
  }),
  args: { showScrollbar: false },
  parameters: {
    docs: {
      description: {
        story:
          'Default call logs list displaying recent call history with a mix of audio/video calls, incoming/outgoing directions, and various statuses (ended, unanswered, cancelled).',
      },
    },
  },
};

/** Call logs populated with a longer call history showing varied participants and call types. */
export const WithCallHistory: Story = {
  render: args => ({
    props: {
      ...args,
      mockCallLogs: createMockCallLogs(12),
    },
    template: `
      <div style="width: 400px; height: 600px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
        <cometchat-call-logs-story-wrapper
          [showScrollbar]="true"
          [mockCallLogs]="mockCallLogs">
        </cometchat-call-logs-story-wrapper>
      </div>
    `,
  }),
  args: { showScrollbar: true },
  parameters: {
    docs: {
      description: {
        story:
          'Call logs with a longer history of 12 entries and scrollbar enabled. Demonstrates pagination-ready list with diverse call participants, types, and statuses.',
      },
    },
  },
};

/** Empty call logs state when no call history exists. */
export const EmptyLogs: Story = {
  render: args => ({
    props: {
      ...args,
      simulateEmpty: true,
    },
    template: `
      <div style="width: 400px; height: 600px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
        <cometchat-call-logs-story-wrapper
          [showScrollbar]="showScrollbar"
          [simulateEmpty]="simulateEmpty">
        </cometchat-call-logs-story-wrapper>
      </div>
    `,
  }),
  args: { showScrollbar: false },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state displayed when no call logs are available. Shows the built-in empty state view with icon and descriptive text.',
      },
    },
  },
};

/** Error state displayed when fetching call logs fails. */
export const ErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div style="width: 400px; height: 600px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2);">
        <cometchat-call-logs-story-wrapper
          [showScrollbar]="showScrollbar"
          [simulateError]="simulateError">
        </cometchat-call-logs-story-wrapper>
      </div>
    `,
  }),
  args: { showScrollbar: false },
  parameters: {
    docs: {
      description: {
        story:
          'Error state displayed when fetching call logs fails. Shows the error UI with a retry option. Clicking retry shows shimmer for 300ms then returns to error state.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all call logs variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-call-logs-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-call-logs-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Call Logs Variants
        </h3>

        <!-- Default Call Logs -->
        <div class="cometchat-call-logs-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-logs-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default (Recent Calls)
          </p>
          <div style="width: 400px; height: 400px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-3);">
            <cometchat-call-logs-story-wrapper
              [mockCallLogs]="defaultLogs">
            </cometchat-call-logs-story-wrapper>
          </div>
        </div>

        <!-- Empty State -->
        <div class="cometchat-call-logs-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-logs-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <div style="width: 400px; height: 300px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-3);">
            <cometchat-call-logs-story-wrapper
              [simulateEmpty]="true">
            </cometchat-call-logs-story-wrapper>
          </div>
        </div>

        <!-- Error State -->
        <div class="cometchat-call-logs-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-logs-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <div style="width: 400px; height: 300px; overflow: hidden; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-3);">
            <cometchat-call-logs-story-wrapper
              [simulateError]="true">
            </cometchat-call-logs-story-wrapper>
          </div>
        </div>

      </div>
    `,
    props: {
      defaultLogs: createMockCallLogs(6),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying call logs variants — default list with recent calls, empty state, and error state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
