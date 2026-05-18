/**
 * CometChatUserItem Storybook Stories
 *
 * Interactive stories demonstrating the user item component variants:
 * - Default user item rendering
 * - Online user with status indicator
 * - Offline user with status indicator
 * - All variants showcase
 *
 * @module components/cometchat-user-item
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatUserItemComponent } from './cometchat-user-item.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { createMockUser } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatUserItemComponent> = {
  title: 'Components/Users/CometChat User Item',
  component: CometChatUserItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    user: createMockUser({
      uid: 'user-default',
      name: 'Alice Johnson',
      status: CometChat.USER_STATUS.ONLINE,
    }),
    isActive: false,
    isSelected: false,
    isFocused: false,
    hideUserStatus: false,
    disableDefaultContextMenu: true,
  },
  argTypes: {
    user: {
      control: false,
      description: 'CometChat.User object to render. Primary data source for the component.',
      table: {
        type: { summary: 'CometChat.User' },
      },
    },
    isActive: {
      control: 'boolean',
      description: 'Whether the item is currently active/selected for viewing',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    isSelected: {
      control: 'boolean',
      description: 'Whether the item is selected in selection mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    isFocused: {
      control: 'boolean',
      description: 'Whether the item currently has keyboard focus',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide the online/offline status indicator',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display',
      },
    },
    disableDefaultContextMenu: {
      control: 'boolean',
      description: 'Disable the browser default context menu on right-click',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display',
      },
    },
    contextMenuOptions: {
      control: false,
      description: 'Options for the context menu displayed on hover/right-click',
      table: {
        type: { summary: 'CometChatOption[]' },
        category: 'Customization',
      },
    },
    leadingView: {
      control: false,
      description: 'Custom template for the leading section (avatar area)',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.User }>' },
        category: 'Customization',
      },
    },
    titleView: {
      control: false,
      description: 'Custom template for the title section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.User }>' },
        category: 'Customization',
      },
    },
    subtitleView: {
      control: false,
      description: 'Custom template for the subtitle section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.User }>' },
        category: 'Customization',
      },
    },
    trailingView: {
      control: false,
      description: 'Custom template for the trailing section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.User }>' },
        category: 'Customization',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when the user item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.User>' },
        category: 'Events',
      },
    },
    itemSelect: {
      action: 'itemSelect',
      description: 'Emitted when the user is selected/deselected in selection mode',
      table: {
        type: { summary: 'EventEmitter<{ user: CometChat.User; selected: boolean }>' },
        category: 'Events',
      },
    },
    contextMenuOpen: {
      action: 'contextMenuOpen',
      description: 'Emitted when the context menu is opened',
      table: {
        type: { summary: 'EventEmitter<CometChat.User>' },
        category: 'Events',
      },
    },
    contextMenuOptionClick: {
      action: 'contextMenuOptionClick',
      description: 'Emitted when a context menu option is clicked',
      table: {
        type: { summary: 'EventEmitter<{ option: CometChatOption; user: CometChat.User }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatUserItem renders a single user item with avatar, name, online/offline status indicator, context menu support, custom template projections for leading/title/subtitle/trailing sections, and full keyboard accessibility.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatUserItemComponent>;

// ============================================
// Stories
// ============================================

/** Default user item with an online user and typical inputs. */
export const Default: Story = {
  args: {
    user: createMockUser({
      uid: 'user-alice',
      name: 'Alice Johnson',
      status: CometChat.USER_STATUS.ONLINE,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default user item rendered with an online user. Shows avatar, name, and green online status indicator.',
      },
    },
  },
};

/** User item displaying an online user with a visible status indicator. */
export const OnlineUser: Story = {
  args: {
    user: createMockUser({
      uid: 'user-bob',
      name: 'Bob Smith',
      status: CometChat.USER_STATUS.ONLINE,
    }),
    hideUserStatus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'User item for an online user. The green status dot is visible next to the avatar, indicating the user is currently available.',
      },
    },
  },
};

/** User item displaying an offline user with a visible status indicator. */
export const OfflineUser: Story = {
  args: {
    user: createMockUser({
      uid: 'user-charlie',
      name: 'Charlie Brown',
      status: CometChat.USER_STATUS.OFFLINE,
    }),
    hideUserStatus: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'User item for an offline user. The status indicator reflects the offline state, distinguishing this user from online users.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all user item variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-user-item-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-user-item-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          User Item Variants
        </h3>

        <!-- Online User -->
        <div class="cometchat-user-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-user-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Online User
          </p>
          <cometchat-user-item [user]="onlineUser" [hideUserStatus]="false"></cometchat-user-item>
        </div>

        <!-- Offline User -->
        <div class="cometchat-user-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-user-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Offline User
          </p>
          <cometchat-user-item [user]="offlineUser" [hideUserStatus]="false"></cometchat-user-item>
        </div>

        <!-- Hidden Status -->
        <div class="cometchat-user-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-user-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Hidden Status Indicator
          </p>
          <cometchat-user-item [user]="hiddenStatusUser" [hideUserStatus]="true"></cometchat-user-item>
        </div>

        <!-- Active State -->
        <div class="cometchat-user-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-user-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Active State
          </p>
          <cometchat-user-item [user]="activeUser" [isActive]="true" [hideUserStatus]="false"></cometchat-user-item>
        </div>

      </div>
    `,
    props: {
      onlineUser: createMockUser({
        uid: 'showcase-online',
        name: 'Alice Johnson',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      offlineUser: createMockUser({
        uid: 'showcase-offline',
        name: 'Bob Smith',
        status: CometChat.USER_STATUS.OFFLINE,
      }),
      hiddenStatusUser: createMockUser({
        uid: 'showcase-hidden',
        name: 'Charlie Brown',
        status: CometChat.USER_STATUS.ONLINE,
      }),
      activeUser: createMockUser({
        uid: 'showcase-active',
        name: 'Diana Ross',
        status: CometChat.USER_STATUS.ONLINE,
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all user item variants — online user, offline user, hidden status indicator, and active state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders user item container */
export const TestDefaultRendersItem: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-user-item');
    expect(container).not.toBeNull();
  },
};
