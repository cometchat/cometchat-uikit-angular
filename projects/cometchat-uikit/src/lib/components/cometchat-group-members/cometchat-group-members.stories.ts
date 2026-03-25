/**
 * CometChatGroupMembers Storybook Stories
 *
 * Interactive stories demonstrating the group members list component variants:
 * - Default members list with role indicators and status
 * - Empty state when no members exist
 * - All variants showcase
 *
 * @module components/cometchat-group-members
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ViewChild, AfterViewInit, TemplateRef } from '@angular/core';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { States } from '../../Enums/Enums';

import { CometChatGroupMembersComponent } from './cometchat-group-members.component';
import { SelectionMode } from '../../Enums/Enums';
// ============================================
// Mock Classes
// ============================================

import {
  createMockGroup,
  createMockGroupMembers,
  MOCK_AVATARS,
} from '../../../../../../.storybook/utils/mock-data';
import { TranslatePipe } from '../../resources/CometChatLocalize';

/**
 * Creates mock group members with realistic names and varied scopes/statuses.
 */
function createRealisticMockMembers(count: number): CometChat.GroupMember[] {
  const names = [
    'Alice Johnson',
    'Bob Smith',
    'Charlie Brown',
    'Diana Prince',
    'Edward Norton',
    'Fiona Apple',
    'George Lucas',
    'Hannah Montana',
    'Ivan Petrov',
    'Julia Roberts',
    'Kevin Hart',
    'Laura Palmer',
    'Michael Scott',
    'Nancy Drew',
    'Oscar Wilde',
  ];

  const photoMap: Record<string, string> = {
    'Alice Johnson': MOCK_AVATARS.nancyGrace,
    'Bob Smith': MOCK_AVATARS.georgeAlan,
    'Charlie Brown': MOCK_AVATARS.andrewJoseph,
  };

  return createMockGroupMembers(Math.min(count, names.length), i => {
    const name = names[i];
    const avatar = photoMap[name];
    return {
      uid: `member-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      status: i % 3 === 0 ? CometChat.USER_STATUS.OFFLINE : CometChat.USER_STATUS.ONLINE,
      ...(avatar ? { avatar } : {}),
    };
  });
}

/**
 * Wrapper component that provides mock data to CometChatGroupMembers.
 * Bypasses the SDK requirement by injecting a mock request builder.
 */
@Component({
  selector: 'cometchat-group-members-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatGroupMembersComponent, TranslatePipe],
  template: `
    <ng-template #titleHeaderTemplate>
      <div class="cometchat-group-members-story__header">
        <h2 class="cometchat-group-members-story__header-title">{{ 'member_title' | translate }}</h2>
      </div>
    </ng-template>

    <cometchat-group-members
      #groupMembersComponent
      [group]="mockGroup"
      [headerView]="showTitle ? titleHeaderTemplate : undefined"
      [hideSearch]="hideSearch"
      [hideError]="hideError"
      [hideUserStatus]="hideUserStatus"
      [showScrollbar]="showScrollbar"
      [selectionMode]="selectionMode"
      [groupMemberRequestBuilder]="mockRequestBuilder"
      (error)="onError($event)"
    >
    </cometchat-group-members>
  `,
  styles: [`
    .cometchat-group-members-story__header {
      padding: 4px 0px 16px 0px;
      border-bottom: 1px solid var(--cometchat-border-color-light);
    }
    .cometchat-group-members-story__header-title {
      margin: 0;
      font: var(--cometchat-font-heading4-bold);
      color: var(--cometchat-text-color-primary);
    }
  `],
})
class CometChatGroupMembersStoryWrapperComponent implements OnInit, AfterViewInit {
  @ViewChild('groupMembersComponent') groupMembersComponent!: CometChatGroupMembersComponent;
  @ViewChild('titleHeaderTemplate') titleHeaderTemplate!: TemplateRef<void>;

  @Input() showTitle = false;
  @Input() hideSearch = false;
  @Input() hideError = false;
  @Input() hideUserStatus = false;
  @Input() showScrollbar = false;
  @Input() selectionMode = SelectionMode.none;
  @Input() mockMembers: CometChat.GroupMember[] = [];
  @Input() simulateEmpty = false;
  @Input() simulateLoading = false;
  @Input() simulateError = false;

  mockGroup!: CometChat.Group;
  mockRequestBuilder: any = null;
  private originalMembers: CometChat.GroupMember[] = [];
  private currentSearchKeyword = '';

  ngOnInit(): void {
    this.originalMembers = [...this.mockMembers];

    this.mockGroup = createMockGroup({
      guid: 'mock-group-1',
      name: 'Design Team',
      type: CometChat.GROUP_TYPE.PUBLIC,
      membersCount: this.mockMembers.length || 0,
      hasJoined: true,
    });

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
    } else if (this.mockMembers.length > 0) {
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
            message: 'Failed to fetch group members',
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
          const membersToFilter = self.currentSearchKeyword
            ? self.originalMembers.filter(m =>
                m.getName().toLowerCase().includes(self.currentSearchKeyword.toLowerCase())
              )
            : self.originalMembers;

          const page = membersToFilter.slice(currentIndex, currentIndex + 30);
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
    if (!this.groupMembersComponent) return;

    const self = this;

    this.groupMembersComponent.handleRetryClick = function() {
      if (self.simulateError) {
        // Access the service's private signal via any cast
        const service = (self.groupMembersComponent as any).groupMembersService;
        
        // Show loading state
        service['fetchStateSignal'].set(States.loading);
        self.groupMembersComponent.lastError = null;
        (self.groupMembersComponent as any).cdr.markForCheck();

        // After 300ms, show error state again
        setTimeout(() => {
          service['fetchStateSignal'].set(States.error);
          self.groupMembersComponent.lastError = new Error('Failed to fetch group members');
          (self.groupMembersComponent as any).cdr.markForCheck();
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

const meta: Meta<CometChatGroupMembersComponent> = {
  title: 'Components/Groups/CometChat Group Members',
  component: CometChatGroupMembersComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatGroupMembersStoryWrapperComponent],
    }),
  ],
  args: {
    hideSearch: false,
    hideError: false,
    hideUserStatus: false,
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
      description: 'Hide error state display when fetching members fails',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideUserStatus: {
      control: 'boolean',
      description: 'Hide online/offline status indicators on member avatars',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideKickMemberOption: {
      control: 'boolean',
      description: 'Hide the kick option from context menus',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideBanMemberOption: {
      control: 'boolean',
      description: 'Hide the ban option from context menus',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    hideScopeChangeOption: {
      control: 'boolean',
      description: 'Hide the scope change option from context menus',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    disableLoadingState: {
      control: 'boolean',
      description: 'Disable the shimmer loading state animation',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'Display Control',
      },
    },
    showScrollbar: {
      control: 'boolean',
      description: 'Show scrollbar in the member list',
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
      description: 'Emitted when a member item is clicked',
      table: {
        type: { summary: 'EventEmitter<CometChat.GroupMember>' },
        category: 'Events',
      },
    },
    selectionChange: {
      action: 'selectionChange',
      description: 'Emitted when selection state changes (single/multiple mode)',
      table: {
        type: { summary: 'EventEmitter<SelectionState>' },
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
      description: 'Emitted when the member list is empty after initial fetch',
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
          'CometChatGroupMembers displays a paginated, searchable list of group members with real-time status updates, role-based context menus (kick, ban, change scope), selection modes (none, single, multiple with shift-click range selection), keyboard navigation, and full ARIA accessibility support.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatGroupMembersComponent>;

// ============================================
// Stories
// ============================================

/** Default group members list with varied scopes and status indicators. */
export const Default: Story = {
  render: args => ({
    props: {
      ...args,
      mockMembers: createRealisticMockMembers(12),
    },
    template: `
      <div class="cometchat-group-members-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-group-members-story-wrapper
          [showTitle]="true"
          [hideSearch]="hideSearch"
          [hideError]="hideError"
          [hideUserStatus]="hideUserStatus"
          [showScrollbar]="showScrollbar"
          [selectionMode]="selectionMode"
          [mockMembers]="mockMembers">
        </cometchat-group-members-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Default group members list rendered with 12 mock members showing admin, moderator, and participant roles with online/offline status indicators. Includes search bar and default display settings.',
      },
    },
  },
};

/** Empty state displayed when no group members exist or search returns no results. */
export const EmptyState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateEmpty: true,
    },
    template: `
      <div class="cometchat-group-members-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-group-members-story-wrapper
          [hideSearch]="hideSearch"
          [showTitle]="true"                    
          [showTitle]="true"
          [hideUserStatus]="hideUserStatus"
          [simulateEmpty]="simulateEmpty">
        </cometchat-group-members-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state shown when no group members are found. A custom empty view can be provided via the emptyView template input.',
      },
    },
  },
};

/** Loading state with shimmer/skeleton placeholders while fetching group members. */
export const LoadingState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateLoading: true,
    },
    template: `
      <div class="cometchat-group-members-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-group-members-story-wrapper
          [hideSearch]="hideSearch"
          [showTitle]="true"                    
          [hideUserStatus]="hideUserStatus"
          [simulateLoading]="simulateLoading">
        </cometchat-group-members-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Loading state displayed while group members are being fetched from the server. Shows shimmer/skeleton placeholder items matching the list item structure.',
      },
    },
  },
};

/** Error state displayed when fetching group members fails. */
export const ErrorState: Story = {
  render: args => ({
    props: {
      ...args,
      simulateError: true,
    },
    template: `
      <div class="cometchat-group-members-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-group-members-story-wrapper
          [hideSearch]="hideSearch"
          [showTitle]="true"                    
          [hideUserStatus]="hideUserStatus"
          [hideError]="false"
          [simulateError]="simulateError">
        </cometchat-group-members-story-wrapper>
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
          'Error state displayed when fetching group members fails. Shows the error UI with a retry option. Clicking retry shows shimmer for 300ms then returns to error state.',
      },
    },
  },
};

/** Group members list showing only admin-scoped members. */
export const AdminMember: Story = {
  render: args => ({
    props: {
      ...args,
      mockMembers: createRealisticMockMembers(8).map((m, i) => {
        if (i < 3) {
          m.setScope(CometChat.GROUP_MEMBER_SCOPE.ADMIN as unknown as CometChat.GroupMemberScope);
        }
        return m;
      }),
    },
    template: `
      <div class="cometchat-group-members-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-group-members-story-wrapper
          [hideSearch]="hideSearch"
          [showTitle]="true"
          [hideUserStatus]="hideUserStatus"
          [mockMembers]="mockMembers">
        </cometchat-group-members-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Group members list with admin-scoped members. Admin members display the "Admin" role badge in the trailing section.',
      },
    },
  },
};

/** Group members list showing moderator-scoped members. */
export const ModeratorMember: Story = {
  render: args => ({
    props: {
      ...args,
      mockMembers: createRealisticMockMembers(8).map((m, i) => {
        if (i < 3) {
          m.setScope(
            CometChat.GROUP_MEMBER_SCOPE.MODERATOR as unknown as CometChat.GroupMemberScope
          );
        }
        return m;
      }),
    },
    template: `
      <div class="cometchat-group-members-story__container" style="width: 400px; height: 600px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
        <cometchat-group-members-story-wrapper
          [hideSearch]="hideSearch"
          [showTitle]="true"
          [hideUserStatus]="hideUserStatus"
          [mockMembers]="mockMembers">
        </cometchat-group-members-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Group members list with moderator-scoped members. Moderator members display the "Moderator" role badge in the trailing section.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all group members list variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    props: {
      mockMembers: createRealisticMockMembers(8),
      noneSelection: SelectionMode.none,
      singleSelection: SelectionMode.single,
      multipleSelection: SelectionMode.multiple,
    },
    template: `
      <div class="cometchat-group-members-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-spacing-5);">

        <h3 class="cometchat-group-members-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Group Members Variants
        </h3>

        <!-- Default List -->
        <div class="cometchat-group-members-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-members-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Default List
          </p>
          <div class="cometchat-group-members-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-group-members-story-wrapper [showTitle]="true" [mockMembers]="mockMembers"></cometchat-group-members-story-wrapper>
          </div>
        </div>

        <!-- Single Selection Mode -->
        <div class="cometchat-group-members-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-members-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Single Selection Mode
          </p>
          <div class="cometchat-group-members-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-group-members-story-wrapper [showTitle]="true" [selectionMode]="singleSelection" [mockMembers]="mockMembers"></cometchat-group-members-story-wrapper>
          </div>
        </div>

        <!-- Multiple Selection Mode -->
        <div class="cometchat-group-members-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-members-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Multiple Selection Mode
          </p>
          <div class="cometchat-group-members-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-group-members-story-wrapper [showTitle]="true" [selectionMode]="multipleSelection" [mockMembers]="mockMembers"></cometchat-group-members-story-wrapper>
          </div>
        </div>

        <!-- Empty State -->
        <div class="cometchat-group-members-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-members-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Empty State
          </p>
          <div class="cometchat-group-members-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-group-members-story-wrapper [showTitle]="true" [simulateEmpty]="true"></cometchat-group-members-story-wrapper>
          </div>
        </div>

        <!-- Error State -->
        <div class="cometchat-group-members-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-group-members-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Error State
          </p>
          <div class="cometchat-group-members-showcase__panel" style="width: 400px; height: 350px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden;">
            <cometchat-group-members-story-wrapper [showTitle]="true" [simulateError]="true"></cometchat-group-members-story-wrapper>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all group members list variants — default, single selection, multiple selection, empty state, and error state — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
      story: { inline: false, iframeHeight: 600 },
    },
  },
};
