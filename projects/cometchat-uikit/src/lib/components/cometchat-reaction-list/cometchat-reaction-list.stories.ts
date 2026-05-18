/**
 * CometChatReactionList Storybook Stories
 *
 * Uses a wrapper component to bypass SDK fetch and set internal
 * signal state directly, allowing stories to render without live API calls.
 *
 * @module components/cometchat-reaction-list
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CometChatReactionListComponent } from './cometchat-reaction-list.component';
import { createMockMessage, MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';
import { within, expect } from '@storybook/test';

// ============================================
// Mock Helpers
// ============================================

class MockUser {
  constructor(
    private uid: string,
    private name: string,
    private avatar = ''
  ) {}
  getUid(): string { return this.uid; }
  getName(): string { return this.name; }
  getAvatar(): string { return this.avatar; }
}

class MockReaction {
  constructor(
    private emoji: string,
    private reactedBy: MockUser
  ) {}
  getReaction(): string { return this.emoji; }
  getReactedBy(): MockUser { return this.reactedBy; }
}

const PHOTO_MAP: Record<string, string> = {
  'Alice': MOCK_AVATARS.nancyGrace,
  'Bob': MOCK_AVATARS.georgeAlan,
  'Charlie': MOCK_AVATARS.andrewJoseph,
};

function createStoryReaction(emoji: string, uid: string, name: string): MockReaction {
  return new MockReaction(
    emoji,
    new MockUser(uid, name, PHOTO_MAP[name])
  );
}

function populateReactions(comp: CometChatReactionListComponent, reactions: MockReaction[]): void {
  (comp as any).allReactions.set(reactions);
  const grouped = new Map<string, MockReaction[]>();
  for (const reaction of reactions) {
    const emoji = reaction.getReaction();
    if (!grouped.has(emoji)) {
      grouped.set(emoji, []);
    }
    grouped.get(emoji)!.push(reaction);
  }
  comp.groupedReactions.set(grouped as any);
}

const SAMPLE_REACTIONS_FEW = [
  createStoryReaction('👍', 'user-1', 'Alice'),
  createStoryReaction('👍', 'user-2', 'Bob'),
  createStoryReaction('👍', 'user-3', 'Charlie'),
  createStoryReaction('❤️', 'user-4', 'Diana'),
  createStoryReaction('❤️', 'user-5', 'Eve'),
  createStoryReaction('😂', 'user-6', 'Frank'),
  createStoryReaction('😮', 'user-7', 'Grace'),
];

const SAMPLE_REACTIONS_MANY = [
  ...SAMPLE_REACTIONS_FEW,
  createStoryReaction('😢', 'user-8', 'Hank'),
  createStoryReaction('🔥', 'user-9', 'Ivy'),
  createStoryReaction('🔥', 'user-10', 'Jack'),
  createStoryReaction('👏', 'user-11', 'Kate'),
  createStoryReaction('🎉', 'user-12', 'Leo'),
  createStoryReaction('🎉', 'user-13', 'Mia'),
  createStoryReaction('🎉', 'user-14', 'Noah'),
];

// ============================================
// Wrapper Component
// ============================================

@Component({
  selector: 'storybook-reaction-list-wrapper',
  standalone: true,
  imports: [CometChatReactionListComponent],
  template: `
    <cometchat-reaction-list
      [message]="mockMessage"
      (itemClick)="onItemClick($event)"
      (empty)="onEmpty()">
    </cometchat-reaction-list>
  `,
})
class ReactionListWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild(CometChatReactionListComponent)
  reactionList!: CometChatReactionListComponent;

  @Input() mockReactions: MockReaction[] = [];
  @Input() mockLoading = false;
  @Input() mockError = false;

  @Output() itemClick = new EventEmitter<any>();
  @Output() empty = new EventEmitter<void>();

  mockMessage = createMockMessage('text', { id: 300, text: 'Message with reactions' });

  private initialized = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.applyState();
      this.interceptRetry();
      this.initialized = true;
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.initialized) {
      this.applyState();
    }
  }

  private applyState(): void {
    (this.reactionList as any).loggedInUserUid = 'user-1';

    if (this.mockLoading) {
      this.reactionList.isLoading.set(true);
      this.reactionList.hasError.set(false);
      (this.reactionList as any).allReactions.set([]);
      this.reactionList.groupedReactions.set(new Map());
    } else if (this.mockError) {
      this.reactionList.isLoading.set(false);
      this.reactionList.hasError.set(true);
      (this.reactionList as any).allReactions.set([]);
      this.reactionList.groupedReactions.set(new Map());
    } else {
      this.reactionList.isLoading.set(false);
      this.reactionList.hasError.set(false);
      this.reactionList.hasMoreReactions.set(false);
      populateReactions(this.reactionList, this.mockReactions);
    }
  }

  /**
   * Intercepts the retry method to show shimmer for 300ms then error again.
   */
  private interceptRetry(): void {
    if (!this.reactionList) return;

    const originalRetry = this.reactionList.retry.bind(this.reactionList);
    const self = this;

    this.reactionList.retry = function() {
      if (self.mockError) {
        // Show loading state
        self.reactionList.isLoading.set(true);
        self.reactionList.hasError.set(false);

        // After 300ms, show error state again
        setTimeout(() => {
          self.reactionList.isLoading.set(false);
          self.reactionList.hasError.set(true);
        }, 300);
      } else {
        // Call original retry if not in mock error mode
        originalRetry();
      }
    };
  }

  onItemClick(event: any): void { this.itemClick.emit(event); }
  onEmpty(): void { this.empty.emit(); }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta = {
  title: 'Components/Misc/Reaction List',
  decorators: [
    moduleMetadata({
      imports: [CommonModule, ReactionListWrapperComponent],
    }),
  ],
  tags: ['autodocs'],
  args: {
    reactions: SAMPLE_REACTIONS_FEW,
    isLoading: false,
    hasError: false,
  },
  argTypes: {
    reactions: {
      control: false,
      description: 'Array of mock Reaction objects to populate the list.',
      table: { type: { summary: 'MockReaction[]' }, category: 'Data' },
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading shimmer state.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'State' },
    },
    hasError: {
      control: 'boolean',
      description: 'Show error state with retry button.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' }, category: 'State' },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when a reaction item (user row) is clicked to remove own reaction.',
      table: { type: { summary: 'EventEmitter<{ reaction, message }>' }, category: 'Events' },
    },
    empty: {
      action: 'empty',
      description: 'Emitted when the reaction list becomes empty after removal.',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatReactionList displays all users who reacted to a message, grouped by emoji type. Features tab-based emoji filtering, user avatars and names, current-user identification with removal hints, and accessible keyboard navigation.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ============================================
// Stories
// ============================================

/** Default loaded state with four emoji groups. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-list-wrapper
        [mockReactions]="reactions"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (itemClick)="itemClick($event)"
        (empty)="empty($event)">
      </storybook-reaction-list-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Default reaction list showing four emoji groups (👍, ❤️, 😂, 😮) with tab-based filtering. User-1 (Alice) is marked as "You" with a click-to-remove hint.',
      },
    },
  },
};

/** Many emoji groups demonstrating tab overflow. */
export const ManyReactions: Story = {
  args: { reactions: SAMPLE_REACTIONS_MANY, isLoading: false, hasError: false },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-list-wrapper
        [mockReactions]="reactions"
        [mockLoading]="isLoading"
        [mockError]="hasError"
        (itemClick)="itemClick($event)"
        (empty)="empty($event)">
      </storybook-reaction-list-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Reaction list with eight different emoji types, demonstrating how the tab bar handles many emoji groups.',
      },
    },
  },
};

/** Loading shimmer state while fetching reactions. */
export const Loading: Story = {
  args: { reactions: [], isLoading: true, hasError: false },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-list-wrapper
        [mockReactions]="reactions"
        [mockLoading]="isLoading"
        [mockError]="hasError">
      </storybook-reaction-list-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Loading shimmer state displayed while reactions are being fetched. Shows four placeholder shimmer rows.',
      },
    },
  },
};

/** Error state with retry button. */
export const Error: Story = {
  args: { reactions: [], isLoading: false, hasError: true },
  render: (args) => ({
    props: args,
    template: `
      <storybook-reaction-list-wrapper
        [mockReactions]="reactions"
        [mockLoading]="isLoading"
        [mockError]="hasError">
      </storybook-reaction-list-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Error state shown when the SDK call to fetch reactions fails. Displays an error message with a retry button.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all reaction list states in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-reaction-list-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-reaction-list-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Reaction List Variants
        </h3>

        <!-- Loaded: Few Reactions -->
        <div class="cometchat-reaction-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded (4 emoji groups)
          </p>
          <storybook-reaction-list-wrapper
            [mockReactions]="fewReactions"
            [mockLoading]="false"
            [mockError]="false">
          </storybook-reaction-list-wrapper>
        </div>

        <!-- Loaded: Many Reactions -->
        <div class="cometchat-reaction-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loaded (8 emoji groups)
          </p>
          <storybook-reaction-list-wrapper
            [mockReactions]="manyReactions"
            [mockLoading]="false"
            [mockError]="false">
          </storybook-reaction-list-wrapper>
        </div>

        <!-- Loading State -->
        <div class="cometchat-reaction-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Loading State
          </p>
          <storybook-reaction-list-wrapper
            [mockReactions]="emptyReactions"
            [mockLoading]="true"
            [mockError]="false">
          </storybook-reaction-list-wrapper>
        </div>

        <!-- Error State -->
        <div class="cometchat-reaction-list-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-reaction-list-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <storybook-reaction-list-wrapper
            [mockReactions]="emptyReactions"
            [mockLoading]="false"
            [mockError]="true">
          </storybook-reaction-list-wrapper>
        </div>

      </div>
    `,
    props: {
      fewReactions: SAMPLE_REACTIONS_FEW,
      manyReactions: SAMPLE_REACTIONS_MANY,
      emptyReactions: [] as MockReaction[],
    },
  }),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive showcase displaying all reaction list states — loaded with few/many emoji groups, loading shimmer, error with retry, and empty — in a single view.',
      },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================


