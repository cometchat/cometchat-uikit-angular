/**
 * CometChatErrorBoundary Storybook Stories
 *
 * Interactive stories demonstrating the error boundary component variants:
 * - Default state (no error, child content rendered)
 * - Error state with fallback UI
 * - All variants showcase
 *
 * @module components/cometchat-error-boundary
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatErrorBoundaryComponent } from './cometchat-error-boundary.component';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatErrorBoundaryComponent> = {
  title: 'Components/Misc/Error Boundary',
  component: CometChatErrorBoundaryComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    componentName: 'Unknown',
  },
  argTypes: {
    componentName: {
      control: 'text',
      description:
        'Name identifying the wrapped component, included in the ErrorContext when an error is caught',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "'Unknown'" },
      },
    },
    fallbackView: {
      control: false,
      description:
        'Optional custom fallback template rendered when an error occurs. Receives ErrorContext as implicit context',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: ErrorContext }>' },
        defaultValue: { summary: 'undefined' },
      },
    },
    error: {
      action: 'error',
      description:
        'Emits an ErrorContext object when an error is caught, containing the error, component name, and timestamp',
      table: {
        type: { summary: 'EventEmitter<ErrorContext>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatErrorBoundary wraps child content and renders a fallback UI when an error is reported. Supports custom fallback templates via ng-template, a retry button to reset the error state, and emits structured ErrorContext events for error tracking.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatErrorBoundaryComponent>;

// ============================================
// Stories
// ============================================

/** Default error boundary with no error — child content is rendered normally. */
export const Default: Story = {
  args: {
    componentName: 'SampleComponent',
  },
  render: args => ({
    props: args,
    template: `
      <cometchat-error-boundary [componentName]="componentName">
        <div style="padding: var(--cometchat-padding-4); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">
          Child content rendered successfully.
        </div>
      </cometchat-error-boundary>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default state with no error. The error boundary renders its projected child content normally. The fallback UI is hidden until an error is reported via handleError().',
      },
    },
  },
};

/** Error boundary in error state showing the default fallback UI with retry button. */
export const ErrorStateDisplay: Story = {
  args: {
    componentName: 'MessageBubble',
  },
  render: args => ({
    props: {
      ...args,
      triggerError(boundary: CometChatErrorBoundaryComponent) {
        boundary.handleError(new Error('Failed to render message bubble'));
      },
    },
    template: `
      <cometchat-error-boundary
        #boundary
        [componentName]="componentName"
      >
        <div style="padding: var(--cometchat-padding-4); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">
          Child content — click the button below to simulate an error.
        </div>
      </cometchat-error-boundary>
      <div style="margin-top: var(--cometchat-spacing-3);">
        <button
          (click)="triggerError(boundary)"
          style="font: var(--cometchat-font-button-medium); color: var(--cometchat-primary-button-text-color); background: var(--cometchat-error-color); border: none; border-radius: var(--cometchat-radius-2); padding: var(--cometchat-padding-2) var(--cometchat-padding-4); cursor: pointer;"
        >
          Simulate Error
        </button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the error state fallback UI. Click "Simulate Error" to trigger handleError(), which replaces child content with the default fallback message and retry button.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all error boundary variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-error-boundary-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-error-boundary-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Error Boundary Variants
        </h3>

        <!-- Normal State -->
        <div class="cometchat-error-boundary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-error-boundary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Normal State (No Error)
          </p>
          <cometchat-error-boundary componentName="SampleComponent">
            <div style="padding: var(--cometchat-padding-3); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary); background: var(--cometchat-background-color-02); border-radius: var(--cometchat-radius-2);">
              Child content rendered successfully.
            </div>
          </cometchat-error-boundary>
        </div>

        <!-- Error State (Default Fallback) -->
        <div class="cometchat-error-boundary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-error-boundary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State (Default Fallback)
          </p>
          <cometchat-error-boundary #errorBoundary componentName="MessageBubble">
            <div style="padding: var(--cometchat-padding-3); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary);">
              This content will be replaced when error is triggered.
            </div>
          </cometchat-error-boundary>
          <button
            (click)="triggerError(errorBoundary)"
            style="align-self: flex-start; font: var(--cometchat-font-button-medium); color: var(--cometchat-primary-button-text-color); background: var(--cometchat-error-color); border: none; border-radius: var(--cometchat-radius-2); padding: var(--cometchat-padding-2) var(--cometchat-padding-4); cursor: pointer;"
          >
            Simulate Error
          </button>
        </div>

        <!-- Interactive Demo -->
        <div class="cometchat-error-boundary-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-error-boundary-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Interactive Demo (Trigger &amp; Retry)
          </p>
          <cometchat-error-boundary #demoBoundary componentName="InteractiveWidget">
            <div style="padding: var(--cometchat-padding-3); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-primary); background: var(--cometchat-background-color-02); border-radius: var(--cometchat-radius-2);">
              Interactive widget content. Trigger an error, then use the Retry button to recover.
            </div>
          </cometchat-error-boundary>
          <button
            (click)="triggerError(demoBoundary)"
            style="align-self: flex-start; font: var(--cometchat-font-button-medium); color: var(--cometchat-primary-button-text-color); background: var(--cometchat-error-color); border: none; border-radius: var(--cometchat-radius-2); padding: var(--cometchat-padding-2) var(--cometchat-padding-4); cursor: pointer;"
          >
            Simulate Error
          </button>
        </div>

      </div>
    `,
    props: {
      triggerError(boundary: CometChatErrorBoundaryComponent) {
        boundary.handleError(new Error('Simulated error for showcase'));
      },
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all error boundary variants — normal state with child content, error state with default fallback, and an interactive demo for triggering and recovering from errors. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
