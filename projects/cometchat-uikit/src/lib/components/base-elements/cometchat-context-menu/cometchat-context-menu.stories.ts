/**
 * CometChatContextMenu Storybook Stories
 *
 * Interactive stories demonstrating the context menu component variants:
 * - Default menu with overflow items
 * - Default menu items configuration
 * - Custom positioning (top, right, bottom, left)
 * - Nested "Organise" group with its flyout closed, open, and flipped at a viewport edge
 * - All variants showcase
 *
 * @module components/cometchat-context-menu
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatContextMenuComponent } from './cometchat-context-menu.component';
import { CometChatActionsIcon, CometChatOption } from '../../../modals';
import { Placement } from '../../../Enums/Enums';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';

// ============================================
// Mock Data
// ============================================

/**
 * Creates a mock CometChatOption menu item.
 */
function createMockOption(id: string, title: string, iconURL?: string): CometChatOption {
  return new CometChatOption({
    id,
    title,
    iconURL: iconURL || 'assets/info_icon.svg',
  });
}

/** Default set of menu items for stories. */
const MOCK_MENU_ITEMS = [
  createMockOption('edit', 'Edit', '/assets/edit.svg'),
  createMockOption('copy', 'Copy', '/assets/content_copy.svg'),
  createMockOption('share', 'Share', '/assets/share.svg'),
  createMockOption('delete', 'Delete', '/assets/delete.svg'),
];

/** Extended set of menu items for overflow demonstration. */
const MOCK_EXTENDED_MENU_ITEMS = [
  ...MOCK_MENU_ITEMS,
  createMockOption('forward', 'Forward', '/assets/forward.svg'),
  createMockOption('pin', 'Pin', '/assets/keep.svg'),
];

/** Creates a leaf action that lives inside a group's flyout. */
function createNestedAction(id: string, title: string, iconURL: string): CometChatActionsIcon {
  return new CometChatActionsIcon({ id, title, iconURL, onClick: () => {} });
}

/**
 * Creates the "Organise" group that gathers Pin and Save into one row.
 *
 * `children` is the whole mechanism — an item carrying them opens a flyout
 * instead of acting, so its own onClick never runs and it never emits
 * optionClick. Nesting is one level deep by design.
 */
function createOrganiseGroup(children: CometChatActionsIcon[]): CometChatActionsIcon {
  return new CometChatActionsIcon({
    id: 'organise',
    title: 'Organise',
    iconURL: '/assets/archive.svg',
    onClick: () => {},
    children,
  });
}

/**
 * Message options as the list builds them for a message that is neither pinned
 * nor saved.
 *
 * Each nested action is a single direction rather than a toggle: the presence
 * of the pin/save timestamp is what decides whether the flyout offers Pin or
 * Unpin, so there is never a pair and never an unknown state to render.
 */
const MOCK_ORGANISE_MENU_ITEMS = [
  createMockOption('reply', 'Reply', '/assets/reply.svg'),
  createMockOption('copy', 'Copy', '/assets/content_copy.svg'),
  createOrganiseGroup([
    createNestedAction('pinMessage', 'Pin', '/assets/keep.svg'),
    createNestedAction('saveMessage', 'Save', '/assets/bookmark.svg'),
  ]),
  createMockOption('delete', 'Delete', '/assets/delete.svg'),
];

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatContextMenuComponent> = {
  title: 'Components/Misc/Context Menu',
  component: CometChatContextMenuComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  args: {
    data: MOCK_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.left,
    closeOnOutsideClick: false,
    disableBackgroundInteraction: false,
    useParentContainer: false,
    useParentHeight: false,
    forceStaticPlacement: false,
  },
  argTypes: {
    data: {
      control: 'object',
      description:
        'Array of menu items (CometChatOption, CometChatActionsIcon, or CometChatActionsView) to display',
      table: {
        type: { summary: 'ContextMenuItem[]' },
        defaultValue: { summary: '[]' },
      },
    },
    topMenuSize: {
      control: 'number',
      description:
        'Number of items visible in the main menu before the "more" overflow button appears',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    moreIconHoverText: {
      control: 'text',
      description: 'Tooltip text for the more/overflow button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'undefined' },
      },
    },
    placement: {
      control: 'select',
      options: [Placement.top, Placement.right, Placement.bottom, Placement.left],
      description: 'Preferred placement direction for the overflow submenu',
      table: {
        type: { summary: 'Placement' },
        defaultValue: { summary: 'Placement.left' },
      },
    },
    closeOnOutsideClick: {
      control: 'boolean',
      description: 'Whether the submenu closes when clicking outside of it',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disableBackgroundInteraction: {
      control: 'boolean',
      description:
        'Whether to show an overlay preventing background interaction when the submenu is open',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    useParentContainer: {
      control: 'boolean',
      description:
        'Use the nearest parent cometchat element as the viewport for positioning calculations',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    useParentHeight: {
      control: 'boolean',
      description: 'Use parent element height for centered positioning strategy',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    forceStaticPlacement: {
      control: 'boolean',
      description: 'Force the specified placement without dynamic repositioning logic',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    optionClick: {
      action: 'optionClick',
      description: 'Emitted when a menu option is clicked, providing the selected ContextMenuItem',
      table: {
        type: { summary: 'EventEmitter<ContextMenuItem>' },
        category: 'Events',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'CometChatContextMenu displays a list of action items with overflow handling. Items beyond the topMenuSize threshold are grouped into a "more" submenu. Supports configurable placement (top, right, bottom, left), keyboard navigation (Arrow keys, Enter/Space, Escape), and dynamic repositioning based on available viewport space.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatContextMenuComponent>;

// ============================================
// Stories
// ============================================

/** Default context menu with standard menu items and overflow into a submenu. */
export const Default: Story = {
  args: {
    data: MOCK_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          [closeOnOutsideClick]="closeOnOutsideClick"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Default context menu with four items. The first item is shown directly, and the remaining items overflow into a "more" submenu. Click the more button to reveal the overflow items.',
      },
    },
  },
};

/** Context menu displaying an extended set of menu items with a larger topMenuSize. */
export const DefaultMenuItems: Story = {
  args: {
    data: MOCK_EXTENDED_MENU_ITEMS,
    topMenuSize: 3,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Context menu with six items and a topMenuSize of 3, showing two items in the main menu and four in the overflow submenu. Demonstrates how the component handles larger data sets.',
      },
    },
  },
};

/** Context menu with forced static placement to demonstrate all four positioning directions. */
export const CustomPositioning: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:400px; height:300px; overflow:visible; display:flex; align-items:center; justify-content:center;">
        <div style="display: flex; gap: var(--cometchat-spacing-5); flex-wrap: wrap; justify-content: center; padding-top: var(--cometchat-spacing-5);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-2);">
            <p style="margin: 0; font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Left</p>
            <cometchat-context-menu
              [data]="menuItems"
              [placement]="'left'"
              [topMenuSize]="2"
              [useParentContainer]="true"
              [forceStaticPlacement]="true">
            </cometchat-context-menu>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-2);">
            <p style="margin: 0; font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Right</p>
            <cometchat-context-menu
              [data]="menuItems"
              [placement]="'right'"
              [topMenuSize]="2"
              [useParentContainer]="true"
              [forceStaticPlacement]="true">
            </cometchat-context-menu>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-2);">
            <p style="margin: 0; font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Top</p>
            <cometchat-context-menu
              [data]="menuItems"
              [placement]="'top'"
              [topMenuSize]="2"
              [useParentContainer]="true"
              [forceStaticPlacement]="true">
            </cometchat-context-menu>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-2);">
            <p style="margin: 0; font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Bottom</p>
            <cometchat-context-menu
              [data]="menuItems"
              [placement]="'bottom'"
              [topMenuSize]="2"
              [useParentContainer]="true"
              [forceStaticPlacement]="true">
            </cometchat-context-menu>
          </div>
        </div>
      </div>
    `,
    props: {
      menuItems: MOCK_MENU_ITEMS,
    },
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Four context menu instances demonstrating each placement direction (left, right, top, bottom) with forceStaticPlacement enabled. Click the more button on each to see the submenu appear in the specified direction.',
      },
    },
  },
};

/** Overflow menu open, with the nested "Organise" group sitting closed. */
export const OrganiseFlyoutClosed: Story = {
  args: {
    data: MOCK_ORGANISE_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           class="cometchat-context-menu-story__container"
           style="position:relative; width:100%; height:320px; box-sizing:border-box; padding: var(--cometchat-padding-5, 20px); display:flex; align-items:flex-start; justify-content:flex-start; overflow:visible;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const moreButton = canvasElement.querySelector('.cometchat-menu-list__sub-menu, [class*="menu-list"] [role="button"]') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'The overflow menu opened on a message that offers Pin and Save. Organise takes a single row with a chevron and nothing else — its flyout stays shut until the row is hovered or activated, so two related actions cost one line in an already long menu.',
      },
    },
  },
};

/** The "Organise" flyout open, showing the Pin and Save actions nested inside it. */
export const OrganiseFlyoutOpen: Story = {
  args: {
    data: MOCK_ORGANISE_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           class="cometchat-context-menu-story__container"
           style="position:relative; width:100%; height:320px; box-sizing:border-box; padding: var(--cometchat-padding-5, 20px); display:flex; align-items:flex-start; justify-content:flex-start; overflow:visible;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const moreButton = canvasElement.querySelector('.cometchat-menu-list__sub-menu, [class*="menu-list"] [role="button"]') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
    // The open menu is moved to document.body to escape clipping ancestors, so
    // it is no longer a descendant of canvasElement.
    const group = document.querySelector('#subMenuContext #organise, [class*="sub-menu-list-item--group"]') as HTMLElement;
    if (group) {
      group.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'The same menu with the Organise row activated, so its flyout is open to the right of the list. Choosing Pin or Save emits optionClick with that child; the group row itself never emits and never closes the menu.',
      },
    },
  },
};

/** The "Organise" flyout against the right edge, where it has to move to stay on screen. */
export const OrganiseFlyoutAtViewportEdge: Story = {
  args: {
    data: MOCK_ORGANISE_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           class="cometchat-context-menu-story__container"
           style="position:relative; width:100%; height:320px; box-sizing:border-box; padding: var(--cometchat-padding-5, 20px); display:flex; align-items:flex-start; justify-content:flex-end; overflow:visible;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const moreButton = canvasElement.querySelector('.cometchat-menu-list__sub-menu, [class*="menu-list"] [role="button"]') as HTMLElement;
    if (moreButton) {
      moreButton.click();
      await new Promise(r => setTimeout(r, 500));
    }
    const group = document.querySelector('#subMenuContext #organise, [class*="sub-menu-list-item--group"]') as HTMLElement;
    if (group) {
      group.click();
      await new Promise(r => setTimeout(r, 500));
    }
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'The same menu pushed against the right edge of the canvas, where a flyout opening rightwards would run off screen. Placement is decided from the rendered flyout rather than a width breakpoint, so it opens leftwards when the left side can hold it and is nudged back by hand when neither side can — either way its right edge lands inside the window.',
      },
    },
  },
};

// ============================================
// Showcase
// ============================================

/** Comprehensive showcase of all context menu variants in a single view. */
export const AllVariantsShowcase: Story = {
  render: () => ({
    template: `
      <div data-cometchat-container
           style="position:relative; width:600px; min-height:400px; overflow:visible; padding: var(--cometchat-spacing-5);">
        <div class="cometchat-context-menu-showcase" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-5);">

          <h3 class="cometchat-context-menu-showcase__title" style="margin: 0; font: var(--cometchat-font-heading3-bold); color: var(--cometchat-text-color-primary);">
            Context Menu Variants
          </h3>

          <!-- Default Menu -->
          <div class="cometchat-context-menu-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
            <p class="cometchat-context-menu-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Default (4 items, topMenuSize 2)
            </p>
            <cometchat-context-menu
              [data]="defaultItems"
              [topMenuSize]="2"
              [placement]="'bottom'"
              [forceStaticPlacement]="true">
            </cometchat-context-menu>
          </div>

          <!-- Extended Menu Items -->
          <div class="cometchat-context-menu-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-2);">
            <p class="cometchat-context-menu-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Extended Items (6 items, topMenuSize 3)
            </p>
            <cometchat-context-menu
              [data]="extendedItems"
              [topMenuSize]="3"
              [placement]="'bottom'"
              [forceStaticPlacement]="true">
            </cometchat-context-menu>
          </div>

          <!-- Placement Variants -->
          <div class="cometchat-context-menu-showcase__section" style="display: flex; flex-direction: column; gap: var(--cometchat-spacing-3);">
            <p class="cometchat-context-menu-showcase__section-label" style="margin: 0; font: var(--cometchat-font-body-medium); color: var(--cometchat-text-color-secondary);">
              Placement Variants
            </p>
            <div class="cometchat-context-menu-showcase__group" style="display: flex; gap: var(--cometchat-spacing-5); flex-wrap: wrap; padding-left: var(--cometchat-padding-2, var(--cometchat-spacing-2));">
              <div class="cometchat-context-menu-showcase__placement-item" style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-1);">
                <span style="font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Left</span>
                <cometchat-context-menu [data]="placementItems" [placement]="'left'" [topMenuSize]="2" [useParentContainer]="true" [forceStaticPlacement]="true"></cometchat-context-menu>
              </div>
              <div class="cometchat-context-menu-showcase__placement-item" style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-1);">
                <span style="font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Right</span>
                <cometchat-context-menu [data]="placementItems" [placement]="'right'" [topMenuSize]="2" [useParentContainer]="true" [forceStaticPlacement]="true"></cometchat-context-menu>
              </div>
              <div class="cometchat-context-menu-showcase__placement-item" style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-1);">
                <span style="font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Top</span>
                <cometchat-context-menu [data]="placementItems" [placement]="'top'" [topMenuSize]="2" [useParentContainer]="true" [forceStaticPlacement]="true"></cometchat-context-menu>
              </div>
              <div class="cometchat-context-menu-showcase__placement-item" style="display: flex; flex-direction: column; align-items: center; gap: var(--cometchat-spacing-1);">
                <span style="font: var(--cometchat-font-caption1-regular); color: var(--cometchat-text-color-secondary);">Bottom</span>
                <cometchat-context-menu [data]="placementItems" [placement]="'bottom'" [topMenuSize]="2" [useParentContainer]="true" [forceStaticPlacement]="true"></cometchat-context-menu>
              </div>
            </div>
          </div>

        </div>
      </div>
    `,
    props: {
      defaultItems: MOCK_MENU_ITEMS,
      extendedItems: MOCK_EXTENDED_MENU_ITEMS,
      placementItems: MOCK_MENU_ITEMS,
    },
  }),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          'Comprehensive showcase displaying all context menu variants — default configuration, extended item set, and all four placement directions — in a single view. All styling uses CometChat CSS variables for theme consistency.',
      },
    },
  },
};

// ============================================
// Interaction Tests — Prop Verification
// ============================================

import { expect } from '@storybook/test';

/** Verifies context menu trigger button renders. */
export const TestTriggerRenders: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const trigger = canvasElement.querySelector('cometchat-context-menu, .cometchat-context-menu');
    expect(trigger).not.toBeNull();
    // Should have a clickable trigger (button or icon)
    const btn = canvasElement.querySelector('.cometchat-context-menu__trigger, [class*="context-menu"] button, [class*="context-menu"] [class*="trigger"]');
    expect(btn).not.toBeNull();
  },
};

/** Verifies menu is hidden by default. */
export const TestMenuHiddenByDefault: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    // Menu content/options should not be visible initially
    const menuContent = canvasElement.querySelector('.cometchat-context-menu__options, [class*="context-menu"] [class*="options"], [role="menu"]');
    if (menuContent) {
      const isVisible = (menuContent as HTMLElement).offsetParent !== null;
      // Menu should be hidden or not rendered
      expect(isVisible).toBe(false);
    }
  },
};

/** Verifies clicking trigger opens the menu. */
export const TestClickOpensMenu: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const trigger = canvasElement.querySelector('.cometchat-context-menu__trigger, [class*="context-menu"] button, [class*="context-menu"] [class*="trigger"]') as HTMLElement;
    expect(trigger).not.toBeNull();

    // Click the trigger
    trigger.click();
    await new Promise(r => setTimeout(r, 500));

    // Menu should now be visible
    const menuContent = canvasElement.querySelector('.cometchat-context-menu__options, [class*="context-menu"] [class*="options"], [role="menu"], .cometchat-popover__content--visible');
    expect(menuContent).not.toBeNull();
  },
};

/** Verifies menu items render with correct count. */
export const TestMenuItemsRender: Story = {
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const trigger = canvasElement.querySelector('.cometchat-context-menu__trigger, [class*="context-menu"] button, [class*="context-menu"] [class*="trigger"]') as HTMLElement;
    if (trigger) {
      trigger.click();
      await new Promise(r => setTimeout(r, 500));

      const menuItems = canvasElement.querySelectorAll('[role="menuitem"], .cometchat-context-menu__option, [class*="context-menu"] [class*="option"]');
      expect(menuItems.length).toBeGreaterThan(0);
    }
  },
};

/** Verifies an item with children renders as a group whose flyout is closed. */
export const TestOrganiseGroupRendersClosed: Story = {
  args: {
    data: MOCK_ORGANISE_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           class="cometchat-context-menu-story__container"
           style="position:relative; width:100%; height:320px; box-sizing:border-box; padding: var(--cometchat-padding-5, 20px); display:flex; align-items:flex-start; justify-content:flex-start; overflow:visible;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const moreButton = canvasElement.querySelector('.cometchat-menu-list__sub-menu, [class*="menu-list"] [role="button"]') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    // The open menu is portaled to document.body, so it is no longer inside canvasElement.
    const group = document.querySelector('#subMenuContext #organise, [class*="sub-menu-list-item--group"]');
    expect(group).not.toBeNull();
    expect(group!.getAttribute('aria-haspopup')).toBe('menu');
    expect(group!.getAttribute('aria-expanded')).toBe('false');

    const chevron = group!.querySelector('.cometchat-menu-list__group-chevron, [class*="group-chevron"]');
    expect(chevron).not.toBeNull();

    // The flyout is not in the DOM at all until the group is activated.
    expect(group!.querySelector('[class*="group-flyout"]')).toBeNull();
  },
};

/** Verifies activating the group opens a flyout holding its two children. */
export const TestOrganiseFlyoutOpensChildren: Story = {
  args: {
    data: MOCK_ORGANISE_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           class="cometchat-context-menu-story__container"
           style="position:relative; width:100%; height:320px; box-sizing:border-box; padding: var(--cometchat-padding-5, 20px); display:flex; align-items:flex-start; justify-content:flex-start; overflow:visible;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const moreButton = canvasElement.querySelector('.cometchat-menu-list__sub-menu, [class*="menu-list"] [role="button"]') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    const group = document.querySelector('#subMenuContext #organise, [class*="sub-menu-list-item--group"]') as HTMLElement;
    expect(group).not.toBeNull();

    group.click();
    await new Promise(r => setTimeout(r, 500));

    const flyout = document.querySelector('.cometchat-menu-list__group-flyout, [class*="group-flyout"]') as HTMLElement;
    expect(flyout).not.toBeNull();
    expect(flyout.querySelectorAll('[role="menuitem"]').length).toBe(2);
    expect(flyout.textContent!.trim()).toContain('Pin');
    expect(flyout.textContent!.trim()).toContain('Save');

    // Opening a group is the whole interaction — it must not close the menu.
    expect(group.getAttribute('aria-expanded')).toBe('true');
  },
};

/** Verifies the flyout stays on screen when opened against the right edge. */
export const TestOrganiseFlyoutStaysOnScreen: Story = {
  args: {
    data: MOCK_ORGANISE_MENU_ITEMS,
    topMenuSize: 2,
    placement: Placement.bottom,
    useParentContainer: true,
  },
  render: args => ({
    props: args,
    template: `
      <div data-cometchat-container
           class="cometchat-context-menu-story__container"
           style="position:relative; width:100%; height:320px; box-sizing:border-box; padding: var(--cometchat-padding-5, 20px); display:flex; align-items:flex-start; justify-content:flex-end; overflow:visible;">
        <cometchat-context-menu
          [data]="data"
          [topMenuSize]="topMenuSize"
          [placement]="placement"
          [useParentContainer]="useParentContainer"
          (optionClick)="optionClick($event)">
        </cometchat-context-menu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await new Promise(r => setTimeout(r, 500));
    const moreButton = canvasElement.querySelector('.cometchat-menu-list__sub-menu, [class*="menu-list"] [role="button"]') as HTMLElement;
    expect(moreButton).not.toBeNull();

    moreButton.click();
    await new Promise(r => setTimeout(r, 500));

    const group = document.querySelector('#subMenuContext #organise, [class*="sub-menu-list-item--group"]') as HTMLElement;
    expect(group).not.toBeNull();

    group.click();
    await new Promise(r => setTimeout(r, 500));

    const flyout = document.querySelector('.cometchat-menu-list__group-flyout, [class*="group-flyout"]') as HTMLElement;
    expect(flyout).not.toBeNull();

    // Flipping left and shifting back by hand are both valid answers here —
    // which one applies depends on the canvas width, so assert the invariant
    // they share rather than one of the two.
    const moved =
      flyout.classList.contains('cometchat-menu-list__group-flyout--flip') || !!flyout.style.left;
    expect(moved).toBe(true);
    expect(Math.round(flyout.getBoundingClientRect().right)).toBeLessThanOrEqual(window.innerWidth);
  },
};
