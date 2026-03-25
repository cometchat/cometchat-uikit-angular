/**
 * CometChatLinkDialog Storybook Stories
 *
 * Interactive stories demonstrating the link add/edit dialog:
 * - Default dialog in add mode
 * - Default dialog display in edit mode
 * - Dialog with pre-filled URL
 * - All variants showcase
 *
 * This is a rich-text-editor helper dialog for inserting or editing
 * hyperlinks. It includes text and URL input fields with validation,
 * and full keyboard accessibility with focus trapping.
 *
 * @module components/cometchat-link-dialog
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CometChatLinkDialogComponent } from './cometchat-link-dialog.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatLinkDialogComponent> = {
  title: 'Components/Misc/Link Dialog',
  component: CometChatLinkDialogComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, FormsModule],
    }),
  ],
  args: {
    mode: 'add',
    initialText: '',
    initialUrl: '',
    selectedText: '',
  },
  argTypes: {
    mode: {
      control: 'radio',
      options: ['add', 'edit'],
      description:
        'Dialog mode — "add" for new links, "edit" for existing links. In edit mode a remove button is available.',
      table: {
        type: { summary: "'add' | 'edit'" },
        defaultValue: { summary: "'add'" },
        category: 'Inputs',
      },
    },
    initialText: {
      control: 'text',
      description:
        'Initial text value pre-filled in the text input (used in edit mode or pre-filled add mode)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Inputs',
      },
    },
    initialUrl: {
      control: 'text',
      description: 'Initial URL value pre-filled in the URL input (primarily for edit mode)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Inputs',
      },
    },
    selectedText: {
      control: 'text',
      description: 'Selected text from the editor, used as default link text in add mode',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Inputs',
      },
    },
    save: {
      action: 'save',
      description: 'Emitted when save is clicked with valid link data ({ text, url })',
      table: {
        type: { summary: 'EventEmitter<LinkData>' },
        category: 'Events',
      },
    },
    cancel: {
      action: 'cancel',
      description: 'Emitted when cancel is clicked',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    remove: {
      action: 'remove',
      description: 'Emitted when remove is clicked (edit mode only)',
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
          'CometChatLinkDialog provides a dialog for adding or editing hyperlinks in the message composer rich text editor. It includes text and URL input fields, URL validation with automatic protocol normalization, and full keyboard accessibility with focus trapping and Escape-to-close. Supports "add" mode for new links and "edit" mode for existing links.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatLinkDialogComponent>;

// ============================================
// Stories
// ============================================

/** Default link dialog in add mode with empty fields. */
export const Default: Story = {
  args: {
    mode: 'add',
    initialText: '',
    initialUrl: '',
    selectedText: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default link dialog in add mode with empty text and URL fields. The user can enter link text and a URL, then save or cancel.',
      },
    },
  },
};

/** Dialog in edit mode with existing link text and URL pre-filled. */
export const DefaultDialog: Story = {
  args: {
    mode: 'edit',
    initialText: 'CometChat Docs',
    initialUrl: 'https://www.cometchat.com/docs',
    selectedText: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Link dialog in edit mode with pre-filled text and URL. The URL input is focused and selected for easy replacement. A remove button is available to delete the link.',
      },
    },
  },
};

/** Dialog in add mode with a pre-filled URL and selected text from the editor. */
export const DialogWithPreFilledURL: Story = {
  args: {
    mode: 'add',
    initialText: '',
    initialUrl: 'https://example.com',
    selectedText: 'Visit Example',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Add-mode dialog with a pre-filled URL and selected text from the editor. Demonstrates how the dialog appears when the user selects text before inserting a link.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all link dialog variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-link-dialog-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-link-dialog-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Link Dialog Variants
        </h3>

        <!-- Add Mode (Empty) -->
        <div class="cometchat-link-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-link-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Add Mode (Empty)
          </p>
          <cometchat-link-dialog
            [mode]="'add'"
            [initialText]="''"
            [initialUrl]="''"
            [selectedText]="''"
          ></cometchat-link-dialog>
        </div>

        <!-- Edit Mode (Pre-filled) -->
        <div class="cometchat-link-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-link-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Edit Mode (Pre-filled)
          </p>
          <cometchat-link-dialog
            [mode]="'edit'"
            [initialText]="editText"
            [initialUrl]="editUrl"
            [selectedText]="''"
          ></cometchat-link-dialog>
        </div>

        <!-- Add Mode with Selected Text -->
        <div class="cometchat-link-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-link-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Add Mode with Selected Text &amp; URL
          </p>
          <cometchat-link-dialog
            [mode]="'add'"
            [initialText]="''"
            [initialUrl]="preFilledUrl"
            [selectedText]="preFilledSelectedText"
          ></cometchat-link-dialog>
        </div>

      </div>
    `,
    props: {
      editText: 'CometChat Docs',
      editUrl: 'https://www.cometchat.com/docs',
      preFilledUrl: 'https://example.com',
      preFilledSelectedText: 'Visit Example',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all link dialog variants — add mode with empty fields, edit mode with pre-filled data, and add mode with selected text and URL — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
