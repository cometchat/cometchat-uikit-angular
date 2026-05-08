/**
 * CometChatActionSheet Storybook Stories
 *
 * Interactive stories demonstrating the action sheet component variants:
 * - Default action sheet with typical actions
 * - Default actions list with common messaging actions
 * - Empty actions edge case
 * - All variants showcase
 *
 * @module components/cometchat-action-sheet
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatActionSheetComponent } from './cometchat-action-sheet.component';
import { CometChatMessageComposerAction } from '../../../modals';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

// ============================================
// Mock Data
// ============================================

/**
 * Creates a mock action item for story rendering.
 */
function createMockAction(
  id: string,
  title: string,
  iconURL?: string
): CometChatMessageComposerAction {
  return new CometChatMessageComposerAction({
    id,
    title,
    iconURL: iconURL || 'assets/photo_camera.svg',
  });
}

/** Predefined action sets for stories. */
const ACTIONS = {
  default: [
    createMockAction('photo', 'Take Photo', 'assets/photo_camera.svg'),
    createMockAction(
      'gallery',
      'Choose from Gallery',
      'assets/conversations_image-message.svg'
    ),
    createMockAction(
      'document',
      'Send Document',
      'assets/collabrative_document.svg'
    ),
  ],
  extended: [
    createMockAction('photo', 'Take Photo', 'assets/photo_camera.svg'),
    createMockAction(
      'gallery',
      'Choose from Gallery',
      'assets/conversations_image-message.svg'
    ),
    createMockAction(
      'document',
      'Send Document',
      'assets/collabrative_document.svg'
    ),
    createMockAction(
      'location',
      'Send Location',
      'assets/location_on.svg'
    ),
    createMockAction('poll', 'Create Poll', 'assets/poll.svg'),
  ],
};

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatActionSheetComponent> = {
  title: 'Components/Misc/Action Sheet',
  component: CometChatActionSheetComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    actions: ACTIONS.default,
  },
  argTypes: {
    actions: {
      control: 'object',
      description:
        'Array of action items displayed in the action sheet. Each item has an id, title, iconURL, and optional onClick handler.',
      table: {
        type: { summary: '(CometChatMessageComposerAction | CometChatActionsView)[]' },
        defaultValue: { summary: '[]' },
      },
    },
    actionItemClick: {
      action: 'actionItemClick',
      description:
        'Emitted when an action item is clicked. Payload contains the clicked action item.',
      table: {
        type: { summary: 'EventEmitter<CometChatMessageComposerAction | CometChatActionsView>' },
        category: 'Events',
      },
    },
    closeSheet: {
      action: 'closeSheet',
      description: 'Emitted when the action sheet should be closed (e.g., Escape key pressed)',
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
          'CometChatActionSheet displays a list of action items in a menu-style layout. Supports keyboard navigation with Arrow keys for item traversal, Enter/Space for selection, and Escape to close. Each action item renders an icon and title.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatActionSheetComponent>;

// ============================================
// Stories
// ============================================

/** Default action sheet with three common actions — photo, gallery, and document. */
export const Default: Story = {
  args: {
    actions: ACTIONS.default,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:250px; height:350px; overflow:visible;">
        <cometchat-action-sheet [actions]="actions" style="left:50%; top:50%; transform:translate(-50%,-50%);"></cometchat-action-sheet>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Default action sheet rendered with three typical actions. This is the most common usage for message composer attachments.',
      },
    },
  },
};

/** Action sheet populated with an extended list of common messaging actions. */
export const DefaultActionsList: Story = {
  args: {
    actions: ACTIONS.extended,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:250px; height:400px; overflow:visible;">
        <cometchat-action-sheet [actions]="actions" style="left:50%; top:50%; transform:translate(-50%,-50%);"></cometchat-action-sheet>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Action sheet with a larger set of actions including photo, gallery, document, location, and poll. Demonstrates how the sheet scales with more items.',
      },
    },
  },
};

/** Empty action sheet with no actions — edge case for empty state. */
export const EmptyActions: Story = {
  tags: ['!autodocs', '!dev'],
  args: {
    actions: [],
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:250px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-action-sheet [actions]="actions"></cometchat-action-sheet>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          "Edge case: action sheet rendered with an empty actions array. Demonstrates the component's behavior when no actions are available.",
      },
    },
  },
};

/** Action sheet with a cancel button action included. */
export const WithCancelButton: Story = {
  args: {
    actions: [
      ...ACTIONS.default,
      createMockAction('cancel', 'Cancel', 'assets/close.svg'),
    ],
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:250px; height:380px; overflow:visible;">
        <cometchat-action-sheet [actions]="actions" style="left:50%; top:50%; transform:translate(-50%,-50%);"></cometchat-action-sheet>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Action sheet with a cancel button included as the last action item. Clicking cancel emits the actionItemClick event with the cancel action.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all action sheet variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5); align-items: flex-start;">

        <!-- Default Actions -->
        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default Actions (3 items)
          </p>
          <div data-cometchat-container style="position: relative; width: 250px; height: 240px;">
            <cometchat-action-sheet [actions]="defaultActions"></cometchat-action-sheet>
          </div>
        </div>

        <!-- Extended Actions List -->
        <div style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Extended Actions (5 items)
          </p>
          <div data-cometchat-container style="position: relative; width: 250px; height: 350px;">
            <cometchat-action-sheet [actions]="extendedActions"></cometchat-action-sheet>
          </div>
        </div>

      </div>
    `,
    props: {
      defaultActions: ACTIONS.default,
      extendedActions: ACTIONS.extended,
    },
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all action sheet variants — default actions, extended actions list, and empty state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
