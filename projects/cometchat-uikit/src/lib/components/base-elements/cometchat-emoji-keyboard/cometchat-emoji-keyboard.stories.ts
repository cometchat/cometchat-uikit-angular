/**
 * CometChatEmojiKeyboard Storybook Stories
 *
 * Interactive stories demonstrating the emoji keyboard component variants:
 * - Default keyboard with all emoji categories
 * - Emoji selection interaction
 * - All variants showcase
 *
 * @module components/cometchat-emoji-keyboard
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatEmojiKeyboardComponent } from './cometchat-emoji-keyboard.component';
import { CometChatEmojiCategory } from '../../../modals/CometChatEmoji';

// ============================================
// Mock Data
// ============================================

/**
 * Creates a minimal set of mock emoji categories for stories
 * that need explicit emojiData rather than the built-in defaults.
 */
function createMockEmojiCategories(): CometChatEmojiCategory[] {
  return [
    {
      id: 'people',
      name: 'People & Faces',
      symbolURL: '',
      emojies: {
        grinning_face: { char: '😀', keywords: ['grinning', 'face', 'happy'] },
        laughing: { char: '😂', keywords: ['laughing', 'tears', 'joy'] },
        heart_eyes: { char: '😍', keywords: ['heart', 'eyes', 'love'] },
        thinking: { char: '🤔', keywords: ['thinking', 'hmm'] },
        thumbs_up: { char: '👍', keywords: ['thumbs', 'up', 'approve'] },
        waving_hand: { char: '👋', keywords: ['wave', 'hello', 'hi'] },
      },
    },
    {
      id: 'nature',
      name: 'Animals & Nature',
      symbolURL: '',
      emojies: {
        dog: { char: '🐶', keywords: ['dog', 'puppy', 'pet'] },
        cat: { char: '🐱', keywords: ['cat', 'kitten', 'pet'] },
        sun: { char: '☀️', keywords: ['sun', 'sunny', 'weather'] },
        rainbow: { char: '🌈', keywords: ['rainbow', 'colors'] },
      },
    },
    {
      id: 'food',
      name: 'Food & Drink',
      symbolURL: '',
      emojies: {
        pizza: { char: '🍕', keywords: ['pizza', 'food'] },
        coffee: { char: '☕', keywords: ['coffee', 'drink', 'hot'] },
        cake: { char: '🎂', keywords: ['cake', 'birthday'] },
      },
    },
  ];
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatEmojiKeyboardComponent> = {
  title: 'Components/Misc/Emoji Keyboard',
  component: CometChatEmojiKeyboardComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    emojiData: [],
    ariaLabel: '',
    autoFocus: true,
    trapFocus: false,
  },
  argTypes: {
    emojiData: {
      control: 'object',
      description:
        'Array of emoji categories to display. When empty, the component loads its built-in default emoji set.',
      table: {
        type: { summary: 'CometChatEmojiCategory[]' },
        defaultValue: { summary: '[]' },
      },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Custom ARIA label for the emoji picker dialog. Falls back to a localized default when empty.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    autoFocus: {
      control: 'boolean',
      description: 'Whether to automatically focus the first category tab when the keyboard opens',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    trapFocus: {
      control: 'boolean',
      description:
        'Whether to trap keyboard focus within the emoji keyboard using FocusTrapService',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    emojiClick: {
      action: 'emojiClick',
      description: 'Emitted when an emoji is clicked — emits the emoji character string',
      table: {
        type: { summary: 'EventEmitter<string>' },
        category: 'Events',
      },
    },
    closeKeyboard: {
      action: 'closeKeyboard',
      description: 'Emitted when the Escape key is pressed to close the picker',
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
          'CometChatEmojiKeyboard provides a full-featured emoji picker with categorized tabs, search filtering, keyboard grid navigation (arrow keys), roving tabindex, focus trapping, and screen reader announcements. Press "/" to focus search, Escape to close.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatEmojiKeyboardComponent>;

// ============================================
// Stories
// ============================================

/** Default emoji keyboard using the built-in emoji data set with all categories. */
export const Default: Story = {
  args: {
    emojiData: [],
    ariaLabel: 'Emoji picker',
    autoFocus: true,
    trapFocus: false,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:420px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-emoji-keyboard
          [emojiData]="emojiData"
          [ariaLabel]="ariaLabel"
          [autoFocus]="autoFocus"
          [trapFocus]="trapFocus">
        </cometchat-emoji-keyboard>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Default emoji keyboard rendered with the built-in emoji data. All categories are loaded automatically. Use the search bar or category tabs to navigate.',
      },
    },
  },
};

/** Emoji keyboard demonstrating emoji selection with a custom category set. */
export const EmojiSelection: Story = {
  args: {
    emojiData: createMockEmojiCategories(),
    ariaLabel: 'Select an emoji',
    autoFocus: true,
    trapFocus: false,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:420px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-emoji-keyboard
          [emojiData]="emojiData"
          [ariaLabel]="ariaLabel"
          [autoFocus]="autoFocus"
          [trapFocus]="trapFocus">
        </cometchat-emoji-keyboard>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Emoji keyboard with a custom subset of emoji categories passed via the emojiData input. Click any emoji to trigger the emojiClick event. Demonstrates how to provide custom emoji data.',
      },
    },
  },
};

/** Emoji keyboard with a specific category pre-selected. */
export const CategorySelected: Story = {
  args: {
    emojiData: createMockEmojiCategories(),
    ariaLabel: 'Emoji picker — Nature category',
    autoFocus: true,
    trapFocus: false,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:420px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-emoji-keyboard
          [emojiData]="emojiData"
          [ariaLabel]="ariaLabel"
          [autoFocus]="autoFocus"
          [trapFocus]="trapFocus">
        </cometchat-emoji-keyboard>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Emoji keyboard with a custom category set. Click the category tabs to switch between People, Nature, and Food categories. Demonstrates category navigation.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of emoji keyboard variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:500px; min-height:500px; overflow:visible; padding: var(--cometchat-spacing-5);">
        <div class="cometchat-emoji-keyboard-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5);">

          <h3 class="cometchat-emoji-keyboard-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
            Emoji Keyboard Variants
          </h3>

          <!-- Default (built-in emojis) -->
          <div class="cometchat-emoji-keyboard-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
            <p class="cometchat-emoji-keyboard-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Default (Built-in Emoji Data)
            </p>
            <cometchat-emoji-keyboard
              [ariaLabel]="'Default emoji picker'"
              [autoFocus]="false"
              [trapFocus]="false"
            ></cometchat-emoji-keyboard>
          </div>

          <!-- Custom emoji data -->
          <div class="cometchat-emoji-keyboard-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
            <p class="cometchat-emoji-keyboard-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Custom Emoji Categories
            </p>
            <cometchat-emoji-keyboard
              [emojiData]="customCategories"
              [ariaLabel]="'Custom emoji picker'"
              [autoFocus]="false"
              [trapFocus]="false"
            ></cometchat-emoji-keyboard>
          </div>

        </div>
      </div>
    `,
    props: {
      customCategories: createMockEmojiCategories(),
    },
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying emoji keyboard variants — default built-in emoji set and custom emoji categories — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
