/**
 * CometChatOutgoingCall Storybook Stories
 *
 * Interactive stories demonstrating outgoing call overlay variants:
 * - Default outgoing audio call
 * - Outgoing call display with video call type
 * - All variants showcase
 *
 * @module components/cometchat-outgoing-call
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatOutgoingCallComponent } from './cometchat-outgoing-call.component';
import { OutgoingCallService } from '../../services/outgoing-call.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { DialogFocusManager } from '../../services/dialog-focus-manager.service';
import { createMockCall, createMockUser, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';
import {
  mockCallAnnouncer,
  MockDialogFocusManager,
} from '../../../../../../.storybook/utils/mock-services';

// ============================================
// Mock Helpers
// ============================================

/**
 * Mock OutgoingCallService that provides no-op implementations
 * so the component can render in Storybook without SDK initialization.
 */
class MockOutgoingCallService {
  activeCall = () => null;
  setDisableSoundForCalls(_v: boolean): void {}
  setCustomSoundForCalls(_v: string): void {}
  playOutgoingSound(): void {}
  stopOutgoingSound(): void {}
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatOutgoingCallComponent> = {
  title: 'Components/Calls/CometChat Outgoing Call',
  component: CometChatOutgoingCallComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
      providers: [
        { provide: OutgoingCallService, useClass: MockOutgoingCallService },
        { provide: CallAnnouncerService, useValue: mockCallAnnouncer },
        { provide: DialogFocusManager, useClass: MockDialogFocusManager },
      ],
    }),
  ],
  args: {
    call: createMockCall({
      type: CometChat.CALL_TYPE.AUDIO,
      status: 'initiated',
      callInitiator: createMockUser({ uid: 'me', name: 'Me' }),
      callReceiver: createMockUser({ uid: 'receiver-1', name: 'Alice Johnson', avatar: MOCK_AVATARS.nancyGrace }),
    }),
    disableSoundForCalls: true,
  },
  argTypes: {
    call: {
      control: false,
      description: 'The outgoing call object. Overrides service state when provided.',
      table: {
        type: { summary: 'CometChat.Call | null' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    disableSoundForCalls: {
      control: 'boolean',
      description: 'Disables the outgoing call ringtone when true.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Sound',
      },
    },
    customSoundForCalls: {
      control: 'text',
      description: 'Custom sound URL for the outgoing call ringtone.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Sound',
      },
    },
    onError: {
      control: false,
      description: 'Error callback invoked for any error during sound or cancel.',
      table: {
        type: { summary: '((error: CometChatException) => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    titleView: {
      control: false,
      description: 'Replaces the default receiver name title.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    subtitleView: {
      control: false,
      description: 'Replaces the default "Calling..." subtitle.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    avatarView: {
      control: false,
      description: 'Replaces the default CometChatAvatar.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    cancelButtonView: {
      control: false,
      description: 'Replaces the default cancel button.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    callCanceled: {
      action: 'callCanceled',
      description: 'Emitted when the user cancels the outgoing call.',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted on any error during sound playback or cancellation.',
      table: {
        type: { summary: 'EventEmitter<CometChatException>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatOutgoingCall displays an outgoing call overlay with the receiver\'s name, avatar, a "Calling..." subtitle, and a cancel button. Supports custom templates for title, subtitle, avatar, and cancel button sections.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatOutgoingCallComponent>;

// ============================================
// Stories
// ============================================

/** Default outgoing call overlay showing an audio call with receiver details. */
export const Default: Story = {
  args: {
    call: createMockCall({
      type: CometChat.CALL_TYPE.AUDIO,
      status: 'initiated',
      callInitiator: createMockUser({ uid: 'me', name: 'Me' }),
      callReceiver: createMockUser({
        uid: 'receiver-audio',
        name: 'Alice Johnson',
        avatar: MOCK_AVATARS.nancyGrace,
      }),
    }),
    disableSoundForCalls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default outgoing call overlay for an audio call. Displays the receiver name, avatar, "Calling..." subtitle, and a cancel button. Sound is disabled for Storybook.',
      },
    },
  },
};

/** Outgoing video call overlay with receiver details. */
export const OutgoingCallDisplay: Story = {
  args: {
    call: createMockCall({
      type: CometChat.CALL_TYPE.VIDEO,
      status: 'initiated',
      callInitiator: createMockUser({ uid: 'me', name: 'Me' }),
      callReceiver: createMockUser({
        uid: 'receiver-video',
        name: 'Bob Smith',
      }),
    }),
    disableSoundForCalls: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Outgoing video call overlay showing the receiver name, avatar, and "Calling..." subtitle. Demonstrates the component with a video call type.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all outgoing call variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-outgoing-call-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-outgoing-call-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Outgoing Call Variants
        </h3>

        <!-- Audio Call -->
        <div class="cometchat-outgoing-call-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-outgoing-call-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Audio Call
          </p>
          <cometchat-outgoing-call
            [call]="audioCall"
            [disableSoundForCalls]="true">
          </cometchat-outgoing-call>
        </div>

        <!-- Video Call -->
        <div class="cometchat-outgoing-call-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-outgoing-call-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Video Call
          </p>
          <cometchat-outgoing-call
            [call]="videoCall"
            [disableSoundForCalls]="true">
          </cometchat-outgoing-call>
        </div>

      </div>
    `,
    props: {
      audioCall: createMockCall({
        type: CometChat.CALL_TYPE.AUDIO,
        status: 'initiated',
        callInitiator: createMockUser({ uid: 'me', name: 'Me' }),
        callReceiver: createMockUser({
          uid: 'receiver-audio',
          name: 'Alice Johnson',
          avatar: MOCK_AVATARS.nancyGrace,
        }),
      }),
      videoCall: createMockCall({
        type: CometChat.CALL_TYPE.VIDEO,
        status: 'initiated',
        callInitiator: createMockUser({ uid: 'me', name: 'Me' }),
        callReceiver: createMockUser({
          uid: 'receiver-video',
          name: 'Bob Smith',
        }),
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all outgoing call variants — audio call and video call — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders outgoing call container */
export const TestDefaultRendersOutgoingCall: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-outgoing-call');
    expect(container).not.toBeNull();
  },
};
