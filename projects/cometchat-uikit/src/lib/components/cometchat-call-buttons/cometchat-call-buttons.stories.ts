/**
 * CometChatCallButtons Storybook Stories
 *
 * Interactive stories demonstrating call button component variants:
 * - Default with both voice and video call buttons
 * - Audio-only (video call button hidden)
 * - Video-only (voice call button hidden)
 * - Both buttons enabled for a group target
 * - All variants showcase
 *
 * @module components/cometchat-call-buttons
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';

import { CometChatCallButtonsComponent } from './cometchat-call-buttons.component';
import { CallButtonsService } from '../../services/call-buttons.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { createMockUser, createMockGroup } from '../../../../../../.storybook/utils/mock-data';
import {
  MockCallService,
  mockCallAnnouncer,
} from '../../../../../../.storybook/utils/mock-services';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatCallButtonsComponent> = {
  title: 'Components/Calls/CometChat Call Buttons',
  component: CometChatCallButtonsComponent,
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
    user: createMockUser({ uid: 'user-alice', name: 'Alice Johnson' }),
    group: null,
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
  },
  argTypes: {
    user: {
      control: false,
      description: 'The user to call. Mutually exclusive with `group`.',
      table: {
        type: { summary: 'CometChat.User | null' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    group: {
      control: false,
      description: 'The group to call. Mutually exclusive with `user`.',
      table: {
        type: { summary: 'CometChat.Group | null' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
      },
    },
    hideVoiceCallButton: {
      control: 'boolean',
      description: 'Hides the voice call button when true.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    hideVideoCallButton: {
      control: 'boolean',
      description: 'Hides the video call button when true.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    outgoingCallDisableSoundForCalls: {
      control: 'boolean',
      description: 'Disables sound for the outgoing call overlay.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Sound',
      },
    },
    outgoingCallCustomSoundForCalls: {
      control: 'text',
      description: 'Custom sound URL for the outgoing call overlay.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Sound',
      },
    },
    onVoiceCallClick: {
      control: false,
      description: 'Custom voice call click handler. Overrides default call initiation.',
      table: {
        type: { summary: '(() => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    onVideoCallClick: {
      control: false,
      description: 'Custom video call click handler. Overrides default call initiation.',
      table: {
        type: { summary: '(() => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    onError: {
      control: false,
      description: 'Error callback invoked for any error during call operations.',
      table: {
        type: { summary: '((error: CometChatException) => void) | null' },
        defaultValue: { summary: 'null' },
        category: 'Callbacks',
      },
    },
    voiceCallButtonView: {
      control: false,
      description: 'Replaces the default voice call button with a custom template.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    videoCallButtonView: {
      control: false,
      description: 'Replaces the default video call button with a custom template.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted on any error during call operations.',
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
          'CometChatCallButtons provides voice and video call initiation buttons for user-to-user and group calls. Supports hiding individual buttons, custom click handlers, template overrides for button views, and outgoing/ongoing call overlays.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatCallButtonsComponent>;

// ============================================
// Stories
// ============================================

/** Default call buttons showing both voice and video call buttons for a user target. */
export const Default: Story = {
  args: {
    user: createMockUser({ uid: 'user-alice', name: 'Alice Johnson' }),
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default call buttons with both voice and video call buttons visible for a user target. This is the most common usage.',
      },
    },
  },
};

/** Audio-only variant with the video call button hidden. */
export const AudioOnly: Story = {
  args: {
    user: createMockUser({ uid: 'user-bob', name: 'Bob Smith' }),
    hideVoiceCallButton: false,
    hideVideoCallButton: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only the voice call button is visible. The video call button is hidden via hideVideoCallButton. Useful for audio-only calling scenarios.',
      },
    },
  },
};

/** Video-only variant with the voice call button hidden. */
export const VideoOnly: Story = {
  args: {
    user: createMockUser({ uid: 'user-charlie', name: 'Charlie Brown' }),
    hideVoiceCallButton: true,
    hideVideoCallButton: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only the video call button is visible. The voice call button is hidden via hideVoiceCallButton. Useful for video-first calling scenarios.',
      },
    },
  },
};

/** Both buttons enabled for a group target. */
export const BothEnabled: Story = {
  args: {
    user: null,
    group: createMockGroup({ guid: 'group-team', name: 'Design Team' }),
    hideVoiceCallButton: false,
    hideVideoCallButton: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Both voice and video call buttons enabled for a group target. Demonstrates group calling where the component initiates a group call session.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all call button variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-call-buttons-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-call-buttons-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Call Buttons Variants
        </h3>

        <!-- Default (Both Buttons) -->
        <div class="cometchat-call-buttons-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-buttons-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default — Both Buttons (User)
          </p>
          <cometchat-call-buttons [user]="userAlice" [hideVoiceCallButton]="false" [hideVideoCallButton]="false"></cometchat-call-buttons>
        </div>

        <!-- Audio Only -->
        <div class="cometchat-call-buttons-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-buttons-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Audio Only
          </p>
          <cometchat-call-buttons [user]="userBob" [hideVoiceCallButton]="false" [hideVideoCallButton]="true"></cometchat-call-buttons>
        </div>

        <!-- Video Only -->
        <div class="cometchat-call-buttons-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-buttons-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Video Only
          </p>
          <cometchat-call-buttons [user]="userCharlie" [hideVoiceCallButton]="true" [hideVideoCallButton]="false"></cometchat-call-buttons>
        </div>

        <!-- Group Target -->
        <div class="cometchat-call-buttons-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-call-buttons-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Both Buttons — Group Target
          </p>
          <cometchat-call-buttons [group]="groupTeam" [hideVoiceCallButton]="false" [hideVideoCallButton]="false"></cometchat-call-buttons>
        </div>

      </div>
    `,
    props: {
      userAlice: createMockUser({ uid: 'user-alice', name: 'Alice Johnson' }),
      userBob: createMockUser({ uid: 'user-bob', name: 'Bob Smith' }),
      userCharlie: createMockUser({ uid: 'user-charlie', name: 'Charlie Brown' }),
      groupTeam: createMockGroup({ guid: 'group-team', name: 'Design Team' }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all call button variants — default with both buttons, audio-only, video-only, and group target — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
