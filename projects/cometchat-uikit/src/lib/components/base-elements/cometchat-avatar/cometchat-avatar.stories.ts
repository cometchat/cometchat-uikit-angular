/**
 * CometChatAvatar Storybook Stories
 *
 * Interactive stories demonstrating the avatar component variants:
 * - Default avatar with image
 * - Fallback initials display
 * - Single word name initials
 * - Multi-word name initials
 * - Empty name edge case
 * - Broken image URL fallback
 * - All variants showcase
 *
 * @module components/cometchat-avatar
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatAvatarComponent } from './cometchat-avatar.component';

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatAvatarComponent> = {
  title: 'Components/Misc/Avatar',
  component: CometChatAvatarComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    image: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp',
    name: 'John Doe',
  },
  argTypes: {
    image: {
      control: 'text',
      description:
        'URL of the avatar image to be displayed. When provided and valid, the image is shown instead of initials.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
    name: {
      control: 'text',
      description:
        'Name used for generating fallback initials. Multi-word names use first letters of the first two words; single-word names use the first two characters.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
        category: 'Display',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatAvatar displays user profile pictures with automatic fallback to initials. If an image URL is provided and loads successfully, it renders the image. Otherwise, it derives initials from the name — multi-word names use the first letter of each of the first two words, single-word names use the first two characters.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatAvatarComponent>;

// ============================================
// Stories
// ============================================

/** Default avatar with a valid image URL and name. */
export const Default: Story = {
  args: {
    image: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp',
    name: 'John Doe',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default avatar rendered with a valid image URL. The image is displayed and the name is used for the accessible label.',
      },
    },
  },
};

/** Avatar without an image, falling back to initials derived from the name. */
export const Fallback: Story = {
  args: {
    image: '',
    name: 'Jane Smith',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Avatar without an image URL. Falls back to displaying initials "JS" derived from the two-word name "Jane Smith".',
      },
    },
  },
};

/** Avatar with a single-word name showing the first two characters as initials. */
export const SingleWordName: Story = {
  args: {
    image: '',
    name: 'Alice',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Single-word name avatar. Displays "AL" — the first two characters of "Alice" — as the fallback initials.',
      },
    },
  },
};

/** Avatar with a multi-word name showing initials from the first two words. */
export const MultiWordName: Story = {
  args: {
    image: '',
    name: 'Robert James Wilson',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multi-word name avatar. Displays "RJ" — the first letter of "Robert" and "James" — as the fallback initials.',
      },
    },
  },
};

/** Edge case: avatar with an empty name showing no initials. */
export const EmptyName: Story = {
  args: {
    image: '',
    name: '',
  },
  parameters: {
    docs: {
      description: {
        story:
          "Edge case: empty name with no image. The avatar renders with no initials, demonstrating the component's behavior when no user data is available.",
      },
    },
  },
};

/** Edge case: avatar with a broken image URL falling back to initials. */
export const BrokenImage: Story = {
  args: {
    image: 'https://invalid-url-that-will-fail.com/image.jpg',
    name: 'Error User',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: broken image URL. The image fails to load and the component falls back to displaying initials "EU" from the name "Error User".',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all avatar variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-avatar-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-avatar-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Avatar Variants
        </h3>

        <!-- With Image -->
        <div class="cometchat-avatar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-avatar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            With Image
          </p>
          <cometchat-avatar [image]="withImage" [name]="withImageName"></cometchat-avatar>
        </div>

        <!-- Initials (Multi-Word) -->
        <div class="cometchat-avatar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-avatar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Initials — Multi-Word Name (JD)
          </p>
          <cometchat-avatar [name]="multiWordName"></cometchat-avatar>
        </div>

        <!-- Initials (Single Word) -->
        <div class="cometchat-avatar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-avatar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Initials — Single-Word Name (AL)
          </p>
          <cometchat-avatar [name]="singleWordName"></cometchat-avatar>
        </div>

        <!-- Broken Image -->
        <div class="cometchat-avatar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-avatar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Broken Image URL (Fallback to EU)
          </p>
          <cometchat-avatar [image]="brokenImage" [name]="brokenImageName"></cometchat-avatar>
        </div>

        <!-- Empty Name -->
        <div class="cometchat-avatar-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-avatar-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty Name (No Initials)
          </p>
          <cometchat-avatar [name]="emptyName"></cometchat-avatar>
        </div>

      </div>
    `,
    props: {
      withImage: 'https://assets.cometchat.io/sampleapp/v2/users/cometchat-uid-1.webp',
      withImageName: 'With Image',
      multiWordName: 'John Doe',
      singleWordName: 'Alice',
      brokenImage: 'https://invalid-url-that-will-fail.com/image.jpg',
      brokenImageName: 'Error User',
      emptyName: '',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all avatar variants — image, multi-word initials, single-word initials, broken image fallback, and empty name — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
