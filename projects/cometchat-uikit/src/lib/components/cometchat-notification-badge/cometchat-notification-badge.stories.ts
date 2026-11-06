/**
 * CometChatNotificationBadge Storybook Stories
 *
 * The badge reads its count from NotificationUnreadCountService. Stories
 * provide a mock service (no SDK, polling or WebSocket listener) and a small
 * wrapper that pushes the `unreadCount` arg into the mock's `count$` stream,
 * so the count can be driven from the Controls panel.
 *
 * @module components/cometchat-notification-badge
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CometChatNotificationBadgeComponent } from './cometchat-notification-badge.component';
import type { NotificationBadgeStyle } from './cometchat-notification-badge.types';
import { NotificationUnreadCountService } from '../../services/notification-unread-count.service';
import { expect } from 'storybook/test';

// ============================================
// Mock Service
// ============================================

/** Stand-in for NotificationUnreadCountService: no SDK calls, count set by the story. */
class MockNotificationUnreadCountService {
  readonly count$ = new BehaviorSubject<number>(0);
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  start(): void { /* no-op: no polling or listeners in Storybook */ }
  stop(): void { /* no-op */ }
  async refresh(): Promise<void> { /* no-op */ }
}

// ============================================
// Wrapper Component
// ============================================

/** Pushes the `unreadCount` input into the mock service, then renders the badge. */
@Component({
  selector: 'storybook-notification-badge-wrapper',
  standalone: true,
  imports: [CometChatNotificationBadgeComponent],
  template: `
    <div style="display: inline-flex; align-items: center; gap: var(--cometchat-spacing-2); font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-primary);">
      <span>Notifications</span>
      <cometchat-notification-badge
        [max]="max"
        [category]="category"
        [style]="badgeStyle">
      </cometchat-notification-badge>
    </div>
  `,
})
class NotificationBadgeWrapperComponent implements OnChanges {
  private service = inject(NotificationUnreadCountService) as unknown as MockNotificationUnreadCountService;

  @Input() unreadCount = 0;
  @Input() max = 99;
  @Input() category: string | undefined;
  @Input() badgeStyle: NotificationBadgeStyle | undefined;

  ngOnChanges(): void {
    this.service.count$.next(this.unreadCount);
  }
}

// ============================================
// Meta Configuration
// ============================================

type BadgeStoryArgs = {
  unreadCount: number;
  max: number;
  category?: string;
  style?: NotificationBadgeStyle;
};

const meta: Meta<BadgeStoryArgs> = {
  title: 'Components/Notifications/Notification Badge',
  component: CometChatNotificationBadgeComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, NotificationBadgeWrapperComponent],
      providers: [
        { provide: NotificationUnreadCountService, useClass: MockNotificationUnreadCountService },
      ],
    }),
  ],
  args: {
    unreadCount: 5,
    max: 99,
    category: undefined,
    style: undefined,
  },
  argTypes: {
    unreadCount: {
      control: { type: 'number', min: 0 },
      description:
        'Story-only control: the unread count emitted by the mocked NotificationUnreadCountService. The badge hides itself at 0.',
      table: { type: { summary: 'number' }, category: 'Story Controls' },
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Maximum count to display before showing "N+".',
      table: { type: { summary: 'number' }, defaultValue: { summary: '99' }, category: 'Inputs' },
    },
    category: {
      control: 'text',
      description: 'Filter the unread count by notification category.',
      table: { type: { summary: 'string | undefined' }, defaultValue: { summary: 'undefined' }, category: 'Inputs' },
    },
    style: {
      control: 'object',
      description: 'Style overrides: backgroundColor, textColor, fontSize, borderRadius.',
      table: { type: { summary: 'NotificationBadgeStyle' }, category: 'Inputs' },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <storybook-notification-badge-wrapper
        [unreadCount]="unreadCount"
        [max]="max"
        [category]="category"
        [badgeStyle]="style">
      </storybook-notification-badge-wrapper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'CometChatNotificationBadge shows the unread notification-feed count. It subscribes to NotificationUnreadCountService for real-time updates (and re-syncs on window focus), hides itself when the count is 0, and caps the display at `max` ("99+").',
      },
    },
  },
};

export default meta;
type Story = StoryObj<BadgeStoryArgs>;

// ============================================
// Stories
// ============================================

/** Default badge showing a small unread count. */
export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Badge displaying 5 unread notifications.' },
    },
  },
};

/** Count above `max` is capped as "N+". */
export const OverMax: Story = {
  args: { unreadCount: 150, max: 99 },
  parameters: {
    docs: {
      description: { story: 'With 150 unread and `max` = 99, the badge displays "99+".' },
    },
  },
};

/** Custom, lower `max`. */
export const CustomMax: Story = {
  args: { unreadCount: 12, max: 9 },
  parameters: {
    docs: {
      description: { story: 'With `max` = 9, a count of 12 displays as "9+".' },
    },
  },
};

/** Zero unread: the badge renders nothing. */
export const ZeroCount: Story = {
  args: { unreadCount: 0 },
  parameters: {
    docs: {
      description: { story: 'When the unread count is 0 the badge is hidden; only the label remains.' },
    },
  },
};

/** Style overrides applied via the `style` input. */
export const CustomStyle: Story = {
  args: {
    unreadCount: 23,
    style: {
      backgroundColor: 'var(--cometchat-error-color)',
      textColor: 'var(--cometchat-static-white)',
      fontSize: '12px',
      borderRadius: 'var(--cometchat-radius-2)',
    },
  },
  parameters: {
    docs: {
      description: { story: 'Badge with background, text color, font size and border radius overridden.' },
    },
  },
};

// ============================================
// Interaction Tests
// ============================================

/** Test: count above max renders the capped label. */
export const TestOverMaxShowsCappedLabel: Story = {
  args: { unreadCount: 150, max: 99 },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 300));
    const badge = canvasElement.querySelector('.cometchat-notification-badge');
    expect(badge).not.toBeNull();
    expect(badge?.textContent?.trim()).toBe('99+');
  },
};

/** Test: zero count renders no badge. */
export const TestZeroCountHidesBadge: Story = {
  args: { unreadCount: 0 },
  play: async ({ canvasElement }) => {
    await new Promise((r) => setTimeout(r, 300));
    expect(canvasElement.querySelector('.cometchat-notification-badge')).toBeNull();
  },
};
