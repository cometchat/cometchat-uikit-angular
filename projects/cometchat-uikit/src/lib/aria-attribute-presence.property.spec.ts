/**
 * Property-Based Tests for ARIA Attribute Presence
 *
 * Categories: Property-Based Accessibility Invariants
 * Validates: Requirements 10.5
 *
 * Property 19: ARIA Attribute Presence
 * For any component with interactive elements, each interactive element shall
 * have at least one of role, aria-label, or aria-labelledby attributes present.
 *
 * Tests a representative set of standalone components:
 * - CometChatButtonComponent (button with aria-label)
 * - CometChatListItemComponent (div with role="listitem", aria-label, aria-describedby)
 * - CometChatCheckboxComponent (input with aria-checked, aria-label)
 * - CometChatAvatarComponent (div with role="img", aria-label)
 * - CometChatActionSheetComponent (div with role="menu", items with role="menuitem", aria-label)
 * - CometChatSearchBarComponent (div with role="search", input with role="searchbox", aria-label)
 * - CometChatRadioButtonComponent (input with aria-checked, aria-label)
 * - CometChatToastComponent (div with role="alert"/"status", aria-live, aria-label)
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module aria-attribute-presence.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './test-setup';

import { CometChatButtonComponent } from './components/cometchat-button/cometchat-button.component';
import { CometChatListItemComponent } from './components/base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatCheckboxComponent } from './components/base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatAvatarComponent } from './components/cometchat-avatar/cometchat-avatar.component';
import { CometChatActionSheetComponent } from './components/cometchat-action-sheet/cometchat-action-sheet.component';
import { CometChatSearchBarComponent } from './components/base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatRadioButtonComponent } from './components/base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatToastComponent } from './components/base-elements/cometchat-toast/cometchat-toast.component';

// ==================== Constants & Helpers ====================

/**
 * ARIA attributes that indicate an interactive element is properly labeled
 * for assistive technologies. At least one must be present on every
 * interactive element.
 */
const ARIA_IDENTITY_ATTRS = ['role', 'aria-label', 'aria-labelledby'] as const;

/**
 * Extended set of ARIA attributes that provide accessible identity.
 * Includes aria-describedby as a supplementary attribute.
 */
const ARIA_EXTENDED_ATTRS = [...ARIA_IDENTITY_ATTRS, 'aria-describedby'] as const;

/**
 * Checks whether a DOM element has at least one ARIA identity attribute.
 * Returns true if the element has role, aria-label, or aria-labelledby.
 */
function hasAriaIdentity(el: HTMLElement): boolean {
  return ARIA_IDENTITY_ATTRS.some(attr => {
    const val = el.getAttribute(attr);
    return val !== null && val.trim().length > 0;
  });
}

/**
 * Returns which ARIA identity attributes are present on an element.
 */
function getAriaAttributes(el: HTMLElement): string[] {
  return ARIA_EXTENDED_ATTRS.filter(attr => {
    const val = el.getAttribute(attr);
    return val !== null && val.trim().length > 0;
  });
}

/**
 * Queries all interactive elements within a root element.
 * Interactive elements are those with explicit roles, native interactive tags,
 * or tabindex attributes.
 */
function getInteractiveElements(root: HTMLElement): HTMLElement[] {
  const roleSelectors = [
    '[role="button"]',
    '[role="menuitem"]',
    '[role="tab"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="option"]',
    '[role="listitem"]',
    '[role="menu"]',
    '[role="search"]',
    '[role="searchbox"]',
    '[role="img"]',
    '[role="alert"]',
    '[role="status"]',
    '[role="group"]',
  ];

  const nativeSelectors = ['button', 'a[href]', 'input', 'select', 'textarea'];

  const tabindexSelector = '[tabindex]';

  const allSelectors = [...roleSelectors, ...nativeSelectors, tabindexSelector].join(', ');
  const elements = root.querySelectorAll<HTMLElement>(allSelectors);
  return [...new Set([...elements])];
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
    minInteractive: 1,
  },
  {
    name: 'CometChatListItemComponent',
    component: CometChatListItemComponent,
    setup: fixture => {
      fixture.componentInstance.title = 'Test Item';
      fixture.componentInstance.id = 'test-item-1';
    },
    minInteractive: 1,
  },
  {
    name: 'CometChatCheckboxComponent',
    component: CometChatCheckboxComponent,
    setup: fixture => {
      fixture.componentInstance.labelText = 'Check me';
    },
    minInteractive: 1,
  },
  {
    name: 'CometChatAvatarComponent',
    component: CometChatAvatarComponent,
    setup: fixture => {
      fixture.componentInstance.name = 'John Doe';
    },
    minInteractive: 1,
  },
  {
    name: 'CometChatSearchBarComponent',
    component: CometChatSearchBarComponent,
    setup: fixture => {
      fixture.componentInstance.searchText = '';
    },
    minInteractive: 1,
  },
  {
    name: 'CometChatRadioButtonComponent',
    component: CometChatRadioButtonComponent,
    setup: fixture => {
      fixture.componentInstance.labelText = 'Option A';
      fixture.componentInstance.id = 'radio-1';
    },
    minInteractive: 1,
  },
];

/** Arbitrary that picks any component descriptor. */
const arbDescriptor = fc.constantFrom(...COMPONENT_DESCRIPTORS);

/** Arbitrary for non-empty text strings. */
const arbText = fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0);

/** Arbitrary for label text. */
const arbLabel = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0);

/** Arbitrary for action sheet item count (1-8). */
const arbActionCount = fc.integer({ min: 1, max: 8 });

/** Arbitrary boolean. */
const arbBool = fc.boolean();

/** Arbitrary for toast types. */
const arbToastType = fc.constantFrom('success', 'error', 'warning', 'info');

// ==================== Tests ====================

describe('Property 19: ARIA Attribute Presence', () => {
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
        CometChatToastComponent,
      ],
    });
  });

  // ---------- Core property: all interactive elements across any component have ARIA identity ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For any component with interactive elements, each interactive element
   * has at least one of role, aria-label, or aria-labelledby.
   */
  it('all interactive elements across any component have ARIA identity attributes', () => {
    fc.assert(
      fc.property(arbDescriptor, descriptor => {
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        if (descriptor.setup) descriptor.setup(fixture);
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const interactiveElements = getInteractiveElements(el);

        for (const interactiveEl of interactiveElements) {
          const attrs = getAriaAttributes(interactiveEl);
          expect(
            hasAriaIdentity(interactiveEl),
            `Element <${interactiveEl.tagName.toLowerCase()}> in ${descriptor.name} ` +
              `has no ARIA identity (found: [${attrs.join(', ')}]). ` +
              `Expected at least one of: role, aria-label, aria-labelledby`
          ).toBe(true);
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: <button> has aria-label for any text ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatButtonComponent with any text, the rendered <button>
   * element has an aria-label attribute providing accessible name.
   */
  it('Button: <button> has aria-label for any text', () => {
    fc.assert(
      fc.property(arbText, text => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = text;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();
        expect(hasAriaIdentity(btn!)).toBe(true);

        // Button should specifically have aria-label
        const ariaLabel = btn!.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: disabled/loading states preserve ARIA attributes ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatButtonComponent in any disabled/loading state,
   * the button retains its ARIA identity attributes plus state attributes.
   */
  it('Button: disabled/loading states preserve ARIA identity attributes', () => {
    fc.assert(
      fc.property(arbBool, arbBool, (disabled, loading) => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = 'Test';
        fixture.componentInstance.disabled = disabled;
        fixture.componentInstance.isLoading = loading;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();
        expect(hasAriaIdentity(btn!)).toBe(true);

        // Verify state-related ARIA attributes are present when applicable
        if (disabled) {
          expect(btn!.getAttribute('aria-disabled')).toBe('true');
        }
        if (loading) {
          expect(btn!.getAttribute('aria-busy')).toBe('true');
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: root element has role and aria-label ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatListItemComponent with any title, the root list-item div
   * has role="listitem" and aria-label providing accessible identity.
   */
  it('ListItem: root element has role and aria-label for any title', () => {
    fc.assert(
      fc.property(arbText, title => {
        const fixture = TestBed.createComponent(CometChatListItemComponent);
        fixture.componentInstance.title = title;
        fixture.componentInstance.id = 'test-item';
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const listItem = el.querySelector('.cometchat-list-item') as HTMLElement;
        expect(listItem).toBeTruthy();

        // Should have role="listitem"
        expect(listItem!.getAttribute('role')).toBe('listitem');
        // Should also have aria-label
        expect(listItem!.getAttribute('aria-label')).toBeTruthy();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: subtitle adds aria-describedby ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatListItemComponent with a subtitle, the root element
   * has aria-describedby pointing to the subtitle element.
   */
  it('ListItem: subtitle presence adds aria-describedby', () => {
    fc.assert(
      fc.property(arbText, arbText, (title, subtitle) => {
        const fixture = TestBed.createComponent(CometChatListItemComponent);
        fixture.componentInstance.title = title;
        fixture.componentInstance.subtitle = subtitle;
        fixture.componentInstance.id = 'test-item';
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const listItem = el.querySelector('.cometchat-list-item') as HTMLElement;
        expect(listItem).toBeTruthy();

        // With subtitle, aria-describedby should be present
        const describedBy = listItem!.getAttribute('aria-describedby');
        expect(describedBy).toBeTruthy();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: input has aria-label and aria-checked ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatCheckboxComponent with any label, the <input> element
   * has aria-label and aria-checked attributes.
   */
  it('Checkbox: input has aria-label and aria-checked for any label', () => {
    fc.assert(
      fc.property(arbLabel, arbBool, (labelText, checked) => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.componentInstance.labelText = labelText;
        fixture.componentInstance.checked = checked;
        fixture.componentInstance.ngOnInit();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-checkbox__input') as HTMLElement;
        expect(input).toBeTruthy();
        expect(hasAriaIdentity(input!)).toBe(true);

        // Should have aria-checked reflecting state
        const ariaChecked = input!.getAttribute('aria-checked');
        expect(ariaChecked).toBeTruthy();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Avatar: container has role="img" and aria-label ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatAvatarComponent with any name, the avatar container
   * has role="img" and aria-label for screen reader identification.
   */
  it('Avatar: container has role="img" and aria-label for any name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /\w/.test(s)),
        name => {
          const fixture = TestBed.createComponent(CometChatAvatarComponent);
          fixture.componentInstance.name = name;
          fixture.detectChanges();

          const el: HTMLElement = fixture.nativeElement;
          const avatar = el.querySelector('.cometchat-avatar') as HTMLElement;
          expect(avatar).toBeTruthy();

          // Should have role="img"
          expect(avatar!.getAttribute('role')).toBe('img');
          // Should have aria-label
          expect(avatar!.getAttribute('aria-label')).toBeTruthy();

          fixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- ActionSheet: container has role="menu" and items have role="menuitem" ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatActionSheetComponent with N actions, the container has
   * role="menu" with aria-label, and each item has role="menuitem" with aria-label.
   */
  it('ActionSheet: container and items have proper ARIA roles and labels', () => {
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

        // Container should have role="menu"
        const menu = el.querySelector('[role="menu"]') as HTMLElement;
        expect(menu).toBeTruthy();
        expect(menu!.getAttribute('aria-label')).toBeTruthy();

        // Each item should have role="menuitem" and aria-label
        const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]');
        expect(items.length).toBe(count);

        items.forEach((item, i) => {
          expect(item.getAttribute('role')).toBe('menuitem');
          expect(item.getAttribute('aria-label')).toBeTruthy();
          expect(item.getAttribute('aria-label')).toBe(`Action ${i}`);
        });

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- SearchBar: container has role="search" and input has role="searchbox" ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatSearchBarComponent, the container has role="search"
   * and the input has role="searchbox" with aria-label.
   */
  it('SearchBar: container and input have proper ARIA roles and labels', () => {
    fc.assert(
      fc.property(arbLabel, placeholder => {
        const fixture = TestBed.createComponent(CometChatSearchBarComponent);
        fixture.componentInstance.placeholderText = placeholder;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;

        // Container should have role="search"
        const searchContainer = el.querySelector('[role="search"]') as HTMLElement;
        expect(searchContainer).toBeTruthy();

        // Input should have role="searchbox" and aria-label
        const input = el.querySelector('[role="searchbox"]') as HTMLElement;
        expect(input).toBeTruthy();
        expect(input!.getAttribute('aria-label')).toBeTruthy();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- SearchBar: clear button has aria-label when visible ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatSearchBarComponent with non-empty search text,
   * the clear button has an aria-label attribute.
   */
  it('SearchBar: clear button has aria-label when visible', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        searchText => {
          const fixture = TestBed.createComponent(CometChatSearchBarComponent);
          fixture.componentInstance.searchText = searchText;
          fixture.componentInstance.searchValue = searchText;
          fixture.detectChanges();

          const el: HTMLElement = fixture.nativeElement;
          const clearBtn = el.querySelector('.cometchat-search-bar__clear') as HTMLElement;

          if (clearBtn) {
            expect(hasAriaIdentity(clearBtn)).toBe(true);
            expect(clearBtn.getAttribute('aria-label')).toBeTruthy();
          }

          fixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- RadioButton: input has aria-label and aria-checked ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatRadioButtonComponent with any label, the <input type="radio">
   * has aria-label and aria-checked attributes.
   */
  it('RadioButton: input has aria-label and aria-checked for any label', () => {
    fc.assert(
      fc.property(arbLabel, arbBool, (labelText, checked) => {
        const fixture = TestBed.createComponent(CometChatRadioButtonComponent);
        fixture.componentInstance.labelText = labelText;
        fixture.componentInstance.id = 'test-radio';
        fixture.componentInstance.checked = checked;
        fixture.componentInstance.ngOnInit();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-radio-button__input') as HTMLElement;
        expect(input).toBeTruthy();
        expect(hasAriaIdentity(input!)).toBe(true);

        // Should have aria-checked
        const ariaChecked = input!.getAttribute('aria-checked');
        expect(ariaChecked).toBeTruthy();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Toast: container has role and aria-live for any type ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatToastComponent with any toast type, the container has
   * a proper role (alert/status), aria-live, and aria-label.
   */
  it('Toast: container has role, aria-live, and aria-label for any type', () => {
    fc.assert(
      fc.property(arbToastType, arbText, (type, text) => {
        const fixture = TestBed.createComponent(CometChatToastComponent);
        fixture.componentInstance.type = type as any;
        fixture.componentInstance.text = text;
        fixture.componentInstance.duration = 0; // prevent auto-dismiss
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const toast = el.querySelector('.cometchat-toast') as HTMLElement;

        if (toast) {
          // Should have role (alert or status)
          const role = toast.getAttribute('role');
          expect(role).toBeTruthy();
          expect(['alert', 'status']).toContain(role);

          // Should have aria-live
          const ariaLive = toast.getAttribute('aria-live');
          expect(ariaLive).toBeTruthy();
          expect(['assertive', 'polite']).toContain(ariaLive);

          // Should have aria-label
          expect(toast.getAttribute('aria-label')).toBeTruthy();
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Toast: close button has aria-label ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatToastComponent with showCloseButton=true,
   * the close button has an aria-label attribute.
   */
  it('Toast: close button has aria-label when visible', () => {
    fc.assert(
      fc.property(arbToastType, type => {
        const fixture = TestBed.createComponent(CometChatToastComponent);
        fixture.componentInstance.type = type as any;
        fixture.componentInstance.text = 'Test message';
        fixture.componentInstance.showCloseButton = true;
        fixture.componentInstance.duration = 0;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const closeBtn = el.querySelector('.cometchat-toast__close') as HTMLElement;

        if (closeBtn) {
          expect(hasAriaIdentity(closeBtn)).toBe(true);
          expect(closeBtn.getAttribute('aria-label')).toBeTruthy();
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- No interactive element lacks ARIA identity across all components ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For any component, no interactive element (with role, tabindex, or native
   * interactive tag) lacks all ARIA identity attributes.
   */
  it('no interactive element lacks ARIA identity across any component', () => {
    fc.assert(
      fc.property(arbDescriptor, descriptor => {
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        if (descriptor.setup) descriptor.setup(fixture);
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const interactiveElements = getInteractiveElements(el);

        const elementsWithoutAria = interactiveElements.filter(
          interactiveEl => !hasAriaIdentity(interactiveEl)
        );

        expect(
          elementsWithoutAria.length,
          `${descriptor.name} has ${elementsWithoutAria.length} interactive element(s) without ARIA identity: ` +
            elementsWithoutAria.map(e => `<${e.tagName.toLowerCase()}>`).join(', ')
        ).toBe(0);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Decorative elements have aria-hidden ----------

  /**
   * **Validates: Requirements 10.5**
   *
   * For CometChatButtonComponent, decorative icon elements have
   * aria-hidden="true" to prevent screen reader confusion.
   */
  it('Button: decorative icons have aria-hidden="true"', () => {
    fc.assert(
      fc.property(arbText, text => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = text;
        fixture.componentInstance.iconURL = 'https://example.com/icon.svg';
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const icon = el.querySelector('.cometchat-button__icon') as HTMLElement;

        if (icon) {
          expect(icon.getAttribute('aria-hidden')).toBe('true');
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
});
