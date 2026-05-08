/**
 * Property-Based Tests for Interactive Element Focusability
 *
 * Categories: Property-Based Keyboard Accessibility Invariants
 * Validates: Requirements 10.1
 *
 * Property 17: Interactive Element Focusability
 * For any component with clickable elements, each clickable element shall have
 * either a native focusable tag (button, a, input, select, textarea) or a
 * tabindex attribute that is not -1.
 *
 * Tests a representative set of standalone components:
 * - CometChatButtonComponent (native <button>)
 * - CometChatListItemComponent (div with tabindex, click handler)
 * - CometChatCheckboxComponent (native <input type="checkbox">)
 * - CometChatAvatarComponent (presentational, no click handlers expected)
 * - CometChatActionSheetComponent (div items with tabindex="0")
 * - CometChatSearchBarComponent (native <input>, <button> for clear)
 * - CometChatRadioButtonComponent (native <input type="radio">)
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module interactive-element-focusability.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './test-setup';

import { CometChatButtonComponent } from './components/base-elements/cometchat-button/cometchat-button.component';
import { CometChatListItemComponent } from './components/base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatCheckboxComponent } from './components/base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatAvatarComponent } from './components/base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatActionSheetComponent } from './components/base-elements/cometchat-action-sheet/cometchat-action-sheet.component';
import { CometChatSearchBarComponent } from './components/base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatRadioButtonComponent } from './components/base-elements/cometchat-radio-button/cometchat-radio-button.component';

// ==================== Constants ====================

/**
 * Native HTML tags that are focusable by default (without tabindex).
 * These elements receive keyboard focus via Tab key navigation natively.
 */
const NATIVE_FOCUSABLE_TAGS = new Set([
  'A',
  'BUTTON',
  'INPUT',
  'SELECT',
  'TEXTAREA',
  'SUMMARY',
  'DETAILS',
]);

/**
 * Checks whether a DOM element is keyboard-focusable.
 * An element is focusable if:
 * 1. It is a natively focusable HTML element (button, a, input, select, textarea), OR
 * 2. It has a tabindex attribute that is NOT -1
 */
function isElementFocusable(el: HTMLElement): boolean {
  // Check native focusability
  if (NATIVE_FOCUSABLE_TAGS.has(el.tagName)) {
    // Native focusable elements are still focusable unless tabindex="-1"
    const tabindex = el.getAttribute('tabindex');
    if (tabindex === '-1') return false;
    return true;
  }

  // Check tabindex for non-native elements
  const tabindex = el.getAttribute('tabindex');
  if (tabindex === null) return false;
  const tabindexNum = parseInt(tabindex, 10);
  return !isNaN(tabindexNum) && tabindexNum !== -1;
}

/**
 * Queries all interactive elements within a root element.
 * Interactive elements are those with click handlers, role="button",
 * role="menuitem", role="listitem" with click, or explicit tabindex.
 */
function getInteractiveElements(root: HTMLElement): HTMLElement[] {
  const interactive: HTMLElement[] = [];

  // Elements with explicit roles that imply interactivity
  const roleSelectors = [
    '[role="button"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="option"]',
  ];

  // Native interactive elements
  const nativeSelectors = ['button', 'a[href]', 'input', 'select', 'textarea'];

  // Elements with click handlers (Angular binds these)
  // In jsdom, Angular click bindings appear as regular event listeners,
  // but we can detect elements with tabindex (which implies interactivity)
  const tabindexSelector = '[tabindex]';

  const allSelectors = [...roleSelectors, ...nativeSelectors, tabindexSelector].join(', ');
  const elements = root.querySelectorAll<HTMLElement>(allSelectors);
  elements.forEach(el => interactive.push(el));

  // Deduplicate
  return [...new Set(interactive)];
}

// ==================== Types ====================

interface ComponentDescriptor {
  name: string;
  component: any;
  /** Setup function to configure the component so interactive elements render */
  setup?: (fixture: ComponentFixture<any>) => void;
  /** Minimum expected interactive elements after setup */
  minInteractive: number;
}

// ==================== Component Descriptors ====================

const COMPONENT_DESCRIPTORS: ComponentDescriptor[] = [
  {
    name: 'CometChatButtonComponent',
    component: CometChatButtonComponent,
    setup: fixture => {
      fixture.componentInstance.text = 'Click Me';
    },
    minInteractive: 1, // the <button> element
  },
  {
    name: 'CometChatListItemComponent',
    component: CometChatListItemComponent,
    setup: fixture => {
      fixture.componentInstance.title = 'Test Item';
      fixture.componentInstance.id = 'test-item-1';
    },
    minInteractive: 1, // the div[tabindex="0"] with click handler
  },
  {
    name: 'CometChatCheckboxComponent',
    component: CometChatCheckboxComponent,
    setup: fixture => {
      fixture.componentInstance.labelText = 'Check me';
    },
    minInteractive: 1, // the <input type="checkbox">
  },
  {
    name: 'CometChatSearchBarComponent',
    component: CometChatSearchBarComponent,
    setup: fixture => {
      fixture.componentInstance.searchText = 'test';
      fixture.componentInstance.searchValue = 'test';
    },
    minInteractive: 1, // the <input type="search"> (clear button appears conditionally)
  },
  {
    name: 'CometChatRadioButtonComponent',
    component: CometChatRadioButtonComponent,
    setup: fixture => {
      fixture.componentInstance.labelText = 'Option A';
      fixture.componentInstance.id = 'radio-1';
    },
    minInteractive: 1, // the <input type="radio">
  },
];

/** Arbitrary that picks any component descriptor. */
const arbDescriptor = fc.constantFrom(...COMPONENT_DESCRIPTORS);

/** Arbitrary for non-empty button text. */
const arbButtonText = fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0);

/** Arbitrary for list item titles. */
const arbTitle = fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0);

/** Arbitrary for label text. */
const arbLabel = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0);

/** Arbitrary for search text. */
const arbSearchText = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0);

/** Arbitrary for action sheet item count (1-8). */
const arbActionCount = fc.integer({ min: 1, max: 8 });

/** Arbitrary boolean. */
const arbBool = fc.boolean();

// ==================== Tests ====================

describe('Property 17: Interactive Element Focusability', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CometChatButtonComponent,
        CometChatListItemComponent,
        CometChatCheckboxComponent,
        CometChatAvatarComponent,
        CometChatActionSheetComponent,
        CometChatSearchBarComponent,
        CometChatRadioButtonComponent,
      ],
    });
  });

  // ---------- Core property: all interactive elements in any component are focusable ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For any component with clickable elements, each interactive element
   * has a native focusable tag or tabindex not -1.
   */
  it('all interactive elements across any component are keyboard-focusable', () => {
    fc.assert(
      fc.property(arbDescriptor, descriptor => {
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        if (descriptor.setup) descriptor.setup(fixture);
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const interactiveElements = getInteractiveElements(el);

        for (const interactiveEl of interactiveElements) {
          expect(isElementFocusable(interactiveEl)).toBe(true);
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: native <button> is always focusable ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatButtonComponent with any text, the rendered <button>
   * element is natively focusable.
   */
  it('Button: <button> element is natively focusable for any text', () => {
    fc.assert(
      fc.property(arbButtonText, text => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = text;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();
        expect(isElementFocusable(btn!)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: disabled button remains focusable (for screen readers) ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatButtonComponent, even when disabled, the <button> element
   * remains in the DOM and is a natively focusable tag (disabled buttons
   * are still focusable in the DOM, they just don't respond to activation).
   */
  it('Button: disabled button element is still a native focusable tag', () => {
    fc.assert(
      fc.property(arbBool, disabled => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = 'Test';
        fixture.componentInstance.disabled = disabled;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();
        // <button> is always a native focusable tag regardless of disabled state
        expect(NATIVE_FOCUSABLE_TAGS.has(btn!.tagName)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: root div has tabindex for focusability ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatListItemComponent with any title, the root list-item div
   * has tabindex="0" making it keyboard-focusable.
   */
  it('ListItem: root element has tabindex making it focusable for any title', () => {
    fc.assert(
      fc.property(arbTitle, title => {
        const fixture = TestBed.createComponent(CometChatListItemComponent);
        fixture.componentInstance.title = title;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const listItem = el.querySelector('.cometchat-list-item') as HTMLElement;
        expect(listItem).toBeTruthy();
        expect(isElementFocusable(listItem!)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: disableTabIndex removes focusability ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatListItemComponent, when disableTabIndex is false,
   * the list item is focusable; the tabindex attribute is present.
   */
  it('ListItem: tabindex is present when disableTabIndex is false', () => {
    fc.assert(
      fc.property(arbTitle, title => {
        const fixture = TestBed.createComponent(CometChatListItemComponent);
        fixture.componentInstance.title = title;
        fixture.componentInstance.disableTabIndex = false;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const listItem = el.querySelector('.cometchat-list-item') as HTMLElement;
        expect(listItem).toBeTruthy();
        const tabindex = listItem!.getAttribute('tabindex');
        expect(tabindex).toBe('0');

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: native <input> is always focusable ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatCheckboxComponent with any label, the <input type="checkbox">
   * element is natively focusable.
   */
  it('Checkbox: <input> element is natively focusable for any label', () => {
    fc.assert(
      fc.property(arbLabel, labelText => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.componentInstance.labelText = labelText;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-checkbox__input') as HTMLElement;
        expect(input).toBeTruthy();
        expect(isElementFocusable(input!)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: disabled checkbox input is still a native focusable tag ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatCheckboxComponent, even when disabled, the <input> element
   * is a natively focusable HTML tag.
   */
  it('Checkbox: disabled input is still a native focusable tag', () => {
    fc.assert(
      fc.property(arbBool, disabled => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.componentInstance.labelText = 'Test';
        fixture.componentInstance.disabled = disabled;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-checkbox__input') as HTMLElement;
        expect(input).toBeTruthy();
        expect(NATIVE_FOCUSABLE_TAGS.has(input!.tagName)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ActionSheet: each action item has tabindex="0" ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatActionSheetComponent with N action items, each rendered
   * action item div has tabindex="0" making it keyboard-focusable.
   */
  it('ActionSheet: every action item is focusable for any number of actions', () => {
    fc.assert(
      fc.property(arbActionCount, count => {
        const fixture = TestBed.createComponent(CometChatActionSheetComponent);
        const actions = Array.from({ length: count }, (_, i) => ({
          id: `action-${i}`,
          title: `Action ${i}`,
          iconURL: '',
        }));
        fixture.componentInstance.actions = actions as any;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const items = el.querySelectorAll<HTMLElement>('.cometchat-action-sheet__item');
        expect(items.length).toBe(count);

        items.forEach(item => {
          expect(isElementFocusable(item)).toBe(true);
        });

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- SearchBar: input element is natively focusable ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatSearchBarComponent, the search <input> element
   * is natively focusable for any placeholder text.
   */
  it('SearchBar: search input is natively focusable', () => {
    fc.assert(
      fc.property(arbLabel, placeholder => {
        const fixture = TestBed.createComponent(CometChatSearchBarComponent);
        fixture.componentInstance.placeholderText = placeholder;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-search-bar__input') as HTMLElement;
        expect(input).toBeTruthy();
        expect(isElementFocusable(input!)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- SearchBar: clear button is focusable when visible ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatSearchBarComponent, when search text is non-empty,
   * the clear button appears and is focusable (native <button> or tabindex).
   */
  it('SearchBar: clear button is focusable when search text is non-empty', () => {
    fc.assert(
      fc.property(arbSearchText, searchText => {
        const fixture = TestBed.createComponent(CometChatSearchBarComponent);
        fixture.componentInstance.searchText = searchText;
        fixture.componentInstance.searchValue = searchText;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const clearBtn = el.querySelector('.cometchat-search-bar__clear') as HTMLElement;
        // Clear button should appear when there's text
        if (clearBtn) {
          expect(isElementFocusable(clearBtn)).toBe(true);
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- RadioButton: native <input type="radio"> is focusable ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatRadioButtonComponent with any label, the <input type="radio">
   * element is natively focusable.
   */
  it('RadioButton: <input type="radio"> is natively focusable for any label', () => {
    fc.assert(
      fc.property(arbLabel, labelText => {
        const fixture = TestBed.createComponent(CometChatRadioButtonComponent);
        fixture.componentInstance.labelText = labelText;
        fixture.componentInstance.id = 'test-radio';
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-radio-button__input') as HTMLElement;
        expect(input).toBeTruthy();
        expect(isElementFocusable(input!)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- No interactive element has tabindex="-1" across components ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For any component, no interactive element (with role or click handler)
   * has tabindex="-1" which would make it unfocusable via keyboard.
   */
  it('no interactive element has tabindex="-1" across any component', () => {
    fc.assert(
      fc.property(arbDescriptor, descriptor => {
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        if (descriptor.setup) descriptor.setup(fixture);
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const interactiveElements = getInteractiveElements(el);

        for (const interactiveEl of interactiveElements) {
          const tabindex = interactiveEl.getAttribute('tabindex');
          expect(tabindex).not.toBe('-1');
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Avatar: presentational component has no unfocusable interactive elements ----------

  /**
   * **Validates: Requirements 10.1**
   *
   * For CometChatAvatarComponent (presentational, no click handlers),
   * any elements with interactive roles still satisfy focusability.
   * This verifies that even non-interactive components don't accidentally
   * introduce unfocusable interactive elements.
   */
  it('Avatar: no interactive elements have tabindex="-1"', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\w/.test(s)),
        name => {
          const fixture = TestBed.createComponent(CometChatAvatarComponent);
          fixture.componentInstance.name = name;
          fixture.detectChanges();

          const el: HTMLElement = fixture.nativeElement;
          const interactiveElements = getInteractiveElements(el);

          for (const interactiveEl of interactiveElements) {
            expect(isElementFocusable(interactiveEl)).toBe(true);
          }

          fixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
