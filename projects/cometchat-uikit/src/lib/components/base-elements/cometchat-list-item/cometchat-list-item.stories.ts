/**
 * CometChatListItem Storybook Stories
 *
 * Interactive stories demonstrating the list item component variants:
 * - Default list item with avatar and title
 * - List item with avatar image
 * - List item with trailing (tail) content
 * - Selected/focused state
 * - All variants showcase
 *
 * @module components/cometchat-list-item
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatListItemComponent } from './cometchat-list-item.component';
import { CometChatAvatarComponent } from '../cometchat-avatar/cometchat-avatar.component';
import { MOCK_AVATARS } from '../../../../../../../.storybook/utils/mock-data';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatListItemComponent> = {
  title: 'Components/Misc/List Item',
  component: CometChatListItemComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatAvatarComponent],
    }),
  ],
  args: {
    id: 'list-item-1',
    avatarURL: MOCK_AVATARS.andrewJoseph,
    avatarName: 'John Doe',
    title: 'John Doe',
    subtitle: 'Online',
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the list item',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Data',
      },
    },
    avatarURL: {
      control: 'text',
      description: 'URL of the avatar image. When provided, displays the image in the leading view',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    avatarName: {
      control: 'text',
      description: 'Name used to generate avatar initials when avatarURL is not provided',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    title: {
      control: 'text',
      description: 'Primary title text displayed in the list item body',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    subtitle: {
      control: 'text',
      description:
        'Subtitle text used for accessibility (aria-label). Displayed when subtitleView is not provided',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    menuView: {
      control: false,
      description: 'Template for the menu view shown on hover/focus, replacing the trailing view',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    subtitleView: {
      control: false,
      description: 'Template for a custom subtitle view below the title',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    trailingView: {
      control: false,
      description: 'Template for the trailing (right-side) content area',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    titleView: {
      control: false,
      description: 'Template for a custom title view replacing the default title text',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    leadingView: {
      control: false,
      description: 'Template for a custom leading view replacing the default avatar',
      table: {
        type: { summary: 'TemplateRef<any> | null' },
        defaultValue: { summary: 'null' },
        category: 'Templates',
      },
    },
    stopEventPropagation: {
      control: 'boolean',
      description: 'When true, stops event propagation on trailing view click',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    disableTabIndex: {
      control: 'boolean',
      description: 'When true, disables the tabindex on the list item (parent manages focus)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    isFocused: {
      control: 'boolean',
      description: 'Whether the list item is currently focused (managed by parent component)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Behavior',
      },
    },
    menuShortcutKey: {
      control: 'text',
      description:
        'Keyboard shortcut key for toggling menu visibility. Set to empty/null to disable (WCAG 2.1.4)',
      table: {
        type: { summary: 'string | null' },
        defaultValue: { summary: "'M'" },
        category: 'Behavior',
      },
    },
    listItemClick: {
      action: 'listItemClick',
      description: 'Emitted when the list item is clicked or activated via keyboard',
      table: {
        type: { summary: 'EventEmitter<{ id: string }>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatListItem is a composite component for displaying list items with avatar, title, subtitle, and customizable leading/trailing/menu views. It supports keyboard navigation, hover/focus menu reveal, and template projection for full customization.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatListItemComponent>;

// ============================================
// Stories
// ============================================

/** Default list item with avatar image and title. */
export const Default: Story = {
  args: {
    id: 'user-1',
    avatarURL: MOCK_AVATARS.andrewJoseph,
    avatarName: 'John Doe',
    title: 'John Doe',
    subtitle: 'Online',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default list item rendered with an avatar image, title, and subtitle. This is the most common usage for user/conversation lists.',
      },
    },
  },
};

/** List item displaying an avatar from a URL with name fallback. */
export const WithAvatar: Story = {
  args: {
    id: 'user-2',
    avatarName: 'Alice Smith',
    title: 'Alice Smith',
    subtitle: 'Last seen 5 minutes ago',
  },
  parameters: {
    docs: {
      description: {
        story:
          'List item with an avatar image loaded from a URL. When the URL is unavailable, the component falls back to name-based initials via the CometChatAvatar component.',
      },
    },
  },
};

/** List item with custom trailing (tail) content on the right side. */
export const WithTailContent: Story = {
  render: () => ({
    template: `
      <cometchat-list-item
        [id]="id"
        [avatarURL]="avatarURL"
        [avatarName]="avatarName"
        [title]="title"
        [subtitle]="subtitle"
        [trailingView]="tailTemplate">
      </cometchat-list-item>

      <ng-template #tailTemplate>
        <span style="
          font: var(--cometchat-font-caption1-medium);
          color: var(--cometchat-text-color-secondary);
        ">3:42 PM</span>
      </ng-template>
    `,
    props: {
      id: 'user-3',
      avatarURL: undefined,
      avatarName: 'Mike Kim',
      title: 'Mike Kim',
      subtitle: 'Hey, are you free today?',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'List item with a trailing view template displaying a timestamp on the right side. The trailingView input accepts any TemplateRef for custom right-side content such as timestamps, badges, or status indicators.',
      },
    },
  },
};

/** List item in a focused/selected state managed by the parent. */
export const SelectedState: Story = {
  args: {
    id: 'user-4',
    avatarName: 'Rachel Lee',
    title: 'Rachel Lee',
    subtitle: 'Typing...',
    isFocused: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'List item in a focused/selected state. The isFocused input is managed by the parent component to indicate the currently active item in a list. When focused, the menu view becomes visible if provided.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all list item variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-list-item-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-list-item-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          List Item Variants
        </h3>

        <!-- Default with Avatar Image -->
        <div class="cometchat-list-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-list-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default (Avatar Image)
          </p>
          <div class="cometchat-list-item-showcase__item-wrapper" style="max-width: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-list-item
              [id]="'showcase-1'"
              [avatarURL]="avatarUser1"
              [avatarName]="'John Doe'"
              [title]="'John Doe'"
              [subtitle]="'Online'">
            </cometchat-list-item>
          </div>
        </div>

        <!-- Avatar from Name Initials -->
        <div class="cometchat-list-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-list-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Avatar from Name Initials
          </p>
          <div class="cometchat-list-item-showcase__item-wrapper" style="max-width: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-list-item
              [id]="'showcase-2'"
              [avatarName]="'Alice Smith'"
              [title]="'Alice Smith'"
              [subtitle]="'Away'">
            </cometchat-list-item>
          </div>
        </div>

        <!-- With Tail Content -->
        <div class="cometchat-list-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-list-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Tail Content (Trailing View)
          </p>
          <div class="cometchat-list-item-showcase__item-wrapper" style="max-width: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-list-item
              [id]="'showcase-3'"
              [avatarURL]="avatarUser3"
              [avatarName]="'Mike Kim'"
              [title]="'Mike Kim'"
              [subtitle]="'Hey, are you free?'"
              [trailingView]="tailTimestamp">
            </cometchat-list-item>
          </div>
        </div>

        <!-- Selected / Focused State -->
        <div class="cometchat-list-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-list-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Selected / Focused State
          </p>
          <div class="cometchat-list-item-showcase__item-wrapper" style="max-width: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-list-item
              [id]="'showcase-4'"
              [avatarURL]="avatarUser4"
              [avatarName]="'Rachel Lee'"
              [title]="'Rachel Lee'"
              [subtitle]="'Typing...'"
              [isFocused]="true">
            </cometchat-list-item>
          </div>
        </div>

        <!-- Multiple Items in a List -->
        <div class="cometchat-list-item-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-list-item-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Multiple Items in a List
          </p>
          <div class="cometchat-list-item-showcase__group" style="max-width: 400px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; display: flex; flex-direction: column;">
            <cometchat-list-item
              [id]="'showcase-list-1'"
              [avatarURL]="avatarUser1"
              [avatarName]="'John Doe'"
              [title]="'John Doe'"
              [subtitle]="'Online'"
              [trailingView]="tailTimestamp">
            </cometchat-list-item>
            <cometchat-list-item
              [id]="'showcase-list-2'"
              [avatarURL]="avatarUser2"
              [avatarName]="'Alice Smith'"
              [title]="'Alice Smith'"
              [subtitle]="'Last seen 2h ago'"
              [trailingView]="tailTimestampOlder">
            </cometchat-list-item>
            <cometchat-list-item
              [id]="'showcase-list-3'"
              [avatarURL]="avatarUser3"
              [avatarName]="'Mike Kim'"
              [title]="'Mike Kim'"
              [subtitle]="'Offline'">
            </cometchat-list-item>
          </div>
        </div>

        <ng-template #tailTimestamp>
          <span style="font: var(--cometchat-font-caption1-medium); color: var(--cometchat-text-color-secondary);">3:42 PM</span>
        </ng-template>

        <ng-template #tailTimestampOlder>
          <span style="font: var(--cometchat-font-caption1-medium); color: var(--cometchat-text-color-secondary);">Yesterday</span>
        </ng-template>

      </div>
    `,
    props: {
      avatarUser1: MOCK_AVATARS.andrewJoseph,
      avatarUser2: undefined,
      avatarUser3: undefined,
      avatarUser4: undefined,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all list item variants — default with avatar image, name initials fallback, trailing content, selected state, and multiple items in a list — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
