/**
 * CometChatIncomingCall Storybook Stories
 *
 * Interactive stories demonstrating incoming call notification variants:
 * - Default incoming audio call
 * - Incoming call display with video call type
 * - All variants showcase
 *
 * @module components/cometchat-incoming-call
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatIncomingCallComponent } from './cometchat-incoming-call.component';
import { IncomingCallService } from '../../services/incoming-call.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { DialogFocusManager } from '../../services/dialog-focus-manager.service';
import { createMockCall, createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import {
  mockCallAnnouncer,
  MockDialogFocusManager,
} from '../../../../../../.storybook/utils/mock-services';

// ============================================
// Mock Helpers
// ============================================

/**
 * Mock IncomingCallService that provides no-op implementations
 * so the component can render in Storybook without SDK initialization.
 */
class MockIncomingCallService {
  incomingCall = () => null;
  setDisableSoundForCalls(_v: boolean): void {}
  setCustomSoundForCalls(_v: string): void {}
  playIncomingSound(): void {}
  stopIncomingSound(): void {}
  async acceptCall(_sessionId: string): Promise<void> {}
  async declineCall(_sessionId: string): Promise<void> {}
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatIncomingCallComponent> = {
  title: 'Components/Calls/CometChat Incoming Call',
  component: CometChatIncomingCallComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
      providers: [
        { provide: IncomingCallService, useClass: MockIncomingCallService },
        { provide: CallAnnouncerService, useValue: mockCallAnnouncer },
        { provide: DialogFocusManager, useClass: MockDialogFocusManager },
      ],
    }),
  ],
  args: {
    call: createMockCall({
      type: CometChat.CALL_TYPE.AUDIO,
      status: 'initiated',
      callInitiator: createMockUser({ uid: 'caller-1', name: 'Alice Johnson', avatar: MOCK_AVATARS.nancyGrace }),
      callReceiver: createMockUser({ uid: 'me', name: 'Me' }),
    }),
    disableSoundForCalls: true,
  },
  argTypes: {
    call: {
      control: false,
      description: 'The incoming call object. Overrides service state when provided.',
      table: {
        type: { summary: 'CometChat.Call | null' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    disableSoundForCalls: {
      control: 'boolean',
      description: 'Disables the incoming call ringtone when true.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Sound',
      },
    },
    customSoundForCalls: {
      control: 'text',
      description: 'Custom sound URL for the incoming call ringtone.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Sound',
      },
    },
    onAccept: {
      control: false,
      description: 'Custom accept handler. Overrides default SDK CometChat.acceptCall().',
      table: {
        type: { summary: '((call: Call) => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    onDecline: {
      control: false,
      description: 'Custom decline handler. Overrides default SDK CometChat.rejectCall().',
      table: {
        type: { summary: '((call: Call) => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    onError: {
      control: false,
      description: 'Error callback invoked for any error during sound, accept, or decline.',
      table: {
        type: { summary: '((error: CometChatException) => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    itemView: {
      control: false,
      description: 'Replaces the entire ListItem with a custom template.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    titleView: {
      control: false,
      description: 'Replaces the default caller name title in the ListItem.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    subtitleView: {
      control: false,
      description: 'Replaces the default call type icon and "Incoming Call" subtitle.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    leadingView: {
      control: false,
      description: 'Custom template for the leading position of the ListItem.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    trailingView: {
      control: false,
      description: 'Replaces the default caller avatar in the trailing position.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    acceptButtonView: {
      control: false,
      description: 'Replaces the default Accept button with a custom template.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    declineButtonView: {
      control: false,
      description: 'Replaces the default Decline button with a custom template.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    callAccepted: {
      action: 'callAccepted',
      description: 'Emitted when the user accepts the incoming call.',
      table: {
        type: { summary: 'EventEmitter<CometChat.Call>' },
        category: 'Events',
      },
    },
    callDeclined: {
      action: 'callDeclined',
      description: 'Emitted when the user declines the incoming call.',
      table: {
        type: { summary: 'EventEmitter<CometChat.Call>' },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted on any error during sound playback, accept, or decline.',
      table: {
        type: { summary: 'EventEmitter<CometChatException>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "CometChatIncomingCall displays an incoming call notification card with the caller's name, avatar, call type icon, and Accept/Decline buttons. Supports custom templates for all UI sections and both audio and video call types.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatIncomingCallComponent>;

// ============================================
// Stories
// ============================================

/** Default incoming call notification showing an audio call with caller details. */
export const Default: Story = {
  render: (args) => ({
    props: { ...args, noOp: () => {} },
    template: `
      <div style="position: relative; width: 400px; height: 200px;">
        <cometchat-incoming-call
          [call]="call"
          [disableSoundForCalls]="disableSoundForCalls"
          [onAccept]="noOp"
          [onDecline]="noOp">
        </cometchat-incoming-call>
      </div>
    `,
  }),
  args: {
    call: createMockCall({
      type: CometChat.CALL_TYPE.AUDIO,
      status: 'initiated',
      callInitiator: createMockUser({
        uid: 'caller-audio',
        name: 'Alice Johnson',
        avatar: MOCK_AVATARS.nancyGrace,
      }),
      callReceiver: createMockUser({ uid: 'me', name: 'Me' }),
    }),
    disableSoundForCalls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default incoming call notification for an audio call. Displays the caller name, avatar, call type icon, and Accept/Decline buttons.',
      },
    },
  },
};

/** Incoming video call notification with caller details. */
export const IncomingCallDisplay: Story = {
  render: (args) => ({
    props: { ...args, noOp: () => {} },
    template: `
      <div style="position: relative; width: 400px; height: 200px;">
        <cometchat-incoming-call
          [call]="call"
          [disableSoundForCalls]="disableSoundForCalls"
          [onAccept]="noOp"
          [onDecline]="noOp">
        </cometchat-incoming-call>
      </div>
    `,
  }),
  args: {
    call: createMockCall({
      type: CometChat.CALL_TYPE.VIDEO,
      status: 'initiated',
      callInitiator: createMockUser({
        uid: 'caller-video',
        name: 'Bob Smith',
      }),
      callReceiver: createMockUser({ uid: 'me', name: 'Me' }),
    }),
    disableSoundForCalls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Incoming video call notification showing the caller name, avatar, and video call type icon.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all incoming call variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-incoming-call-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-incoming-call-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Incoming Call Variants
        </h3>

        <!-- Audio Call -->
        <div class="cometchat-incoming-call-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-incoming-call-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Audio Call
          </p>
          <div style="position: relative; width: 400px; height: 200px;">
            <cometchat-incoming-call
              [call]="audioCall"
              [disableSoundForCalls]="true"
              [onAccept]="noOp"
              [onDecline]="noOp">
            </cometchat-incoming-call>
          </div>
        </div>

        <!-- Video Call -->
        <div class="cometchat-incoming-call-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-incoming-call-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Video Call
          </p>
          <div style="position: relative; width: 400px; height: 200px;">
            <cometchat-incoming-call
              [call]="videoCall"
              [disableSoundForCalls]="true"
              [onAccept]="noOp"
              [onDecline]="noOp">
            </cometchat-incoming-call>
          </div>
        </div>

      </div>
    `,
    props: {
      audioCall: createMockCall({
        type: CometChat.CALL_TYPE.AUDIO,
        status: 'initiated',
        callInitiator: createMockUser({
          uid: 'caller-audio',
          name: 'Alice Johnson',
          avatar: MOCK_AVATARS.nancyGrace,
        }),
        callReceiver: createMockUser({ uid: 'me', name: 'Me' }),
      }),
      videoCall: createMockCall({
        type: CometChat.CALL_TYPE.VIDEO,
        status: 'initiated',
        callInitiator: createMockUser({
          uid: 'caller-video',
          name: 'Bob Smith',
        }),
        callReceiver: createMockUser({ uid: 'me', name: 'Me' }),
      }),
      noOp: () => {},
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all incoming call variants — audio call and video call — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
