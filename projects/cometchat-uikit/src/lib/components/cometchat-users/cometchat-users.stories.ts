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
import { within, expect, waitFor } from 'storybook/test';
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

/**
 * The users service holds its shimmer for at least 1s on the first fetch, so
 * fixed sleeps race it. These wait on the rendered state instead.
 */
const LIST_SETTLE = { timeout: 5000 };

/** Resolves with the user rows once the first page has rendered. */
function waitForUserRows(canvasElement: HTMLElement): Promise<Element[]> {
  return waitFor(() => {
    const rows = Array.from(canvasElement.querySelectorAll('.cometchat-users__list-item-wrapper'));
    expect(rows.length).toBeGreaterThan(0);
    return rows;
  }, LIST_SETTLE);
}

/** Resolves once the first fetch has finished, whatever its outcome. */
function waitForUsersFetchSettled(canvasElement: HTMLElement): Promise<void> {
  return waitFor(() => {
    expect(canvasElement.querySelector('.cometchat-users')).not.toBeNull();
    expect(canvasElement.querySelector('.cometchat-users__shimmer')).toBeNull();
  }, LIST_SETTLE);
}

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
    await waitForUserRows(canvasElement);
    // Search bar should NOT be present when hideSearch=true
    expect(canvasElement.querySelector('cometchat-search-bar')).toBeNull();
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
    const canvas = within(canvasElement);
    // Search bar should be visible
    await canvas.findByRole('searchbox', { name: 'Search' }, LIST_SETTLE);
    expect(canvasElement.querySelector('.cometchat-users__search-bar cometchat-search-bar')).not.toBeNull();
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
    await waitForUserRows(canvasElement);
    // Section headers should be present, one per initial letter
    const headers = Array.from(canvasElement.querySelectorAll('.cometchat-users__section-header'));
    expect(headers.length).toBeGreaterThan(0);
    expect(headers[0]).toHaveTextContent('A');
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
    await waitForUserRows(canvasElement);
    // Section headers should NOT be present
    expect(canvasElement.querySelectorAll('.cometchat-users__section-header')).toHaveLength(0);
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
    await waitForUserRows(canvasElement);
    // Status indicators should NOT be present
    expect(canvasElement.querySelectorAll('.cometchat-user-item__status')).toHaveLength(0);
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
    // Empty state content should be visible and announced
    const emptyState = await waitFor(() => {
      const el = canvasElement.querySelector('.cometchat-users__empty-state-view');
      expect(el).not.toBeNull();
      return el!;
    }, LIST_SETTLE);
    expect(emptyState).toHaveAttribute('role', 'status');
    // No user items should be present
    expect(canvasElement.querySelectorAll('.cometchat-users__list-item-wrapper')).toHaveLength(0);
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
    // Error state should be visible and announced, with a retry button
    const errorView = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('.cometchat-users__error-state-view');
      expect(el).not.toBeNull();
      return el!;
    }, LIST_SETTLE);
    expect(errorView).toHaveAttribute('role', 'alert');
    expect(within(errorView).getByRole('button')).toHaveClass('cometchat-users__error-state-view-retry-button');
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
    await waitForUsersFetchSettled(canvasElement);
    // The fetch failed, but hideError=true suppresses the error view
    expect(canvasElement.querySelector('.cometchat-users__error-state-view')).toBeNull();
    expect(canvasElement.querySelectorAll('.cometchat-users__list-item-wrapper')).toHaveLength(0);
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
    await waitForUserRows(canvasElement);
    const root = canvasElement.querySelector('.cometchat-users');
    expect(root).not.toHaveClass('cometchat-users-hide-scrollbar');
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
    await waitForUserRows(canvasElement);
    const root = canvasElement.querySelector('.cometchat-users');
    expect(root).toHaveClass('cometchat-users-hide-scrollbar');
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
    const rows = await waitForUserRows(canvasElement);
    // Every row carries a radio-style selection control
    for (const row of rows) {
      expect(row.querySelector('.cometchat-users__selection-control cometchat-radio-button')).not.toBeNull();
    }
    expect(canvasElement.querySelectorAll('cometchat-checkbox')).toHaveLength(0);
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
    const rows = await waitForUserRows(canvasElement);
    // Every row carries a checkbox-style selection control
    for (const row of rows) {
      expect(row.querySelector('.cometchat-users__selection-control cometchat-checkbox')).not.toBeNull();
    }
    expect(canvasElement.querySelectorAll('cometchat-radio-button')).toHaveLength(0);
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
    await waitForUserRows(canvasElement);
    // No selection controls should be present
    expect(canvasElement.querySelectorAll('.cometchat-users__selection-control')).toHaveLength(0);
    expect(canvasElement.querySelectorAll('cometchat-radio-button, cometchat-checkbox')).toHaveLength(0);
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
    // Component should render its rows with preview enabled
    const rows = await waitForUserRows(canvasElement);
    expect(rows.length).toBe(10);
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
    await waitForUserRows(canvasElement);
    // Every row has a status dot; the online users (every third) are marked online
    expect(canvasElement.querySelectorAll('.cometchat-user-item__status')).toHaveLength(10);
    expect(canvasElement.querySelectorAll('.cometchat-user-item__status--online')).toHaveLength(4);
  },
};
