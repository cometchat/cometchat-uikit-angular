/**
 * CometChatDate Storybook Stories
 *
 * Interactive stories demonstrating the date component variants:
 * - Default date display (today)
 * - Recent timestamp (minutes/hours ago)
 * - Older timestamp (last week/month)
 * - Custom date format configuration
 * - All variants showcase
 *
 * @module components/cometchat-date
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatDateComponent } from './cometchat-date.component';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';

// ============================================
// Mock Data
// ============================================

/**
 * Creates a CalendarObject with sensible defaults and optional overrides.
 */
function createCalendarObject(overrides?: Partial<CalendarObject>): CalendarObject {
  return {
    today: 'h:mm A',
    yesterday: '[Yesterday]',
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY',
    ...overrides,
  };
}

/** Current Unix timestamp in seconds. */
const NOW = Math.floor(Date.now() / 1000);

/** Timestamp offsets for various time ranges. */
const TIMESTAMPS = {
  now: NOW,
  fiveMinutesAgo: NOW - 300,
  oneHourAgo: NOW - 3600,
  yesterday: NOW - 86400,
  lastWeek: NOW - 604800,
  lastMonth: NOW - 2592000,
  lastYear: NOW - 31536000,
};

/** Default calendar format used across stories. */
const DEFAULT_CALENDAR = createCalendarObject();

/** Calendar format with relative time enabled. */
const RELATIVE_CALENDAR = createCalendarObject({
  relativeTime: {
    minute: '%d minute ago',
    minutes: '%d minutes ago',
    hour: '%d hour ago',
    hours: '%d hours ago',
  },
});

/** Custom verbose calendar format. */
const CUSTOM_CALENDAR = createCalendarObject({
  today: '[Today at] h:mm A',
  yesterday: '[Yesterday at] h:mm A',
  lastWeek: 'dddd [at] h:mm A',
  otherDays: 'MMMM DD, YYYY',
});

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatDateComponent> = {
  title: 'Components/Misc/Date',
  component: CometChatDateComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    timestamp: TIMESTAMPS.now,
    calendarObject: DEFAULT_CALENDAR,
  },
  argTypes: {
    timestamp: {
      control: 'number',
      description: 'Unix timestamp in seconds representing the date/time to display',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 'Date.now() / 1000' },
        category: 'Data',
      },
    },
    calendarObject: {
      control: 'object',
      description:
        'Configuration object controlling date format for today, yesterday, last week, and older dates. Supports optional relative time formatting.',
      table: {
        type: { summary: 'CalendarObject' },
        defaultValue: {
          summary:
            "{ today: 'h:mm A', yesterday: '[Yesterday]', lastWeek: 'dddd', otherDays: 'DD/MM/YYYY' }",
        },
        category: 'Data',
      },
    },
  },
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'CometChatDate displays formatted dates and times using the CometChatLocalize service. Supports configurable calendar formats for today, yesterday, last week, and older dates, with optional relative time display (e.g., "5 minutes ago"). Automatically refreshes relative timestamps every 60 seconds.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatDateComponent>;

// ============================================
// Stories
// ============================================

/** Default date display showing the current time using the standard calendar format. */
export const Default: Story = {
  args: {
    timestamp: TIMESTAMPS.now,
    calendarObject: DEFAULT_CALENDAR,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default date display rendered with the current timestamp and standard calendar format. Shows the time in 12-hour format (e.g., "3:45 PM").',
      },
    },
  },
};

/** Recent timestamp showing a time from minutes ago, demonstrating relative time formatting. */
export const RecentTimestamp: Story = {
  args: {
    timestamp: TIMESTAMPS.fiveMinutesAgo,
    calendarObject: RELATIVE_CALENDAR,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A recent timestamp (5 minutes ago) with relative time formatting enabled. Demonstrates the relativeTime configuration that shows human-readable durations like "5 minutes ago".',
      },
    },
  },
};

/** Older timestamp showing a date from last month, demonstrating the otherDays format. */
export const OlderTimestamp: Story = {
  args: {
    timestamp: TIMESTAMPS.lastMonth,
    calendarObject: DEFAULT_CALENDAR,
  },
  parameters: {
    docs: {
      description: {
        story:
          'An older timestamp (approximately one month ago) rendered using the otherDays format (DD/MM/YYYY). Demonstrates how the component handles dates outside the recent time window.',
      },
    },
  },
};

/** Custom date format using verbose patterns with day names and full month names. */
export const CustomFormat: Story = {
  args: {
    timestamp: TIMESTAMPS.yesterday,
    calendarObject: CUSTOM_CALENDAR,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date rendered with a custom CalendarObject using verbose patterns — "Today at 3:45 PM", "Yesterday at 2:30 PM", "Monday at 1:15 PM", and "January 15, 2025" for older dates.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all date component variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div class="cometchat-date-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-date-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Date Component Variants
        </h3>

        <!-- Current Time -->
        <div class="cometchat-date-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-date-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Current Time
          </p>
          <div class="cometchat-date-showcase__item" style="display: flex; align-items: center; gap: var(--cometchat-spacing-3);">
            <cometchat-date [timestamp]="tsNow" [calendarObject]="defaultCal"></cometchat-date>
          </div>
        </div>

        <!-- Recent (Relative Time) -->
        <div class="cometchat-date-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-date-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Recent — Relative Time (5 minutes ago)
          </p>
          <div class="cometchat-date-showcase__item" style="display: flex; align-items: center; gap: var(--cometchat-spacing-3);">
            <cometchat-date [timestamp]="tsFiveMinAgo" [calendarObject]="relativeCal"></cometchat-date>
          </div>
        </div>

        <!-- Yesterday -->
        <div class="cometchat-date-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-date-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Yesterday
          </p>
          <div class="cometchat-date-showcase__item" style="display: flex; align-items: center; gap: var(--cometchat-spacing-3);">
            <cometchat-date [timestamp]="tsYesterday" [calendarObject]="defaultCal"></cometchat-date>
          </div>
        </div>

        <!-- Last Week -->
        <div class="cometchat-date-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-date-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Last Week
          </p>
          <div class="cometchat-date-showcase__item" style="display: flex; align-items: center; gap: var(--cometchat-spacing-3);">
            <cometchat-date [timestamp]="tsLastWeek" [calendarObject]="defaultCal"></cometchat-date>
          </div>
        </div>

        <!-- Older Date -->
        <div class="cometchat-date-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-date-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Older Date (Last Month)
          </p>
          <div class="cometchat-date-showcase__item" style="display: flex; align-items: center; gap: var(--cometchat-spacing-3);">
            <cometchat-date [timestamp]="tsLastMonth" [calendarObject]="defaultCal"></cometchat-date>
          </div>
        </div>

        <!-- Custom Format -->
        <div class="cometchat-date-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-date-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Custom Verbose Format (Yesterday)
          </p>
          <div class="cometchat-date-showcase__item" style="display: flex; align-items: center; gap: var(--cometchat-spacing-3);">
            <cometchat-date [timestamp]="tsYesterday" [calendarObject]="customCal"></cometchat-date>
          </div>
        </div>

      </div>
    `,
    props: {
      tsNow: TIMESTAMPS.now,
      tsFiveMinAgo: TIMESTAMPS.fiveMinutesAgo,
      tsYesterday: TIMESTAMPS.yesterday,
      tsLastWeek: TIMESTAMPS.lastWeek,
      tsLastMonth: TIMESTAMPS.lastMonth,
      defaultCal: DEFAULT_CALENDAR,
      relativeCal: RELATIVE_CALENDAR,
      customCal: CUSTOM_CALENDAR,
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all date component variants — current time, recent relative timestamp, yesterday, last week, older date, and custom verbose format — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};
