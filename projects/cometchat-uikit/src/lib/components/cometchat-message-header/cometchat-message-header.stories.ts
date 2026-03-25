/**
 * CometChatMessageHeader Storybook Stories
 *
 * Interactive stories demonstrating the message header component:
 * - User Chat Header (online user with call buttons)
 * - Group Chat Header (group with member count)
 * - Offline User Header
 * - Without Back Button
 * - Without Call Buttons
 * - With Search Option
 * - With Conversation Summary
 *
 * All variants render centered in both docs preview and fullscreen story pages.
 *
 * @module components/cometchat-message-header
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatMessageHeaderComponent } from './cometchat-message-header.component';
import { CallButtonsService } from '../../services/call-buttons.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { createMockUser, createMockGroup, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import {
  MockCallService,
  mockCallAnnouncer,
} from '../../../../../../.storybook/utils/mock-services';

// ============================================
// Mock Data
// ============================================

const onlineUser = createMockUser({
  uid: 'user-header-1',
  name: 'John Doe',
  avatar: MOCK_AVATARS.andrewJoseph,
  status: CometChat.USER_STATUS.ONLINE,
});

const offlineUser = createMockUser({
  uid: 'user-header-2',
  name: 'Jane Smith',
  status: CometChat.USER_STATUS.OFFLINE,
  lastActiveAt: Date.now() / 1000 - 3600,
});

const testGroup = createMockGroup({
  guid: 'group-header-1',
  name: 'Design Team',
  membersCount: 12,
  type: CometChat.GROUP_TYPE.PUBLIC,
});

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
// Shared render helpers
// ============================================

const headerRenderUser = (userObj: CometChat.User) => {
  return (args: Record<string, unknown>) => ({
    props: {
      ...args,
      user: userObj,
    },
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-header
            [user]="user"
            [hideUserStatus]="hideUserStatus"
            [showBackButton]="showBackButton"
            [hideVoiceCallButton]="hideVoiceCallButton"
            [hideVideoCallButton]="hideVideoCallButton"
            [showSearchOption]="showSearchOption"
            [showConversationSummaryButton]="showConversationSummaryButton"
            [summaryGenerationMessageCount]="summaryGenerationMessageCount"
            [enableAutoSummaryGeneration]="enableAutoSummaryGeneration"
            (backClick)="backClick($event)"
            (itemClick)="itemClick($event)"
            (searchClick)="searchClick($event)"
            (conversationSummaryClick)="conversationSummaryClick($event)"
            (voiceCallClick)="voiceCallClick($event)"
            (videoCallClick)="videoCallClick($event)"
            (error)="error($event)">
          </cometchat-message-header>
        </div>
      </div>
    `,
  });
};

const headerRenderGroup = () => {
  return (args: Record<string, unknown>) => ({
    props: {
      ...args,
      group: testGroup,
    },
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-header
            [group]="group"
            [showBackButton]="showBackButton"
            [hideVoiceCallButton]="hideVoiceCallButton"
            [hideVideoCallButton]="hideVideoCallButton"
            [showSearchOption]="showSearchOption"
            [showConversationSummaryButton]="showConversationSummaryButton"
            [summaryGenerationMessageCount]="summaryGenerationMessageCount"
            [enableAutoSummaryGeneration]="enableAutoSummaryGeneration"
            (backClick)="backClick($event)"
            (itemClick)="itemClick($event)"
            (searchClick)="searchClick($event)"
            (conversationSummaryClick)="conversationSummaryClick($event)"
            (voiceCallClick)="voiceCallClick($event)"
            (videoCallClick)="videoCallClick($event)"
            (error)="error($event)">
          </cometchat-message-header>
        </div>
      </div>
    `,
  });
};

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMessageHeaderComponent> = {
  title: 'Components/Messages/CometChat Message Header',
  component: CometChatMessageHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
      providers: [
        { provide: CallButtonsService, useClass: MockCallService },
        { provide: CallAnnouncerService, useValue: mockCallAnnouncer },
      ],
    }),
  ],
  args: {
    hideUserStatus: false,
    showBackButton: true,
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
    showSearchOption: false,
    showConversationSummaryButton: false,
    summaryGenerationMessageCount: 1000,
    enableAutoSummaryGeneration: false,
  },
  argTypes: {
    // Entity Configuration
    user: {
      control: false,
      description: 'CometChat.User object for 1-on-1 conversations. Mutually exclusive with group.',
      table: { type: { summary: 'CometChat.User' }, category: 'Entity Configuration' },
    },
    group: {
      control: false,
      description: 'CometChat.Group object for group conversations. Mutually exclusive with user.',
      table: { type: { summary: 'CometChat.Group' }, category: 'Entity Configuration' },
    },

    // Display Controls
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide the user online/offline status indicator',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    showBackButton: {
      control: 'boolean',
      description: 'Show the back button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    hideVoiceCallButton: {
      control: 'boolean',
      description: 'Hide the voice call button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    hideVideoCallButton: {
      control: 'boolean',
      description: 'Hide the video call button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    showSearchOption: {
      control: 'boolean',
      description: 'Show the search option button in the header',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },
    showConversationSummaryButton: {
      control: 'boolean',
      description: 'Show the AI conversation summary button',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'Display Controls' },
    },

    // AI Configuration
    summaryGenerationMessageCount: {
      control: 'number',
      description: 'Number of messages to use for AI summary generation',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1000' }, category: 'AI Configuration' },
    },
    enableAutoSummaryGeneration: {
      control: 'boolean',
      description: 'Automatically generate conversation summary on component init',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'AI Configuration' },
    },

    // Date/Time Configuration
    lastActiveAtDateTimeFormat: {
      control: false,
      description: 'Custom date/time format for the last active timestamp',
      table: { type: { summary: 'CalendarObject' }, category: 'Date/Time Configuration' },
    },

    // Template Inputs
    headerView: { control: false, table: { type: { summary: 'TemplateRef<any>' }, category: 'Template Inputs' } },
    itemView: { control: false, table: { type: { summary: 'TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>' }, category: 'Template Inputs' } },
    leadingView: { control: false, table: { type: { summary: 'TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>' }, category: 'Template Inputs' } },
    titleView: { control: false, table: { type: { summary: 'TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>' }, category: 'Template Inputs' } },
    subtitleView: { control: false, table: { type: { summary: 'TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>' }, category: 'Template Inputs' } },
    trailingView: { control: false, table: { type: { summary: 'TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>' }, category: 'Template Inputs' } },
    backButtonView: { control: false, table: { type: { summary: 'TemplateRef<any>' }, category: 'Template Inputs' } },
    auxiliaryButtonView: { control: false, table: { type: { summary: 'TemplateRef<{ user?: CometChat.User; group?: CometChat.Group }>' }, category: 'Template Inputs' } },

    // Output Events
    backClick: { action: 'backClick', table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' } },
    itemClick: { action: 'itemClick', table: { type: { summary: 'EventEmitter<CometChat.User | CometChat.Group>' }, category: 'Events' } },
    searchClick: { action: 'searchClick', table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' } },
    conversationSummaryClick: { action: 'conversationSummaryClick', table: { type: { summary: 'EventEmitter<{ messageCount: number }>' }, category: 'Events' } },
    voiceCallClick: { action: 'voiceCallClick', table: { type: { summary: 'EventEmitter<CometChat.User | CometChat.Group>' }, category: 'Events' } },
    videoCallClick: { action: 'videoCallClick', table: { type: { summary: 'EventEmitter<CometChat.User | CometChat.Group>' }, category: 'Events' } },
    error: { action: 'error', table: { type: { summary: 'EventEmitter<CometChat.CometChatException>' }, category: 'Events' } },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatMessageHeader displays the header section of a chat conversation, showing avatar, name, online/offline status for users, member count for groups, and action buttons (back, voice/video call). Supports extensive template customization and full keyboard navigation.',
      },
    },
  },
  render: headerRenderUser(onlineUser),
};

export default meta;
type Story = StoryObj<CometChatMessageHeaderComponent>;

// ============================================
// Stories
// ============================================

/** Message header for a 1-on-1 user conversation showing online status and call actions. */
export const UserChatHeader: Story = {
  render: headerRenderUser(onlineUser),
  parameters: {
    docs: {
      description: {
        story:
          'Header for a 1-on-1 user conversation displaying the user avatar, name, online/offline status indicator, and voice/video call action buttons.',
      },
    },
  },
};

/** Message header for a group conversation showing member count and call actions. */
export const GroupChatHeader: Story = {
  render: headerRenderGroup(),
  parameters: {
    docs: {
      description: {
        story:
          'Header for a group conversation displaying the group icon, name, member count in the subtitle, and voice/video call action buttons.',
      },
    },
  },
};

/** Message header for an offline user showing last active timestamp. */
export const OfflineUserHeader: Story = {
  render: headerRenderUser(offlineUser),
  parameters: {
    docs: {
      description: {
        story: 'Header for an offline user conversation showing last active timestamp in the subtitle.',
      },
    },
  },
};

/** Message header without the back button. */
export const WithoutBackButton: Story = {
  args: { showBackButton: false },
  render: headerRenderUser(onlineUser),
  parameters: {
    docs: {
      description: {
        story: 'Header without the back button, suitable for single-panel layouts.',
      },
    },
  },
};

/** Message header without call buttons. */
export const WithoutCallButtons: Story = {
  args: { hideVoiceCallButton: true, hideVideoCallButton: true },
  render: headerRenderUser(onlineUser),
  parameters: {
    docs: {
      description: {
        story: 'Header with voice and video call buttons hidden.',
      },
    },
  },
};

/** Message header with search option enabled. */
export const WithSearchOption: Story = {
  args: { showSearchOption: true },
  render: headerRenderUser(onlineUser),
  parameters: {
    docs: {
      description: {
        story: 'Header with the search option button visible in the trailing section.',
      },
    },
  },
};

/** Message header with AI conversation summary button. */
export const WithConversationSummary: Story = {
  args: { showConversationSummaryButton: true },
  render: headerRenderUser(onlineUser),
  parameters: {
    docs: {
      description: {
        story: 'Header with the AI conversation summary button enabled.',
      },
    },
  },
};
