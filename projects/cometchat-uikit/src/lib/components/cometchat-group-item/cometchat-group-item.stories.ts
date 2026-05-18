/**
 * CometChatGroupItem Storybook Stories
 *
 * Interactive stories demonstrating the group item component variants:
 * - Default group display
 * - Group with member count emphasis
 * - All variants showcase
 *
 * @module components/cometchat-group-item
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatGroupItemComponent } from './cometchat-group-item.component';
import { createMockGroup } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatGroupItemComponent> = {
  title: 'Components/Groups/CometChat Group Item',
  component: CometChatGroupItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    group: createMockGroup({
      guid: 'group-default',
      name: 'General Discussion',
      type: CometChat.GROUP_TYPE.PUBLIC,
      membersCount: 12,
    }),
    isActive: false,
    isSelected: false,
    isFocused: false,
    hideGroupType: false,
    disableDefaultContextMenu: true,
  },
  argTypes: {
    group: {
      control: false,
      description: 'CometChat.Group object to render. Primary data source for the component.',
      table: {
        type: { summary: 'CometChat.Group' },
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
      description: 'Whether the item has keyboard focus',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide the group type indicator (public/private/password)',
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
      description: 'Custom template for the leading section (icon/avatar area)',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.Group }>' },
        category: 'Customization',
      },
    },
    titleView: {
      control: false,
      description: 'Custom template for the title section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.Group }>' },
        category: 'Customization',
      },
    },
    subtitleView: {
      control: false,
      description: 'Custom template for the subtitle section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.Group }>' },
        category: 'Customization',
      },
    },
    trailingView: {
      control: false,
      description: 'Custom template for the trailing section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.Group }>' },
        category: 'Customization',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when the group item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Group>' },
        category: 'Events',
      },
    },
    itemSelect: {
      action: 'itemSelect',
      description: 'Emitted when the group is selected/deselected',
      table: {
        type: { summary: 'EventEmitter<{ group: CometChat.Group; selected: boolean }>' },
        category: 'Events',
      },
    },
    contextMenuOpen: {
      action: 'contextMenuOpen',
      description: 'Emitted when the context menu is opened',
      table: {
        type: { summary: 'EventEmitter<CometChat.Group>' },
        category: 'Events',
      },
    },
    contextMenuOptionClick: {
      action: 'contextMenuOptionClick',
      description: 'Emitted when a context menu option is clicked',
      table: {
        type: { summary: 'EventEmitter<{ option: CometChatOption; group: CometChat.Group }>' },
        category: 'Events',
      },
    },
    itemFocus: {
      action: 'itemFocus',
      description: 'Emitted when the item receives native focus',
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
          'CometChatGroupItem renders a single group entry with avatar, group type indicator (public/private/password), member count subtitle, context menu support, and full keyboard accessibility. Supports custom templates for leading, title, subtitle, and trailing sections.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatGroupItemComponent>;

// ============================================
// Stories
// ============================================

/** Default group item with a public group and typical inputs. */
export const Default: Story = {
  args: {
    group: createMockGroup({
      guid: 'group-default',
      name: 'General Discussion',
      type: CometChat.GROUP_TYPE.PUBLIC,
      membersCount: 12,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default group item rendered with a public group, showing avatar, name, and member count subtitle. This is the most common usage.',
      },
    },
  },
};

/** Group item emphasizing a large member count. */
export const WithMemberCount: Story = {
  args: {
    group: createMockGroup({
      guid: 'group-large',
      name: 'Company All-Hands',
      type: CometChat.GROUP_TYPE.PUBLIC,
      membersCount: 250,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Group item displaying a group with a large member count (250 members). Demonstrates how the subtitle renders high member numbers.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all group item variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-group-item-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-group-item-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Group Item Variants
        </h3>

        <!-- Public Group -->
        <div class="cometchat-group-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Public Group
          </p>
          <cometchat-group-item [group]="publicGroup"></cometchat-group-item>
        </div>

        <!-- Private Group -->
        <div class="cometchat-group-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Private Group
          </p>
          <cometchat-group-item [group]="privateGroup"></cometchat-group-item>
        </div>

        <!-- Password Group -->
        <div class="cometchat-group-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Password-Protected Group
          </p>
          <cometchat-group-item [group]="passwordGroup"></cometchat-group-item>
        </div>

        <!-- Large Member Count -->
        <div class="cometchat-group-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Large Member Count
          </p>
          <cometchat-group-item [group]="largeGroup"></cometchat-group-item>
        </div>

        <!-- Hidden Group Type -->
        <div class="cometchat-group-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Hidden Group Type Indicator
          </p>
          <cometchat-group-item [group]="privateGroup" [hideGroupType]="true"></cometchat-group-item>
        </div>

      </div>
    `,
    props: {
      publicGroup: createMockGroup({
        guid: 'showcase-public',
        name: 'General Discussion',
        type: CometChat.GROUP_TYPE.PUBLIC,
        membersCount: 45,
      }),
      privateGroup: createMockGroup({
        guid: 'showcase-private',
        name: 'Engineering Core',
        type: CometChat.GROUP_TYPE.PRIVATE,
        membersCount: 8,
      }),
      passwordGroup: createMockGroup({
        guid: 'showcase-password',
        name: 'VIP Lounge',
        type: CometChat.GROUP_TYPE.PASSWORD,
        membersCount: 15,
      }),
      largeGroup: createMockGroup({
        guid: 'showcase-large',
        name: 'Company All-Hands',
        type: CometChat.GROUP_TYPE.PUBLIC,
        membersCount: 250,
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all group item variants — public, private, password-protected, large member count, and hidden type indicator — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders group item container */
export const TestDefaultRendersItem: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-group-item');
    expect(container).not.toBeNull();
  },
};
