/**
 * CometChatStickersKeyboard Storybook Stories
 *
 * Stories use a local wrapper component to inject mock sticker sets and force
 * component states without hitting the CometChat SDK. This keeps the library
 * component's public API free of test-only inputs.
 *
 * @module components/cometchat-stickers-keyboard
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CometChatStickersKeyboardComponent } from './cometchat-stickers-keyboard.component';
import type { StickerClickEvent, StickerSet } from './cometchat-stickers-keyboard.component';

// ============================================
// Mock Data
// ============================================

const MOCK_STICKER_DATA: StickerSet = {
  bear: [
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'bear', stickerOrder: 0 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_2.png', stickerSetName: 'bear', stickerOrder: 1 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_3.png', stickerSetName: 'bear', stickerOrder: 2 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_4.png', stickerSetName: 'bear', stickerOrder: 3 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_5.png', stickerSetName: 'bear', stickerOrder: 4 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_6.png', stickerSetName: 'bear', stickerOrder: 5 },
  ],
  dog: [
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'dog', stickerOrder: 0 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'dog', stickerOrder: 1 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'dog', stickerOrder: 2 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'dog', stickerOrder: 3 },
  ],
  cat: [
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'cat', stickerOrder: 0 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'cat', stickerOrder: 1 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'cat', stickerOrder: 2 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'cat', stickerOrder: 3 },
    { stickerUrl: 'https://data-in.cc-cluster-2.io/stickers/bear/bear_1.png', stickerSetName: 'cat', stickerOrder: 4 },
  ],
};

// ============================================
// Story Wrapper — keeps mock injection out of the library API
// ============================================

/**
 * Wrapper used exclusively by Storybook stories.
 *
 * Injects mock sticker data and/or overrides the component state via the
 * public `loadStickerData` / `setComponentState` test hooks, so stories can
 * render without an SDK session.
 */
@Component({
  selector: 'cometchat-stickers-keyboard-story-wrapper',
  standalone: true,
  imports: [CommonModule, CometChatStickersKeyboardComponent],
  template: `
    <cometchat-stickers-keyboard
      #stickersComponent
      [errorStateText]="errorStateText"
      [emptyStateText]="emptyStateText"
      [autoFocus]="autoFocus"
      [trapFocus]="trapFocus"
      (stickerClick)="stickerClick.emit($event)"
      (closeKeyboard)="closeKeyboard.emit()">
    </cometchat-stickers-keyboard>
  `,
})
class CometChatStickersKeyboardStoryWrapperComponent implements AfterViewInit, OnChanges {
  @ViewChild('stickersComponent') stickersComponent!: CometChatStickersKeyboardComponent;

  @Input() errorStateText?: string;
  @Input() emptyStateText?: string;
  @Input() autoFocus = false;
  @Input() trapFocus = true;
  @Input() stickerData?: StickerSet;
  @Input() initialState?: 'loading' | 'error' | 'empty';

  @Output() stickerClick = new EventEmitter<StickerClickEvent>();
  @Output() closeKeyboard = new EventEmitter<void>();

  ngAfterViewInit(): void {
    this.applyMocks();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['stickerData'] || changes['initialState']) && this.stickersComponent) {
      this.applyMocks();
    }
  }

  private applyMocks(): void {
    if (!this.stickersComponent) return;

    queueMicrotask(() => {
      if (this.initialState) {
        this.stickersComponent.setComponentState(this.initialState);
        return;
      }
      if (this.stickerData && Object.keys(this.stickerData).length > 0) {
        this.stickersComponent.loadStickerData(this.stickerData);
      }
    });
  }
}

// ============================================
// Meta Configuration
// ============================================

type StoryArgs = Pick<
  CometChatStickersKeyboardComponent,
  'errorStateText' | 'emptyStateText' | 'autoFocus' | 'trapFocus'
> & {
  stickerData?: StickerSet;
  initialState?: 'loading' | 'error' | 'empty';
  stickerClick?: (event: StickerClickEvent) => void;
  closeKeyboard?: () => void;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Misc/Stickers Keyboard',
  component: CometChatStickersKeyboardComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, CometChatStickersKeyboardStoryWrapperComponent],
    }),
  ],
  args: {
    autoFocus: false,
    trapFocus: true,
    stickerData: MOCK_STICKER_DATA,
  },
  argTypes: {
    errorStateText: {
      control: 'text',
      description: 'Custom text displayed when sticker fetching fails',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    emptyStateText: {
      control: 'text',
      description: 'Custom text displayed when no stickers are available',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    autoFocus: {
      control: 'boolean',
      description: 'Whether to automatically focus the first tab on open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    trapFocus: {
      control: 'boolean',
      description: 'Whether to trap focus within the keyboard for accessibility',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    stickerClick: {
      action: 'stickerClick',
      description: 'Emitted when a sticker is clicked with the sticker URL and name',
      table: {
        type: { summary: 'EventEmitter<StickerClickEvent>' },
        category: 'Events',
      },
    },
    closeKeyboard: {
      action: 'closeKeyboard',
      description: 'Emitted when the keyboard should close (Escape key)',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatStickersKeyboard displays a browsable sticker picker with category tabs and a grid layout. Supports arrow-key grid navigation, focus trapping, and Escape to close.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// ============================================
// Stories
// ============================================

const stickerTemplate = `
  <div style="width: 320px; height: 360px;">
    <cometchat-stickers-keyboard-story-wrapper
      [stickerData]="stickerData"
      [initialState]="initialState"
      [errorStateText]="errorStateText"
      [emptyStateText]="emptyStateText"
      [autoFocus]="false"
      [trapFocus]="trapFocus"
      (stickerClick)="stickerClick($event)"
      (closeKeyboard)="closeKeyboard($event)"
    ></cometchat-stickers-keyboard-story-wrapper>
  </div>
`;

/** Default stickers keyboard with pre-loaded sticker sets organized by category tabs. */
export const Default: Story = {
  render: args => ({
    props: args,
    template: stickerTemplate,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Stickers keyboard with 3 mock categories (bear, dog, cat). Click a sticker to emit stickerClick. Use arrow keys to navigate the grid.',
      },
    },
  },
};

/** Stickers keyboard at a slightly larger size showing full grid and tab navigation. */
export const KeyboardDisplay: Story = {
  render: args => ({
    props: args,
    template: `
      <div style="width: 360px; height: 400px;">
        <cometchat-stickers-keyboard-story-wrapper
          [stickerData]="stickerData"
          [initialState]="initialState"
          [errorStateText]="errorStateText"
          [emptyStateText]="emptyStateText"
          [autoFocus]="false"
          [trapFocus]="trapFocus"
          (stickerClick)="stickerClick($event)"
          (closeKeyboard)="closeKeyboard($event)"
        ></cometchat-stickers-keyboard-story-wrapper>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Full keyboard display at a slightly larger size. Demonstrates tab switching and grid navigation.',
      },
    },
  },
};

// ============================================
// State Variants
// ============================================

/** Loading state showing shimmer placeholders. */
export const LoadingState: Story = {
  args: {
    initialState: 'loading',
    stickerData: undefined,
  },
  render: args => ({
    props: args,
    template: stickerTemplate,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Loading state with shimmer placeholders while stickers are being fetched.',
      },
    },
  },
};

/** Error state showing the retry button and error message. */
export const ErrorState: Story = {
  args: {
    initialState: 'error',
    stickerData: undefined,
  },
  render: args => ({
    props: args,
    template: stickerTemplate,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Error state with a retry button. Displayed when sticker fetching fails.',
      },
    },
  },
};

/** Empty state when no stickers are available. */
export const EmptyState: Story = {
  args: {
    initialState: 'empty',
    stickerData: undefined,
  },
  render: args => ({
    props: args,
    template: stickerTemplate,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no sticker sets are available from the extension.',
      },
    },
  },
};
