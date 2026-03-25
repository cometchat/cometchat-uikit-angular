/**
 * CometChatGroups Storybook Stories
 *
 * Interactive stories demonstrating the groups list component variants:
 * - Default group list with type indicators and member counts
 * - Empty state when no groups exist
 * - Loading state with shimmer placeholders
 * - All variants showcase
 *
 * @module components/cometchat-groups
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../../Enums/Enums';

import { CometChatGroupsComponent } from './cometchat-groups.component';
import { SelectionMode } from '../../Enums/Enums';
import { createMockGroups } from '../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Classes
// ============================================

/**
 * Creates mock groups with realistic team names for display.
 */
function createRealisticMockGroups(count: number): CometChat.Group[] {
  const names = [
    'Design Team',
    'Engineering',
    'Marketing',
    'Sales Team',
    'Product Management',
    'Customer Support',
    'HR Department',
    'Finance',
    'Research & Development',
    'Quality Assurance',
    'DevOps',
    'Data Science',
    'Mobile Team',
    'Web Team',
    'Backend Team',
    'Frontend Team',
    'Security Team',
    'Infrastructure',
    'Analytics',
    'Growth Team',
  ];

  const types = [
    CometChat.GROUP_TYPE.PUBLIC,
    CometChat.GROUP_TYPE.PRIVATE,
    CometChat.GROUP_TYPE.PASSWORD,
  ];

  return createMockGroups(Math.min(count, names.length), i => {
    const initials = names[i].split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
    return {
      guid: `group-${names[i].toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')}`,
      name: names[i],
      type: types[i % 3],
      membersCount: 3 + i * 2,
    };
  });
}

/**
 * Wrapper component that provides mock data to CometChatGroups.
 * Bypasses the SDK requirement by injecting a mock request builder.
 */
@Component({
  selector: 'cometchat-groups-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatGroupsComponent],
  template: `
    <cometchat-groups
      #groupsComponent
      [hideSearch]="hideSearch"
      [hideError]="hideError"
      [hideGroupType]="hideGroupType"
      [showScrollbar]="showScrollbar"
      [selectionMode]="selectionMode"
      [groupsRequestBuilder]="mockRequestBuilder"
      (error)="onError($event)"
    >
    </cometchat-groups>
  `,
})
class CometChatGroupsStoryWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('groupsComponent') groupsComponent!: CometChatGroupsComponent;

  @Input() hideSearch = false;
  @Input() hideError = false;
  @Input() hideGroupType = false;
  @Input() showScrollbar = false;
  @Input() selectionMode = SelectionMode.none;
  @Input() mockGroups: CometChat.Group[] = [];
  @Input() simulateLoading = false;
  @Input() simulateEmpty = false;
  @Input() simulateError = false;

  mockRequestBuilder: any = null;
  private originalGroups: CometChat.Group[] = [];
  private currentSearchKeyword = '';

  ngOnInit(): void {
    this.originalGroups = [...this.mockGroups];
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
    } else if (this.mockGroups.length > 0) {
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
            message: 'Failed to fetch groups',
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
          const groupsToFilter = self.currentSearchKeyword
            ? self.originalGroups.filter(g =>
                g.getName().toLowerCase().includes(self.currentSearchKeyword.toLowerCase())
              )
            : self.originalGroups;

          const page = groupsToFilter.slice(currentIndex, currentIndex + 30);
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
    if (!this.groupsComponent) return;

    const self = this;

    this.groupsComponent.handleRetryClick = function() {
      if (self.simulateError) {
        // Show loading state
        self.groupsComponent.fetchState = States.loading;
        self.groupsComponent.lastError = null;
        (self.groupsComponent as any).cdr.markForCheck();

        // After 300ms, show error state again
        setTimeout(() => {
          self.groupsComponent.fetchState = States.error;
          self.groupsComponent.lastError = new Error('Failed to fetch groups');
          (self.groupsComponent as any).cdr.markForCheck();
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

const meta: Meta<CometChatGroupsComponent> = {
  title: 'Components/Groups/CometChat Groups',
  component: CometChatGroupsComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatGroupsStoryWrapperComponent],
    }),
  ],
  args: {
    hideSearch: false,
    hideError: false,
    hideGroupType: false,
    showScrollbar: false,
    selectionMode: SelectionMode.none,
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
    hideError: {
      control: 'boolean',
      description: 'Hide error state display when fetching groups fails',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideGroupType: {
      control: 'boolean',
      description: 'Hide group type icon (public/private/password)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show scrollbar in the group list',
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
      description: 'Emitted when a group item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.Group>' },
        category: 'Events',
      },
    },
    select: {
      action: 'select',
      description: 'Emitted when a group is selected or deselected',
      table: {
        type: { summary: 'EventEmitter<{ group: CometChat.Group; selected: boolean }>' },
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
          'CometChatGroups displays a real-time, searchable list of groups with type indicators (public, private, password-protected), member counts, selection modes (none, single, multiple), keyboard navigation, and full ARIA accessibility support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatGroupsComponent>;

// ============================================
// Stories
// ============================================

/** Default groups list with type indicators, member counts, and search. */
export const Default: Story = {
  render: args => ({
    props: {
      ...args,
      mockGroups: createRealisticMockGroups(15),
    },
    template: `
      <div class="cometchat-groups-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-groups-story-wrapper
          [hideSearch]="hideSearch"
          [hideError]="hideError"
          [hideGroupType]="hideGroupType"
          [showScrollbar]="showScrollbar"
          [selectionMode]="selectionMode"
          [mockGroups]="mockGroups">
        </cometchat-groups-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default groups list rendered with 15 mock groups showing public, private, and password-protected type indicators. Includes search bar and default display settings.',
      },
    },
  },
};

/** Empty state displayed when no groups exist or search returns no results. */
export const EmptyState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateEmpty: true,
    },
    template: `
      <div class="cometchat-groups-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-groups-story-wrapper
          [hideSearch]="hideSearch"
          [hideGroupType]="hideGroupType"
          [simulateEmpty]="simulateEmpty">
        </cometchat-groups-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no groups are found. A custom empty view can be provided via the emptyView template input.',
      },
    },
  },
};

/** Loading state with shimmer/skeleton placeholders while fetching groups. */
export const LoadingState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateLoading: true,
    },
    template: `
      <div class="cometchat-groups-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-groups-story-wrapper
          [hideSearch]="hideSearch"
          [hideGroupType]="hideGroupType"
          [simulateLoading]="simulateLoading">
        </cometchat-groups-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displayed while groups are being fetched from the server. Shows shimmer/skeleton placeholder items matching the list item structure.',
      },
    },
  },
};

/** Error state displayed when fetching groups fails. */
export const ErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div class="cometchat-groups-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-groups-story-wrapper
          [hideSearch]="hideSearch"
          [hideGroupType]="hideGroupType"
          [hideError]="false"
          [simulateError]="simulateError">
        </cometchat-groups-story-wrapper>
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
          'Error state displayed when fetching groups fails. Shows the error UI with a retry option. Clicking retry shows shimmer for 300ms then returns to error state.',
      },
    },
  },
};

/** Groups list showing only password-protected groups. */
export const PasswordGroup: Story = {
  render: args => ({
    props: {
      ...args,
      mockGroups: createRealisticMockGroups(20).filter(
        g => g.getType() === CometChat.GROUP_TYPE.PASSWORD
      ),
    },
    template: `
      <div class="cometchat-groups-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-groups-story-wrapper
          [hideSearch]="hideSearch"
          [hideGroupType]="hideGroupType"
          [mockGroups]="mockGroups">
        </cometchat-groups-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Groups list showing password-protected groups. These groups display a lock icon indicating a password is required to join.',
      },
    },
  },
};

/** Groups list showing only private groups. */
export const PrivateGroup: Story = {
  render: args => ({
    props: {
      ...args,
      mockGroups: createRealisticMockGroups(20).filter(
        g => g.getType() === CometChat.GROUP_TYPE.PRIVATE
      ),
    },
    template: `
      <div class="cometchat-groups-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-groups-story-wrapper
          [hideSearch]="hideSearch"
          [hideGroupType]="hideGroupType"
          [mockGroups]="mockGroups">
        </cometchat-groups-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Groups list showing private groups. These groups display a private indicator and are invite-only.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all groups list variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    props: {
      mockGroups: createRealisticMockGroups(10),
      noneSelection: SelectionMode.none,
      singleSelection: SelectionMode.single,
      multipleSelection: SelectionMode.multiple,
    },
    template: `
      <div class="cometchat-groups-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-groups-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Groups List Variants
        </h3>

        <!-- Default List -->
        <div class="cometchat-groups-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-groups-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default List
          </p>
          <div class="cometchat-groups-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-groups-story-wrapper [mockGroups]="mockGroups"></cometchat-groups-story-wrapper>
          </div>
        </div>

        <!-- Single Selection Mode -->
        <div class="cometchat-groups-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-groups-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Single Selection Mode
          </p>
          <div class="cometchat-groups-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-groups-story-wrapper [selectionMode]="singleSelection" [mockGroups]="mockGroups"></cometchat-groups-story-wrapper>
          </div>
        </div>

        <!-- Multiple Selection Mode -->
        <div class="cometchat-groups-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-groups-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Multiple Selection Mode
          </p>
          <div class="cometchat-groups-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-groups-story-wrapper [selectionMode]="multipleSelection" [mockGroups]="mockGroups"></cometchat-groups-story-wrapper>
          </div>
        </div>

        <!-- Empty State -->
        <div class="cometchat-groups-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-groups-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <div class="cometchat-groups-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-groups-story-wrapper [simulateEmpty]="true"></cometchat-groups-story-wrapper>
          </div>
        </div>

        <!-- Error State -->
        <div class="cometchat-groups-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-groups-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <div class="cometchat-groups-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-groups-story-wrapper [simulateError]="true"></cometchat-groups-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all groups list variants — default, single selection, multiple selection, empty state, and error state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
      story: { inline: false, iframeHeight: 600 },
    },
  },
};
