/**
 * CometChatMediaRecorder Storybook Stories
 *
 * Interactive stories demonstrating the media recorder component variants:
 * - Default recorder (manual start)
 * - Idle state (awaiting user action)
 * - Recording state (auto-start)
 * - All variants showcase
 *
 * @module components/cometchat-media-recorder
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatMediaRecorderComponent } from './cometchat-media-recorder.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatMediaRecorderComponent> = {
  title: 'Base Elements/Media Recorder',
  component: CometChatMediaRecorderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    autoRecording: false,
  },
  argTypes: {
    autoRecording: {
      control: 'boolean',
      description:
        'When true, recording starts automatically on component mount. Requires microphone permissions.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    closeRecording: {
      action: 'closeRecording',
      description: 'Emitted when the user cancels or closes the recorder',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    submitRecording: {
      action: 'submitRecording',
      description: 'Emitted when the user submits a completed recording — emits the audio Blob',
      table: {
        type: { summary: 'EventEmitter<Blob>' },
        category: 'Events',
      },
    },
    recordingError: {
      action: 'recordingError',
      description:
        'Emitted when a recording error occurs (e.g., permission denied, device unavailable)',
      table: {
        type: { summary: 'EventEmitter<Error>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatMediaRecorder is an audio recording component with microphone permission handling, real-time waveform visualization, pause/resume support, and preview playback. It provides full keyboard accessibility — Space/Enter to control recording, Escape to cancel.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatMediaRecorderComponent>;

// ============================================
// Stories
// ============================================

/** Default media recorder in idle state with manual start. */
export const Default: Story = {
  args: {
    autoRecording: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default media recorder rendered in idle state. The user must click the record button to begin. Microphone permissions are requested on first interaction.',
      },
    },
  },
};

/** Media recorder in idle state awaiting user action. */
export const Idle: Story = {
  args: {
    autoRecording: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Media recorder in the idle state before any recording has started. Shows the initial UI with the record button ready for user interaction.',
      },
    },
  },
};

/** Media recorder with auto-start recording enabled. */
export const Recording: Story = {
  args: {
    autoRecording: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Media recorder with auto-recording enabled. Recording begins immediately on mount, requesting microphone permissions if not already granted.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all media recorder variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-media-recorder-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-media-recorder-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Media Recorder Variants
        </h3>

        <!-- Idle State -->
        <div class="cometchat-media-recorder-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-media-recorder-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Idle State (Manual Start)
          </p>
          <div class="cometchat-media-recorder-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-media-recorder [autoRecording]="false"></cometchat-media-recorder>
          </div>
        </div>

        <!-- Auto-Recording State -->
        <div class="cometchat-media-recorder-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-media-recorder-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Auto-Recording (Starts Immediately)
          </p>
          <div class="cometchat-media-recorder-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-media-recorder [autoRecording]="true"></cometchat-media-recorder>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all media recorder variants — idle and auto-recording — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
