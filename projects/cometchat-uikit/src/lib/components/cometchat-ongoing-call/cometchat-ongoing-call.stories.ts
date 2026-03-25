/**
 * CometChatOngoingCall Storybook Stories
 *
 * Interactive stories demonstrating the ongoing call screen container:
 * - Default with a mock session ID (default calling workflow)
 * - Active call state with direct calling workflow
 * - All variants showcase
 *
 * Note: The actual call UI is rendered by the CometChat Calls SDK into the
 * container div. In Storybook, the mock service prevents SDK calls, so the
 * container renders as an empty full-screen overlay.
 *
 * @module components/cometchat-ongoing-call
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';

import { CometChatOngoingCallComponent } from './cometchat-ongoing-call.component';
import { OngoingCallService } from '../../services/ongoing-call.service';
import { CallAnnouncerService } from '../../services/call-announcer.service';
import { CallWorkflow } from '../../Enums/Enums';
import { mockCallAnnouncer } from '../../../../../../.storybook/utils/mock-services';

// ============================================
// Mock Helpers
// ============================================

/**
 * Mock OngoingCallService that provides no-op implementations
 * so the component can render in Storybook without the Calls SDK.
 */
class MockOngoingCallService {
  setSessionID(_id: string): void {}
  setCallWorkflow(_workflow: CallWorkflow): void {}
  setCallSettingsBuilder(_builder: any): void {}
  async startCall(_frame: HTMLElement, _onError?: Function): Promise<void> {}
  endSession(): void {}
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatOngoingCallComponent> = {
  title: 'Components/Calls/CometChat Ongoing Call',
  component: CometChatOngoingCallComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
      providers: [
        { provide: OngoingCallService, useClass: MockOngoingCallService },
        { provide: CallAnnouncerService, useValue: mockCallAnnouncer },
      ],
    }),
  ],
  args: {
    sessionID: 'mock-session-12345',
    callWorkflow: CallWorkflow.defaultCalling,
  },
  argTypes: {
    sessionID: {
      control: 'text',
      description: 'Session ID for the call. Required for the call container to render.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Inputs',
      },
    },
    callWorkflow: {
      control: 'select',
      options: [CallWorkflow.defaultCalling, CallWorkflow.directCalling],
      description: 'Call workflow type: defaultCalling or directCalling.',
      table: {
        type: { summary: 'CallWorkflow' },
        defaultValue: { summary: 'CallWorkflow.defaultCalling' },
        category: 'Inputs',
      },
    },
    callSettingsBuilder: {
      control: false,
      description: 'Custom call settings builder. Overrides the default builder when provided.',
      table: {
        type: { summary: 'any' },
        defaultValue: { summary: 'null' },
        category: 'Inputs',
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
    callScreenView: {
      control: false,
      description: 'Custom template to replace the entire call screen container.',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    callEnded: {
      action: 'callEnded',
      description: 'Emitted when the call ends.',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
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
          'CometChatOngoingCall renders a full-screen container into which the CometChat Calls SDK renders its call UI. When a non-empty sessionID is provided, the component displays the call screen overlay. Supports custom call settings and a template override for the entire call screen. In Storybook, the mock service prevents actual SDK calls, so the container renders as an empty overlay.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatOngoingCallComponent>;

// ============================================
// Stories
// ============================================

/** Default ongoing call with a mock session ID using the default calling workflow. */
export const Default: Story = {
  args: {
    sessionID: 'mock-session-12345',
    callWorkflow: CallWorkflow.defaultCalling,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default ongoing call screen with a mock session ID using the default calling workflow. The Calls SDK UI is not rendered in Storybook — only the container overlay is visible.',
      },
    },
  },
};

/** Active call state using the direct calling workflow with a different session. */
export const ActiveCallState: Story = {
  args: {
    sessionID: 'direct-session-67890',
    callWorkflow: CallWorkflow.directCalling,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Active call state using the direct calling workflow. Demonstrates the component with a different session ID and the directCalling workflow type.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all ongoing call variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-ongoing-call-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-ongoing-call-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Ongoing Call Variants
        </h3>

        <!-- Default Calling Workflow -->
        <div class="cometchat-ongoing-call-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-ongoing-call-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default Calling Workflow
          </p>
          <div class="cometchat-ongoing-call-showcase__frame" style="position: relative; height: var(--cometchat-spacing-13, 200px); border: var(--cometchat-border-width-light, 1px) solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-ongoing-call
              [sessionID]="defaultSession"
              [callWorkflow]="defaultWorkflow">
            </cometchat-ongoing-call>
          </div>
        </div>

        <!-- Direct Calling Workflow -->
        <div class="cometchat-ongoing-call-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-ongoing-call-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Direct Calling Workflow
          </p>
          <div class="cometchat-ongoing-call-showcase__frame" style="position: relative; height: var(--cometchat-spacing-13, 200px); border: var(--cometchat-border-width-light, 1px) solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-ongoing-call
              [sessionID]="directSession"
              [callWorkflow]="directWorkflow">
            </cometchat-ongoing-call>
          </div>
        </div>

      </div>
    `,
    props: {
      defaultSession: 'mock-session-12345',
      directSession: 'direct-session-67890',
      defaultWorkflow: CallWorkflow.defaultCalling,
      directWorkflow: CallWorkflow.directCalling,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all ongoing call variants — default calling workflow and direct calling workflow — in a single view. Each variant is rendered in a bounded frame to prevent full-screen takeover. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
