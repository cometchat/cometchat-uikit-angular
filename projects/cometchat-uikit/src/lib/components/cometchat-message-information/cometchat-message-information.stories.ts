/**
 * CometChatMessageInformation Storybook Stories
 *
 * Interactive stories demonstrating the message information panel:
 * - 1v1 message info with read/delivered timestamps
 * - Group message info with user avatars and receipts
 *
 * All variants render centered in both docs preview and fullscreen story pages.
 *
 * Mock receipts are injected via the local story wrapper component
 * (`cometchat-message-information-story-wrapper`) so the library component's
 * public API stays free of test-only inputs.
 *
 * @module components/cometchat-message-information
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatMessageInformationComponent, UserReceiptInfo } from './cometchat-message-information.component';
import { within, expect } from '@storybook/test';
import { CalendarObject } from '../../resources/CometChatLocalize/localization.interfaces';
import { CometChatTextFormatter } from '../../formatters/cometchat-text-formatter';
import { createMockMessage, createMockUser, createMockGroup } from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Helper Functions
// ============================================

function createGroupMessage(overrides?: {
  id?: number;
  text?: string;
  sentAt?: number;
}): CometChat.BaseMessage {
  createMockGroup({ guid: 'group-123', name: 'Design Team' });
  return createMockMessage('text', {
    id: overrides?.id || 100,
    text: overrides?.text || 'Hello team! This is a group message.',
    sentAt: overrides?.sentAt || Date.now() / 1000 - 3600,
    receiverId: 'group-123',
    receiverType: CometChat.RECEIVER_TYPE.GROUP,
    sender: createMockUser({ uid: 'sender-1', name: 'Alice' }),
  });
}

function createMockUserReceipts(): UserReceiptInfo[] {
  const now = Date.now() / 1000;
  return [
    {
      user: createMockUser({ uid: 'user-1', name: 'Pourav Raj', avatar: '' }),
      readAt: now - 1800,
      deliveredAt: now - 3600,
    },
    {
      user: createMockUser({ uid: 'user-2', name: 'Dawinder Kaur', avatar: '' }),
      readAt: 0,
      deliveredAt: now - 3600,
    },
    {
      user: createMockUser({ uid: 'user-3', name: 'Muni Kiran Narpareddi', avatar: '' }),
      readAt: 0,
      deliveredAt: now - 3600,
    },
    {
      user: createMockUser({ uid: 'user-4', name: 'Shital Bhutale', avatar: '' }),
      readAt: now - 7200,
      deliveredAt: now - 10800,
    },
  ];
}

// ============================================
// Story Wrapper — keeps mock injection out of the library API
// ============================================

/**
 * Wrapper used exclusively by Storybook stories.
 *
 * Populates the real component's internal signals with mock receipts so
 * stories can render without an SDK session. This replaces the previous
 * `mockReceipts` @Input on the library component.
 */
@Component({
  selector: 'cometchat-message-information-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatMessageInformationComponent],
  template: `
    <cometchat-message-information
      #infoComponent
      [message]="message"
      [dateTimeFormat]="dateTimeFormat"
      [textFormatters]="textFormatters"
      [showScrollbar]="showScrollbar"
      (closeClick)="closeClick.emit()">
    </cometchat-message-information>
  `,
})
class CometChatMessageInformationStoryWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild('infoComponent') infoComponent!: CometChatMessageInformationComponent;

  @Input() message!: CometChat.BaseMessage;
  @Input() dateTimeFormat?: CalendarObject;
  @Input() textFormatters: CometChatTextFormatter[] = [];
  @Input() showScrollbar = false;
  @Input() mockReceipts: UserReceiptInfo[] = [];

  @Output() closeClick = new EventEmitter<void>();

  ngAfterViewInit(): void {
    this.applyMockReceipts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['mockReceipts'] || changes['message']) && this.infoComponent) {
      this.applyMockReceipts();
    }
  }

  private applyMockReceipts(): void {
    if (!this.infoComponent) return;

    queueMicrotask(() => {
      this.infoComponent.userReceipts.set(this.mockReceipts);
      this.infoComponent.hasMoreReceipts.set(false);
      this.infoComponent.isLoading.set(false);
      this.infoComponent.hasError.set(false);
    });
  }
}

// ============================================
// Full-screen centered wrapper style
// ============================================

const fullScreenCenterStyle = `
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  min-height: 500px;
  box-sizing: border-box;
  padding: 16px;
`;

const cardStyle = `
  border: 1px solid var(--cometchat-border-color-light, #e0e0e0);
  border-radius: var(--cometchat-radius-3, 12px);
  overflow: hidden;
  width: 400px;
  height: 500px;
  background: var(--cometchat-background-color-01, #fff);
`;

// ============================================
// Meta Configuration
// ============================================

type StoryArgs = Omit<CometChatMessageInformationComponent, 'closeClick'> & {
  mockReceipts?: UserReceiptInfo[];
  closeClick?: (event: void) => void;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Messages/Message Information',
  component: CometChatMessageInformationComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatMessageInformationStoryWrapperComponent],
    }),
  ],
  args: {
    message: createMockMessage('text', {
      id: 100,
      text: 'Hello! This is a sample message.',
      sentAt: Date.now() / 1000 - 3600,
    }),
  },
  argTypes: {
    message: {
      control: false,
      description:
        'The CometChat message object to display information for, including delivery and read receipts',
      table: { type: { summary: 'CometChat.BaseMessage' } },
    },
    dateTimeFormat: {
      control: false,
      description: 'Custom date/time format object for receipt timestamps',
      table: { type: { summary: 'CalendarObject' }, defaultValue: { summary: 'undefined' } },
    },
    textFormatters: {
      control: false,
      description: 'Text formatters for processing message text content in the message bubble preview',
      table: { type: { summary: 'CometChatTextFormatter[]' }, defaultValue: { summary: '[]' } },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the panel close button is clicked',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatMessageInformation displays detailed message information including a message bubble preview, sent timestamp, and delivery/read receipt sections. For 1-on-1 chats it shows timestamps; for group chats it lists individual user receipts with avatars and names.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// ============================================
// Stories
// ============================================

/** Default 1v1 message information panel with read and delivered timestamps. */
export const Default: Story = {
  args: {
    message: createMockMessage('text', {
      id: 200,
      text: 'Hello! This is a test message for the information panel.',
      sentAt: Date.now() / 1000 - 3600,
      deliveredAt: Date.now() / 1000 - 3000,
      readAt: Date.now() / 1000 - 1800,
    }),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-information-story-wrapper
            [message]="message"
            [mockReceipts]="mockReceipts || []"
            [dateTimeFormat]="dateTimeFormat"
            [textFormatters]="textFormatters || []"
            (closeClick)="closeClick($event)">
          </cometchat-message-information-story-wrapper>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Default 1v1 message information panel showing a text message with read and delivered timestamps.',
      },
    },
  },
};

/** 1v1 message with both read and delivery receipts. */
export const OneOnOneWithReceipts: Story = {
  args: {
    message: createMockMessage('text', {
      id: 201,
      text: 'This message has been read by the recipient.',
      sentAt: Date.now() / 1000 - 7200,
      deliveredAt: Date.now() / 1000 - 6000,
      readAt: Date.now() / 1000 - 3600,
      sender: createMockUser({ uid: 'sender-1', name: 'Alice' }),
    }),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-information-story-wrapper
            [message]="message"
            [mockReceipts]="mockReceipts || []"
            [dateTimeFormat]="dateTimeFormat"
            [textFormatters]="textFormatters || []"
            (closeClick)="closeClick($event)">
          </cometchat-message-information-story-wrapper>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '1v1 message information panel with both delivery and read receipts showing timestamps.',
      },
    },
  },
};

/** 1v1 message with only delivery receipt (not yet read). */
export const OneOnOneDeliveredOnly: Story = {
  args: {
    message: createMockMessage('text', {
      id: 202,
      text: 'This message was delivered but not read yet.',
      sentAt: Date.now() / 1000 - 7200,
      deliveredAt: Date.now() / 1000 - 6000,
      sender: createMockUser({ uid: 'sender-1', name: 'Bob' }),
    }),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-information-story-wrapper
            [message]="message"
            [mockReceipts]="mockReceipts || []"
            [dateTimeFormat]="dateTimeFormat"
            [textFormatters]="textFormatters || []"
            (closeClick)="closeClick($event)">
          </cometchat-message-information-story-wrapper>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '1v1 message that has been delivered but not yet read. Shows delivered timestamp and dash for read.',
      },
    },
  },
};

/** Group message information with user avatars and receipts. */
export const GroupMessageWithReceipts: Story = {
  args: {
    message: createGroupMessage({
      id: 300,
      text: 'Hello team! This is a group message with receipts.',
    }),
    mockReceipts: createMockUserReceipts(),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-information-story-wrapper
            [message]="message"
            [mockReceipts]="mockReceipts || []"
            [dateTimeFormat]="dateTimeFormat"
            [textFormatters]="textFormatters || []"
            (closeClick)="closeClick($event)">
          </cometchat-message-information-story-wrapper>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Group message information panel showing user avatars, names, and both read/delivered timestamps for each member.',
      },
    },
  },
};

/** Group message with no receipts yet. */
export const GroupMessageNoReceipts: Story = {
  args: {
    message: createGroupMessage({
      id: 301,
      text: 'This group message has no receipts yet.',
    }),
    mockReceipts: [],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-information-story-wrapper
            [message]="message"
            [mockReceipts]="mockReceipts || []"
            [dateTimeFormat]="dateTimeFormat"
            [textFormatters]="textFormatters || []"
            (closeClick)="closeClick($event)">
          </cometchat-message-information-story-wrapper>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Group message information panel when no members have received or read the message yet.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders message information container */
export const TestDefaultRendersInfo: Story = {
  args: {
    message: createMockMessage('text', {
      id: 200,
      text: 'Hello! This is a test message for the information panel.',
      sentAt: Date.now() / 1000 - 3600,
      deliveredAt: Date.now() / 1000 - 3000,
      readAt: Date.now() / 1000 - 1800,
    }),
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${fullScreenCenterStyle}">
        <div style="${cardStyle}">
          <cometchat-message-information-story-wrapper
            [message]="message"
            [mockReceipts]="mockReceipts || []"
            [textFormatters]="textFormatters || []">
          </cometchat-message-information-story-wrapper>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-message-information');
    expect(container).not.toBeNull();
  },
};
