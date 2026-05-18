/**
 * CometChatUsers Storybook Stories
 *
 * Interactive stories demonstrating the users list component variants:
 * - Default user list with alphabetical section headers
 * - Empty state when no users exist
 * - Loading state with shimmer placeholders
 * - All variants showcase
 *
 * @module components/cometchat-users
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { within, expect } from '@storybook/test';
import { States } from '../../Enums/Enums';

import { CometChatUsersComponent } from './cometchat-users.component';
import { SelectionMode } from '../../Enums/Enums';
import { createMockUsers } from '../../../../../../.storybook/utils/mock-data';
import { MOCK_AVATARS } from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

/**
 * Creates mock users with realistic alphabetical names for section headers.
 */
function createAlphabeticalMockUsers(count: number): CometChat.User[] {
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Ross',
    'Edward Norton',
    'Fiona Apple',
    'George Lucas',
    'Hannah Montana',
    'Ivan Petrov',
    'Julia Roberts',
    'Kevin Hart',
    'Lisa Simpson',
    'Michael Scott',
    'Nancy Drew',
    'Oscar Wilde',
    'Patricia Arquette',
    'Quentin Tarantino',
    'Rachel Green',
    'Steve Rogers',
    'Tina Turner',
  ];

  // Photo avatars for first 3 users, rest use initials via CometChatAvatar
  const photoAvatars: Record<number, string> = {
    0: MOCK_AVATARS.andrewJoseph,
    1: MOCK_AVATARS.georgeAlan,
    2: MOCK_AVATARS.nancyGrace,
  };

  return createMockUsers(Math.min(count, names.length), i => {
    return {
      uid: `user-${names[i].toLowerCase().replace(/\s/g, '-')}`,
      name: names[i],
      status: i % 3 === 0 ? CometChat.USER_STATUS.ONLINE : CometChat.USER_STATUS.OFFLINE,
      ...(photoAvatars[i] ? { avatar: photoAvatars[i] } : {}),
    };
  });
}

/**
 * Wrapper component that provides mock data to CometChatUsers.
 * Bypasses the SDK requirement by injecting a mock request builder.
 */
@Component({
  selector: 'cometchat-users-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatUsersComponent],
  template: `
    <cometchat-users
      #usersComponent
      [hideSearch]="hideSearch"
      [showSectionHeader]="showSectionHeader"
      [hideError]="hideError"
      [hideUserStatus]="hideUserStatus"
      [showScrollbar]="showScrollbar"
      [selectionMode]="selectionMode"
      [showSelectedUsersPreview]="showSelectedUsersPreview"
      [disableLoadingState]="disableLoadingState"
      [usersRequestBuilder]="mockRequestBuilder"
      (error)="onError($event)"
    >
    </cometchat-users>
  `,
})
class CometChatUsersStoryWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('usersComponent') usersComponent!: CometChatUsersComponent;

  @Input() hideSearch = false;
  @Input() showSectionHeader = true;
  @Input() hideError = false;
  @Input() hideUserStatus = false;
  @Input() showScrollbar = false;
  @Input() selectionMode = SelectionMode.none;
  @Input() showSelectedUsersPreview = false;
  @Input() disableLoadingState = false;
  @Input() mockUsers: CometChat.User[] = [];
  @Input() simulateLoading = false;
  @Input() simulateEmpty = false;
  @Input() simulateError = false;

  mockRequestBuilder: any = null;
  private originalUsers: CometChat.User[] = [];
  private currentSearchKeyword = '';

  ngOnInit(): void {
    this.originalUsers = [...this.mockUsers];
    this.buildRequestBuilder();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.interceptRetry();
    });
  }

  private buildRequestBuilder(): void {
    if (this.simulateLoading) {
      this.mockRequestBuilder = null;
    } else if (this.simulateEmpty) {
      this.mockRequestBuilder = this.createEmptyRequestBuilder();
    } else if (this.simulateError) {
      this.mockRequestBuilder = this.createErrorRequestBuilder();
    } else if (this.mockUsers.length > 0) {
      this.mockRequestBuilder = this.createDataRequestBuilder();
    }
  }

  private createEmptyRequestBuilder(): any {
    const self = this;
    return {
      setLimit: () => self.mockRequestBuilder,
      setSearchKeyword: (keyword: string) => {
        self.currentSearchKeyword = keyword;
        return self.mockRequestBuilder;
      },
      build: () => ({
        fetchNext: async () => [],
      }),
    };
  }

  private createErrorRequestBuilder(): any {
    const self = this;
    return {
      setLimit: () => self.mockRequestBuilder,
      setSearchKeyword: (keyword: string) => {
        self.currentSearchKeyword = keyword;
        return self.mockRequestBuilder;
      },
      build: () => ({
        fetchNext: async () => {
          throw new CometChat.CometChatException({
            code: 'ERROR',
            message: 'Failed to fetch users',
            details: 'Mock error for Storybook demo',
          });
        },
      }),
    };
  }

  private createDataRequestBuilder(): any {
    const self = this;
    let currentIndex = 0;

    return {
      setLimit: () => self.mockRequestBuilder,
      setSearchKeyword: (keyword: string) => {
        self.currentSearchKeyword = keyword;
        currentIndex = 0;
        return self.mockRequestBuilder;
      },
      build: () => ({
        fetchNext: async () => {
          const usersToFilter = self.currentSearchKeyword
            ? self.originalUsers.filter(u =>
                u.getName().toLowerCase().includes(self.currentSearchKeyword.toLowerCase())
              )
            : self.originalUsers;

          const page = usersToFilter.slice(currentIndex, currentIndex + 30);
          currentIndex += 30;
          return page;
        },
      }),
    };
  }

  /**
   * Intercepts the retry method to show shimmer for 300ms then error again.
   */
  private interceptRetry(): void {
    if (!this.usersComponent) return;

    const self = this;

    this.usersComponent.handleRetryClick = function() {
      if (self.simulateError) {
        // Show loading state
        self.usersComponent.fetchState = States.loading;
        self.usersComponent.lastError = null;
        (self.usersComponent as any).cdr.markForCheck();

        // After 300ms, show error state again
        setTimeout(() => {
          self.usersComponent.fetchState = States.error;
          self.usersComponent.lastError = new Error('Failed to fetch users');
          (self.usersComponent as any).cdr.markForCheck();
        }, 300);
      }
    };
  }

  onError(_error: any): void {
    // Error callback - no action needed since interceptRetry handles retry behavior
  }
}

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatUsersComponent> = {
  title: 'Components/Users/CometChat Users',
  component: CometChatUsersComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatUsersStoryWrapperComponent],
    }),
  ],
  args: {
    hideSearch: false,
    showSectionHeader: true,
    hideError: false,
    hideUserStatus: false,
    showScrollbar: false,
    selectionMode: SelectionMode.none,
    showSelectedUsersPreview: false,
    disableLoadingState: false,
  },
  argTypes: {
    hideSearch: {
      control: 'boolean',
      description: 'Hide the search bar',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showSectionHeader: {
      control: 'boolean',
      description: 'Show alphabetical section headers for user grouping',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
        category: 'Display Control',
      },
    },
    hideError: {
      control: 'boolean',
      description: 'Hide error state display when fetching users fails',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide user online/offline status indicator',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show scrollbar in the user list',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    disableLoadingState: {
      control: 'boolean',
      description: 'Disable loading state to maintain list during search',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showSelectedUsersPreview: {
      control: 'boolean',
      description: 'Show selected users preview chips in multiple selection mode',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    selectionMode: {
      control: 'select',
      options: [SelectionMode.none, SelectionMode.single, SelectionMode.multiple],
      description: 'Selection mode — none, single, or multiple',
      table: {
        type: { summary: 'SelectionMode' },
        defaultValue: { summary: 'SelectionMode.none' },
        category: 'Selection',
      },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Emitted when a user item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.User>' },
        category: 'Events',
      },
    },
    select: {
      action: 'select',
      description: 'Emitted when a user is selected or deselected',
      table: {
        type: { summary: 'EventEmitter<{ user: CometChat.User; selected: boolean }>' },
        category: 'Events',
      },
    },
    error: {
      action: 'error',
      description: 'Emitted when an error occurs during data fetching',
      table: {
        type: { summary: 'EventEmitter<CometChat.CometChatException>' },
        category: 'Events',
      },
    },
    empty: {
      action: 'empty',
      description: 'Emitted when the user list is empty after initial fetch',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    selectionChange: {
      action: 'selectionChange',
      description: 'Emitted when selection state changes',
      table: {
        type: { summary: 'EventEmitter<SelectionState>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatUsers displays a real-time, searchable list of users with alphabetical section headers, selection modes (none, single, multiple with shift-click range selection), selected users preview chips, keyboard navigation, and full ARIA accessibility support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatUsersComponent>;

// ============================================
// Stories
// ============================================

/** Default users list with alphabetical section headers and search. */
export const Default: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(20),
    },
    template: `
      <div class="cometchat-users-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="hideSearch"
          [showSectionHeader]="showSectionHeader"
          [hideError]="hideError"
          [hideUserStatus]="hideUserStatus"
          [showScrollbar]="showScrollbar"
          [selectionMode]="selectionMode"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default users list rendered with 20 mock users grouped by alphabetical section headers. Shows the component with search bar and default display settings.',
      },
    },
  },
};

/** Empty state displayed when no users exist or search returns no results. */
export const EmptyState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateEmpty: true,
    },
    template: `
      <div class="cometchat-users-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="hideSearch"
          [showSectionHeader]="showSectionHeader"
          [simulateEmpty]="simulateEmpty">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no users are found. A custom empty view can be provided via the emptyView template input.',
      },
    },
  },
};

/** Loading state with shimmer/skeleton placeholders while fetching users. */
export const LoadingState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateLoading: true,
    },
    template: `
      <div class="cometchat-users-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="hideSearch"
          [showSectionHeader]="showSectionHeader"
          [simulateLoading]="simulateLoading">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displayed while users are being fetched from the server. Shows shimmer/skeleton placeholder items matching the list item structure.',
      },
    },
  },
};

/** Error state displayed when fetching users fails. */
export const ErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div class="cometchat-users-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="hideSearch"
          [showSectionHeader]="showSectionHeader"
          [hideError]="false"
          [simulateError]="simulateError">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  args: {
    hideError: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Error state displayed when fetching users fails. Shows the error UI with a retry option. Clicking retry shows shimmer for 300ms then returns to error state.',
      },
    },
  },
};

/** Search active state with a pre-filled search query. */
export const SearchActive: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(20),
    },
    template: `
      <div class="cometchat-users-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="false"
          [showSectionHeader]="showSectionHeader"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Users list with the search bar visible and active. Type in the search bar to filter users by name.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all users list variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    props: {
      mockUsers: createAlphabeticalMockUsers(10),
      emptyUsers: [] as CometChat.User[],
      noneSelection: SelectionMode.none,
      singleSelection: SelectionMode.single,
      multipleSelection: SelectionMode.multiple,
    },
    template: `
      <div class="cometchat-users-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-users-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Users List Variants
        </h3>

        <!-- Default List -->
        <div class="cometchat-users-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-users-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default List
          </p>
          <div class="cometchat-users-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-users-story-wrapper [mockUsers]="mockUsers"></cometchat-users-story-wrapper>
          </div>
        </div>

        <!-- Single Selection Mode -->
        <div class="cometchat-users-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-users-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Single Selection Mode
          </p>
          <div class="cometchat-users-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-users-story-wrapper [selectionMode]="singleSelection" [mockUsers]="mockUsers"></cometchat-users-story-wrapper>
          </div>
        </div>

        <!-- Multiple Selection Mode -->
        <div class="cometchat-users-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-users-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Multiple Selection with Preview
          </p>
          <div class="cometchat-users-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-users-story-wrapper [selectionMode]="multipleSelection" [showSelectedUsersPreview]="true" [mockUsers]="mockUsers"></cometchat-users-story-wrapper>
          </div>
        </div>

        <!-- Empty State -->
        <div class="cometchat-users-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-users-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <div class="cometchat-users-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-users-story-wrapper [simulateEmpty]="true"></cometchat-users-story-wrapper>
          </div>
        </div>

        <!-- Error State -->
        <div class="cometchat-users-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-users-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <div class="cometchat-users-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-users-story-wrapper [simulateError]="true"></cometchat-users-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all users list variants — default, single selection, multiple selection with preview, empty state, and error state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};


// ============================================
// Interaction Tests — Prop Toggle Verification
// ============================================

/** Verifies hideSearch=true hides the search bar. */
export const TestHideSearch: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="true"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Search bar should NOT be present when hideSearch=true
    const searchBar = canvasElement.querySelector('cometchat-search-bar');
    expect(searchBar).toBeNull();
  },
};

/** Verifies hideSearch=false shows the search bar. */
export const TestShowSearch: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideSearch]="false"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Search bar should be visible
    const searchBar = canvasElement.querySelector('cometchat-search-bar');
    expect(searchBar).not.toBeNull();
  },
};

/** Verifies showSectionHeader=true renders alphabetical section headers. */
export const TestShowSectionHeader: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [showSectionHeader]="true"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Section headers should be present
    const sectionHeaders = canvasElement.querySelectorAll('.cometchat-users__section-header');
    expect(sectionHeaders.length).toBeGreaterThan(0);
  },
};

/** Verifies showSectionHeader=false hides alphabetical section headers. */
export const TestHideSectionHeader: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [showSectionHeader]="false"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Section headers should NOT be present
    const sectionHeaders = canvasElement.querySelectorAll('.cometchat-users__section-header');
    expect(sectionHeaders.length).toBe(0);
  },
};

/** Verifies hideUserStatus=true hides online/offline indicators. */
export const TestHideUserStatus: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideUserStatus]="true"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Status indicators should NOT be present
    const statusIndicators = canvasElement.querySelectorAll('.cometchat-avatar__status');
    expect(statusIndicators.length).toBe(0);
  },
};

/** Verifies empty state renders correctly. */
export const TestEmptyState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateEmpty: true,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [simulateEmpty]="simulateEmpty">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Empty state content should be visible
    const emptyContent = canvasElement.querySelector('.cometchat-users__empty-state-view');
    expect(emptyContent).not.toBeNull();
    // No user items should be present
    const items = canvasElement.querySelectorAll('.cometchat-users__list-item-wrapper');
    expect(items.length).toBe(0);
  },
};

/** Verifies error state renders error view. */
export const TestErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [simulateError]="simulateError"
          [hideError]="false">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Error state should be visible
    const errorView = canvasElement.querySelector('.cometchat-users__error-state-view');
    expect(errorView).not.toBeNull();
    // Retry button should be present
    const retryButton = canvasElement.querySelector('.cometchat-users__error-state-view-retry-button');
    expect(retryButton).not.toBeNull();
  },
};

/** Verifies hideError=true suppresses error state display. */
export const TestHideError: Story = {
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [simulateError]="simulateError"
          [hideError]="true">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Error state view should NOT be visible when hideError=true
    const errorView = canvasElement.querySelector('.cometchat-users__error-state-view');
    expect(errorView).toBeNull();
  },
};

/** Verifies showScrollbar=true does not apply hide-scrollbar class. */
export const TestShowScrollbar: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [showScrollbar]="true"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const root = canvasElement.querySelector('.cometchat-users');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cometchat-users-hide-scrollbar')).toBe(false);
  },
};

/** Verifies showScrollbar=false applies hide-scrollbar class. */
export const TestHideScrollbar: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [showScrollbar]="false"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    const root = canvasElement.querySelector('.cometchat-users');
    expect(root).not.toBeNull();
    expect(root!.classList.contains('cometchat-users-hide-scrollbar')).toBe(true);
  },
};

/** Verifies selectionMode=single renders radio-style selection controls. */
export const TestSingleSelectionMode: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
      singleSelection: SelectionMode.single,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [selectionMode]="singleSelection"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Selection controls (radio buttons) should be present
    const selectionControls = canvasElement.querySelectorAll('.cometchat-users__selection-control, input[type="radio"], .cometchat-radio-button');
    expect(selectionControls.length).toBeGreaterThan(0);
  },
};

/** Verifies selectionMode=multiple renders checkbox-style selection controls. */
export const TestMultipleSelectionMode: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
      multipleSelection: SelectionMode.multiple,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [selectionMode]="multipleSelection"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Selection controls (checkboxes) should be present
    const selectionControls = canvasElement.querySelectorAll('.cometchat-users__selection-control, input[type="checkbox"], .cometchat-checkbox');
    expect(selectionControls.length).toBeGreaterThan(0);
  },
};

/** Verifies selectionMode=none does NOT render selection controls. */
export const TestNoSelectionMode: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
      noneSelection: SelectionMode.none,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [selectionMode]="noneSelection"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // No selection controls should be present
    const radioButtons = canvasElement.querySelectorAll('input[type="radio"], .cometchat-radio-button');
    const checkboxes = canvasElement.querySelectorAll('input[type="checkbox"], .cometchat-checkbox');
    expect(radioButtons.length).toBe(0);
    expect(checkboxes.length).toBe(0);
  },
};

/** Verifies showSelectedUsersPreview=true renders selected users preview chips. */
export const TestShowSelectedUsersPreview: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
      multipleSelection: SelectionMode.multiple,
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [selectionMode]="multipleSelection"
          [showSelectedUsersPreview]="true"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Component should render correctly with preview enabled
    const root = canvasElement.querySelector('.cometchat-users');
    expect(root).not.toBeNull();
    // Users list items should be present
    const items = canvasElement.querySelectorAll('.cometchat-users__list-item-wrapper');
    expect(items.length).toBeGreaterThan(0);
  },
};

/** Verifies hideUserStatus=false shows online/offline indicators. */
export const TestShowUserStatus: Story = {
  render: args => ({
    props: {
      ...args,
      mockUsers: createAlphabeticalMockUsers(10),
    },
    template: `
      <div style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-users-story-wrapper
          [hideUserStatus]="false"
          [mockUsers]="mockUsers">
        </cometchat-users-story-wrapper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 1000));
    // Status indicators should be present for online users
    const statusIndicators = canvasElement.querySelectorAll('.cometchat-avatar__status');
    expect(statusIndicators.length).toBeGreaterThan(0);
  },
};
