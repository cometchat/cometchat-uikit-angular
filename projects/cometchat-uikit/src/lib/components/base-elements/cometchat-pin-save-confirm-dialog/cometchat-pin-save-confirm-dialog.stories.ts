/**
 * CometChatPinSaveConfirmDialog Storybook Stories
 *
 * Interactive stories demonstrating every question this dialog can ask:
 * - Unpin a message from the conversation
 * - Unsave a message from the personal saved list
 * - Unpin a conversation from the top of the list
 * - Neutral styling next to the delete dialog it is built on
 * - All variants showcase
 *
 * @module components/cometchat-pin-save-confirm-dialog
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { expect } from '@storybook/test';

import { CometChatPinSaveConfirmDialogComponent } from './cometchat-pin-save-confirm-dialog.component';
import { CometChatConfirmDialogComponent } from '../cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { FocusTrapService } from '../../../services/focus-trap.service';

// ============================================
// Mock Classes
// ============================================

/**
 * Creates a no-op FocusTrapService for Storybook stories.
 *
 * The inner confirm dialog activates a real focus trap on init. On a docs page
 * several dialogs are mounted at once, and each one pulling focus to itself
 * scrolls the page and steals the keyboard from whichever story the reader is
 * actually looking at. Focus behaviour is covered by the dialog's own specs.
 */
function createNoopFocusTrapService(): any {
  return {
    activate: () => {},
    deactivate: () => {},
    isActive: () => false,
    hasActiveTraps: () => false,
  };
}

/**
 * Records cancel emissions for the interaction test.
 *
 * Module scope because a play() function can only reach what the template
 * handler wrote — it cannot see inside the render closure. The test reads the
 * length before and after clicking, so re-running a story never invalidates it.
 */
const cancelLog: string[] = [];

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatPinSaveConfirmDialogComponent> = {
  title: 'Components/Misc/Pin Save Confirm Dialog',
  component: CometChatPinSaveConfirmDialogComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule],
    }),
  ],
  args: {
    action: 'unpin',
  },
  argTypes: {
    // Data Configuration
    action: {
      control: 'select',
      options: ['unpin', 'unsave', 'unpin-conversation'],
      description:
        'Which action is being confirmed. The only input — it selects the title, body, confirm label and cancel label from the localization bundle.',
      table: {
        type: { summary: "'unpin' | 'unsave' | 'unpin-conversation'" },
        category: 'Data Configuration',
      },
    },

    // Events
    confirmClick: {
      action: 'confirmClick',
      description: 'Emitted when the confirm button is clicked. The host performs the action.',
      table: {
        type: { summary: 'EventEmitter<void>' },
        category: 'Events',
      },
    },
    cancelClick: {
      action: 'cancelClick',
      description:
        'Emitted when the cancel button is clicked, or when Escape is pressed inside the dialog.',
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
          'CometChatPinSaveConfirmDialog asks before the three pin/save actions that take something away — unpinning a message, unsaving a message, and unpinning a conversation — wrapping the shared confirm dialog with its own scrim and swapping the delete styling (red trash icon, red confirm button) for neutral styling with a brand-primary confirm button. Pinning and saving are additive and act immediately, so they never open it, and the pin/save cap is not a dialog state at all: a rejected pin surfaces as a toast raised by PinSaveService, documented under Base Elements/Toast.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatPinSaveConfirmDialogComponent>;

// ============================================
// Stories
// ============================================

/** Unpinning a message — the most common of the three. */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unpin' },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-pin-save-confirm-dialog-story__container" style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <div class="cometchat-pin-save-confirm-dialog-story__host" style="padding: var(--cometchat-padding-4, 16px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
          Host panel. The dialog brings its own scrim and covers whatever it is placed inside.
        </div>
        <cometchat-pin-save-confirm-dialog [action]="action"></cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The unpin question, reached from the message list, the pinned messages panel or a message bubble. A pin is conversation-wide, so removing it takes the marker away from everyone in the chat — that is why this direction asks and pinning does not.',
      },
    },
  },
};

/** Unsaving a message — the private, per-viewer half of the feature. */
export const UnsaveMessage: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unsave' },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-pin-save-confirm-dialog-story__container" style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <div class="cometchat-pin-save-confirm-dialog-story__host" style="padding: var(--cometchat-padding-4, 16px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
          Host panel. The dialog brings its own scrim and covers whatever it is placed inside.
        </div>
        <cometchat-pin-save-confirm-dialog [action]="action"></cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The unsave question, reached from the saved messages panel or a message bubble. A save is private to one person, so the body drops the "from this conversation" phrasing the unpin copy carries, and the confirm button reads Unsave.',
      },
    },
  },
};

/** Unpinning a conversation — same dialog, third set of strings. */
export const UnpinConversation: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unpin-conversation' },
  render: args => ({
    props: args,
    template: `
      <div class="cometchat-pin-save-confirm-dialog-story__container" style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <div class="cometchat-pin-save-confirm-dialog-story__host" style="padding: var(--cometchat-padding-4, 16px); font: var(--cometchat-font-body-regular); color: var(--cometchat-text-color-secondary);">
          Host panel. The dialog brings its own scrim and covers whatever it is placed inside.
        </div>
        <cometchat-pin-save-confirm-dialog [action]="action"></cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The conversation variant, opened from the conversation list rather than from a message. The title says Conversation while the confirm button still reads Unpin, and this is the only one of the three that does not act on a message.',
      },
    },
  },
};

/** The neutral pin/save styling beside the destructive delete styling it overrides. */
export const NeutralVsDestructive: Story = {
  decorators: [
    moduleMetadata({
      imports: [CometChatConfirmDialogComponent],
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="cometchat-pin-save-confirm-dialog-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5);">

        <h3 class="cometchat-pin-save-confirm-dialog-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Neutral vs Destructive
        </h3>

        <div class="cometchat-pin-save-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-pin-save-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Destructive — the shared confirm dialog with its delete defaults
          </p>
          <div class="cometchat-pin-save-confirm-dialog-showcase__panel" style="width: 420px; padding: var(--cometchat-padding-4, 16px); border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); background: var(--cometchat-background-color-01);">
            <cometchat-confirm-dialog
              [title]="deleteTitle"
              [messageText]="deleteMessage"
              [confirmButtonText]="deleteConfirm"
              [cancelButtonText]="deleteCancel"
            ></cometchat-confirm-dialog>
          </div>
        </div>

        <div class="cometchat-pin-save-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-pin-save-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Neutral — the same dialog retuned for unpin
          </p>
          <div class="cometchat-pin-save-confirm-dialog-showcase__panel" style="position: relative; width: 420px; height: 260px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
            <cometchat-pin-save-confirm-dialog action="unpin"></cometchat-pin-save-confirm-dialog>
          </div>
        </div>

      </div>
    `,
    props: {
      deleteTitle: 'Delete Conversation?',
      deleteMessage: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      deleteConfirm: 'Delete',
      deleteCancel: 'Cancel',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The same underlying confirm dialog rendered twice: once with its delete defaults and once through this wrapper. Nothing here is destructive — an unpin or an unsave is undone by pinning or saving again — so the wrapper hides the red trash icon, paints the confirm button with the primary colour instead of the error colour, and left-aligns the text.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of every question the dialog can ask, in a single view. */
export const AllVariantsShowcase: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="cometchat-pin-save-confirm-dialog-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5); padding: var(--cometchat-padding-5); max-height: 90vh; overflow-y: auto;">

        <h3 class="cometchat-pin-save-confirm-dialog-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
          Pin & Save Confirm Dialog Variants
        </h3>

        <div class="cometchat-pin-save-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-pin-save-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Unpin Message
          </p>
          <div class="cometchat-pin-save-confirm-dialog-showcase__panel" style="position: relative; width: 420px; height: 260px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
            <cometchat-pin-save-confirm-dialog action="unpin"></cometchat-pin-save-confirm-dialog>
          </div>
        </div>

        <div class="cometchat-pin-save-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-pin-save-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Unsave Message
          </p>
          <div class="cometchat-pin-save-confirm-dialog-showcase__panel" style="position: relative; width: 420px; height: 260px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
            <cometchat-pin-save-confirm-dialog action="unsave"></cometchat-pin-save-confirm-dialog>
          </div>
        </div>

        <div class="cometchat-pin-save-confirm-dialog-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
          <p class="cometchat-pin-save-confirm-dialog-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
            Unpin Conversation
          </p>
          <div class="cometchat-pin-save-confirm-dialog-showcase__panel" style="position: relative; width: 420px; height: 260px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
            <cometchat-pin-save-confirm-dialog action="unpin-conversation"></cometchat-pin-save-confirm-dialog>
          </div>
        </div>

      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'All three actions side by side — unpin a message, unsave a message, unpin a conversation. Every string comes from the localization bundle, so the locale toolbar rewrites all three at once. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

/** Verifies the unpin action renders the unpin copy. */
export const TestUnpinCopyRenders: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unpin' },
  render: args => ({
    props: args,
    template: `
      <div style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <cometchat-pin-save-confirm-dialog [action]="action"></cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const title = canvasElement.querySelector('.cometchat-confirm-dialog__content-title, [class*="confirm-dialog"] [class*="title"]');
    expect(title).not.toBeNull();
    expect(title!.textContent!.trim()).toContain('Unpin Message');
  },
};

/** Verifies the action input swaps the whole set of copy. */
export const TestUnsaveCopyRenders: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unsave' },
  render: args => ({
    props: args,
    template: `
      <div style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <cometchat-pin-save-confirm-dialog [action]="action"></cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const title = canvasElement.querySelector('.cometchat-confirm-dialog__content-title, [class*="confirm-dialog"] [class*="title"]');
    expect(title).not.toBeNull();
    expect(title!.textContent!.trim()).toContain('Unsave Message');

    const description = canvasElement.querySelector('.cometchat-confirm-dialog__content-description, [class*="confirm-dialog"] [class*="description"]');
    expect(description).not.toBeNull();
    expect(description!.textContent!.trim()).toContain('unsave this message');
  },
};

/** Verifies both the confirm and the cancel button are present and labelled for the action. */
export const TestConfirmAndCancelButtonsPresent: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unpin' },
  render: args => ({
    props: args,
    template: `
      <div style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <cometchat-pin-save-confirm-dialog [action]="action"></cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const buttons = canvasElement.querySelectorAll('.cometchat-pin-save-confirm-dialog button, [class*="confirm-dialog"] button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);

    const confirmBtn = canvasElement.querySelector('.cometchat-confirm-dialog__button-group-submit button, [class*="button-group-submit"] button');
    expect(confirmBtn).not.toBeNull();
    expect(confirmBtn!.textContent!.trim()).toContain('Unpin');

    const cancelBtn = canvasElement.querySelector('.cometchat-confirm-dialog__button-group-cancel button, [class*="button-group-cancel"] button');
    expect(cancelBtn).not.toBeNull();
    expect(cancelBtn!.textContent!.trim()).toContain('Cancel');
  },
};

/** Verifies clicking cancel emits cancelClick to the host. */
export const TestCancelClickEmits: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: FocusTrapService,
          useFactory: () => createNoopFocusTrapService(),
        },
      ],
    }),
  ],
  args: { action: 'unpin' },
  render: args => ({
    props: {
      ...args,
      onCancel: () => {
        cancelLog.push('cancel');
      },
    },
    template: `
      <div style="position: relative; width: 420px; height: 300px; border: 1px solid var(--cometchat-border-color-light); border-radius: var(--cometchat-radius-2); overflow: hidden; background: var(--cometchat-background-color-01);">
        <cometchat-pin-save-confirm-dialog
          [action]="action"
          (cancelClick)="onCancel()">
        </cometchat-pin-save-confirm-dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    // Counted rather than compared against zero, so a re-run of the story does
    // not fail on emissions left behind by the previous run.
    const before = cancelLog.length;

    const cancelBtn = canvasElement.querySelector('.cometchat-confirm-dialog__button-group-cancel button, [class*="button-group-cancel"] button') as HTMLElement;
    expect(cancelBtn).not.toBeNull();

    cancelBtn.click();
    await new Promise(r => setTimeout(r, 500));

    expect(cancelLog.length).toBe(before + 1);
  },
};
