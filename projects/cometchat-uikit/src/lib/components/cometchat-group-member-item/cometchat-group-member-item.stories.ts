/**
 * CometChatGroupMemberItem Storybook Stories
 *
 * Interactive stories demonstrating the group member item component variants:
 * - Default member rendering (participant)
 * - Member role (participant, no badge)
 * - Admin role with badge
 * - Moderator role with badge
 * - All variants showcase
 *
 * @module components/cometchat-group-member-item
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';

import { CometChatGroupMemberItemComponent } from './cometchat-group-member-item.component';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { createMockGroupMember } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatGroupMemberItemComponent> = {
  title: 'Components/Groups/CometChat Group Member Item',
  component: CometChatGroupMemberItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    member: createMockGroupMember({
      uid: 'member-default',
      name: 'Alice Johnson',
      status: CometChat.USER_STATUS.ONLINE,
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
    }),
    isActive: false,
    isSelected: false,
    isFocused: false,
    hideUserStatus: false,
    disableDefaultContextMenu: true,
  },
  argTypes: {
    member: {
      control: false,
      description: 'CometChat.GroupMember object to render. Primary data source for the component.',
      table: {
        type: { summary: 'CometChat.GroupMember' },
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
    tabIndex: {
      control: 'number',
      description:
        'Tab index for roving tabindex pattern — only focused item should have tabindex=0',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '-1' },
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
      description: 'Options for the context menu (kick, ban, change scope)',
      table: {
        type: { summary: 'CometChatOption[]' },
        category: 'Customization',
      },
    },
    leadingView: {
      control: false,
      description: 'Custom template for the leading section (avatar area)',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.GroupMember }>' },
        category: 'Customization',
      },
    },
    titleView: {
      control: false,
      description: 'Custom template for the title section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.GroupMember }>' },
        category: 'Customization',
      },
    },
    subtitleView: {
      control: false,
      description: 'Custom template for the subtitle section',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.GroupMember }>' },
        category: 'Customization',
      },
    },
    trailingView: {
      control: false,
      description: 'Custom template for the trailing section (role badge and context menu area)',
      table: {
        type: { summary: 'TemplateRef<{ $implicit: CometChat.GroupMember }>' },
        category: 'Customization',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when the member item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.GroupMember>' },
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
    contextMenuOptionClick: {
      action: 'contextMenuOptionClick',
      description: 'Emitted when a context menu option is clicked',
      table: {
        type: {
          summary: 'EventEmitter<{ option: CometChatOption; member: CometChat.GroupMember }>',
        },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatGroupMemberItem renders a single group member with avatar, online/offline status indicator, role badge (owner/admin/moderator), context menu support for member management, and full keyboard accessibility. Supports custom templates for leading, title, subtitle, and trailing sections.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatGroupMemberItemComponent>;

// ============================================
// Stories
// ============================================

/** Default group member item with participant scope and online status. */
export const Default: Story = {
  args: {
    member: createMockGroupMember({
      uid: 'member-alice',
      name: 'Alice Johnson',
      status: CometChat.USER_STATUS.ONLINE,
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default group member item with participant scope and online status. Participants do not display a role badge.',
      },
    },
  },
};

/** Member with participant role — no role badge displayed. */
export const MemberRole: Story = {
  args: {
    member: createMockGroupMember({
      uid: 'member-diana',
      name: 'Diana Ross',
      status: CometChat.USER_STATUS.OFFLINE,
      scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Group member with participant scope and offline status. Participants are regular members with no role badge displayed.',
      },
    },
  },
};

/** Admin member displaying the admin role badge. */
export const AdminRole: Story = {
  args: {
    member: createMockGroupMember({
      uid: 'member-bob',
      name: 'Bob Smith',
      status: CometChat.USER_STATUS.ONLINE,
      scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Group member with admin scope, displaying the admin role badge in the trailing section.',
      },
    },
  },
};

/** Moderator member displaying the moderator role badge. */
export const ModeratorRole: Story = {
  args: {
    member: createMockGroupMember({
      uid: 'member-charlie',
      name: 'Charlie Brown',
      status: CometChat.USER_STATUS.ONLINE,
      scope: CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Group member with moderator scope, displaying the moderator role badge in the trailing section.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all group member item variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-group-member-item-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-group-member-item-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Group Member Item Variants
        </h3>

        <!-- Participant (no badge) -->
        <div class="cometchat-group-member-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-member-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Participant (No Badge)
          </p>
          <cometchat-group-member-item [member]="participantMember"></cometchat-group-member-item>
        </div>

        <!-- Admin -->
        <div class="cometchat-group-member-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-member-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Admin Role
          </p>
          <cometchat-group-member-item [member]="adminMember"></cometchat-group-member-item>
        </div>

        <!-- Moderator -->
        <div class="cometchat-group-member-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-member-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Moderator Role
          </p>
          <cometchat-group-member-item [member]="moderatorMember"></cometchat-group-member-item>
        </div>

        <!-- Offline Member -->
        <div class="cometchat-group-member-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-member-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Offline Member
          </p>
          <cometchat-group-member-item [member]="offlineMember"></cometchat-group-member-item>
        </div>

        <!-- Hidden Status Indicator -->
        <div class="cometchat-group-member-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-member-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Hidden Status Indicator
          </p>
          <cometchat-group-member-item [member]="adminMember" [hideUserStatus]="true"></cometchat-group-member-item>
        </div>

      </div>
    `,
    props: {
      participantMember: createMockGroupMember({
        uid: 'showcase-participant',
        name: 'Alice Johnson',
        status: CometChat.USER_STATUS.ONLINE,
        scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      }),
      adminMember: createMockGroupMember({
        uid: 'showcase-admin',
        name: 'Bob Smith',
        status: CometChat.USER_STATUS.ONLINE,
        scope: CometChat.GROUP_MEMBER_SCOPE.ADMIN,
      }),
      moderatorMember: createMockGroupMember({
        uid: 'showcase-moderator',
        name: 'Charlie Brown',
        status: CometChat.USER_STATUS.ONLINE,
        scope: CometChat.GROUP_MEMBER_SCOPE.MODERATOR,
      }),
      offlineMember: createMockGroupMember({
        uid: 'showcase-offline',
        name: 'Diana Ross',
        status: CometChat.USER_STATUS.OFFLINE,
        scope: CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT,
      }),
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all group member item variants — participant, admin, moderator, offline member, and hidden status indicator — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: Default story renders group member item container */
export const TestDefaultRendersItem: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const container = canvasElement.querySelector('.cometchat-group-member-item');
    expect(container).not.toBeNull();
  },
};
