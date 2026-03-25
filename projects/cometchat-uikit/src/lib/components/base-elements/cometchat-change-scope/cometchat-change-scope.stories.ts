/**
 * CometChatChangeScope Storybook Stories
 *
 * Interactive stories demonstrating the change scope component variants:
 * - Default change scope dialog with group roles
 * - Available scope options with different selections
 * - All variants showcase
 *
 * @module components/cometchat-change-scope
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatChangeScopeComponent } from './cometchat-change-scope.component';
import { CometChatRadioButtonComponent } from '../cometchat-radio-button/cometchat-radio-button.component';
import { CometChatButtonComponent } from '../cometchat-button/cometchat-button.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatChangeScopeComponent> = {
  title: 'Base Elements/Change Scope',
  component: CometChatChangeScopeComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatRadioButtonComponent, CometChatButtonComponent],
    }),
  ],
  args: {
    title: 'Change Member Role',
    buttonText: 'Update Role',
    options: ['admin', 'moderator', 'participant'],
    defaultSelection: 'participant',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Title of the change scope dialog',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    buttonText: {
      control: 'text',
      description: 'Text for the confirm button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    options: {
      control: 'object',
      description: 'List of available scope options displayed as radio buttons',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
        category: 'Data',
      },
    },
    defaultSelection: {
      control: 'text',
      description: 'Default selected scope option',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Data',
      },
    },
    scopeChanged: {
      action: 'scopeChanged',
      description: 'Emitted when the scope selection is confirmed',
      table: {
        type: { summary: 'EventEmitter<string>' },
        category: 'Events',
      },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when the close/cancel button is clicked',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatChangeScope provides a dialog for changing group member roles/scopes. It displays a title, radio button list for scope selection, and action buttons. Supports full keyboard navigation (Tab, Arrow keys, Enter, Space, Escape) and screen reader accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatChangeScopeComponent>;

// ============================================
// Stories
// ============================================

/** Default change scope dialog with standard group roles. */
export const Default: Story = {
  args: {
    title: 'Change Member Role',
    buttonText: 'Update Role',
    options: ['admin', 'moderator', 'participant'],
    defaultSelection: 'participant',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default change scope dialog rendered with standard group roles (admin, moderator, participant). This is the most common usage for managing group member permissions.',
      },
    },
  },
};

/** Change scope dialog showing various available scope options. */
export const AvailableScopeOptions: Story = {
  args: {
    title: 'Select Access Level',
    buttonText: 'Apply',
    options: ['owner', 'admin', 'moderator', 'participant'],
    defaultSelection: 'moderator',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Change scope dialog with an expanded set of scope options including owner, admin, moderator, and participant. Demonstrates the component with a different default selection.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all change scope variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-change-scope-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-change-scope-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Change Scope Variants
        </h3>

        <!-- Standard Group Roles -->
        <div class="cometchat-change-scope-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-change-scope-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Standard Group Roles
          </p>
          <div class="cometchat-change-scope-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-change-scope
              [title]="'Change Member Role'"
              [buttonText]="'Update Role'"
              [options]="standardRoles"
              [defaultSelection]="'participant'">
            </cometchat-change-scope>
          </div>
        </div>

        <!-- Extended Scope Options -->
        <div class="cometchat-change-scope-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-change-scope-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Extended Scope Options
          </p>
          <div class="cometchat-change-scope-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-change-scope
              [title]="'Select Access Level'"
              [buttonText]="'Apply'"
              [options]="extendedRoles"
              [defaultSelection]="'moderator'">
            </cometchat-change-scope>
          </div>
        </div>

        <!-- Two Options (Simple Toggle) -->
        <div class="cometchat-change-scope-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
          <p class="cometchat-change-scope-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Two Options (Simple Toggle)
          </p>
          <div class="cometchat-change-scope-showcase__group" style="padding-left: var(--cometchat-padding-2);">
            <cometchat-change-scope
              [title]="'Change Status'"
              [buttonText]="'Confirm'"
              [options]="toggleOptions"
              [defaultSelection]="'Active'">
            </cometchat-change-scope>
          </div>
        </div>

      </div>
    `,
    props: {
      standardRoles: ['admin', 'moderator', 'participant'],
      extendedRoles: ['owner', 'admin', 'moderator', 'participant'],
      toggleOptions: ['Active', 'Inactive'],
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all change scope variants — standard group roles, extended scope options, and a simple two-option toggle — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
