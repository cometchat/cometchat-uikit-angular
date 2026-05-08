/**
 * Property-Based Tests for Input Reflection
 *
 * Categories: Property-Based Input Reflection Invariants
 * Validates: Requirements 2.2, 2.5
 *
 * Property 8: Input Reflection
 * For any component and any @Input(), setting a valid value and triggering
 * detectChanges() causes internal state or DOM to reflect the new value.
 *
 * Tests a representative set of standalone components:
 * - CometChatAvatarComponent (string inputs → DOM text/attributes)
 * - CometChatButtonComponent (string/boolean inputs → DOM text/attributes/classes)
 * - CometChatDeleteBubbleComponent (boolean/string inputs → DOM classes/text)
 * - CometChatActionBubbleComponent (string/boolean inputs → DOM text/classes)
 * - CometChatDateComponent (number input → internal state)
 * - CometChatListItemComponent (string inputs → DOM text/attributes)
 * - CometChatCheckboxComponent (boolean/string inputs → DOM attributes/text)
 * - CometChatToastComponent (string/boolean inputs → DOM text/attributes)
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module active-selection.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './test-setup';

import { CometChatAvatarComponent } from './components/base-elements/cometchat-avatar/cometchat-avatar.component';
import { CometChatButtonComponent } from './components/base-elements/cometchat-button/cometchat-button.component';
import { CometChatDeleteBubbleComponent } from './components/cometchat-delete-bubble/cometchat-delete-bubble.component';
import { CometChatActionBubbleComponent } from './components/cometchat-action-bubble/cometchat-action-bubble.component';
import { CometChatDateComponent } from './components/base-elements/cometchat-date/cometchat-date.component';
import { CometChatListItemComponent } from './components/base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatCheckboxComponent } from './components/base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatToastComponent } from './components/base-elements/cometchat-toast/cometchat-toast.component';

// ==================== Types ====================

/**
 * Describes a single input reflection check: how to set a value and
 * how to verify it reflected in internal state or DOM.
 */
interface InputReflectionDescriptor {
  name: string;
  component: any;
  /** Input property name on the component instance */
  inputKey: string;
  /** fast-check arbitrary that produces valid values for this input */
  arbitrary: fc.Arbitrary<any>;
  /**
   * Verification function: given the fixture and the value that was set,
   * returns true if the component correctly reflects the value.
   */
  verify: (fixture: ComponentFixture<any>, value: any) => boolean;
  /**
   * Optional setup function to prepare the fixture before setting the input.
   * Used for components that need prerequisite inputs (e.g., Toast needs duration=0).
   */
  setup?: (fixture: ComponentFixture<any>) => void;
}

// ==================== Arbitraries ====================

/** Non-empty printable strings for text inputs — must contain at least one letter, no leading/trailing whitespace. */
const arbNonEmptyString = fc
  .string({ minLength: 1, maxLength: 60 })
  .filter(s => s.trim().length > 0 && /[a-zA-Z]/.test(s) && s === s.trim());

/** Arbitrary for names with at least one letter character, no leading/trailing whitespace. */
const arbName = fc.oneof(
  fc.string({ minLength: 1, maxLength: 30 }).filter(s => /[a-zA-Z]/.test(s) && s === s.trim()),
  fc
    .tuple(
      fc.string({ minLength: 1, maxLength: 15 }).filter(s => /[a-zA-Z]/.test(s) && s === s.trim()),
      fc.string({ minLength: 1, maxLength: 15 }).filter(s => /[a-zA-Z]/.test(s) && s === s.trim())
    )
    .map(([a, b]) => `${a} ${b}`)
);

/** Arbitrary for URL-like strings. */
const arbUrl = fc.webUrl();

/** Arbitrary boolean. */
const arbBool = fc.boolean();

/** Arbitrary for valid Unix timestamps (seconds, recent past). */
const arbTimestamp = fc.integer({ min: 1_000_000_000, max: 2_000_000_000 });

/** Arbitrary for toast types. */
const arbToastType = fc.constantFrom('success', 'error', 'warning', 'info');

// ==================== Helper ====================

/**
 * Sets an input on a fixture using componentRef.setInput() for OnPush compatibility,
 * then calls detectChanges().
 */
function setInputAndDetect(fixture: ComponentFixture<any>, key: string, value: any): void {
  fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
}

// ==================== Input Reflection Descriptors ====================

const REFLECTION_DESCRIPTORS: InputReflectionDescriptor[] = [
  // --- CometChatAvatarComponent ---
  {
    name: 'Avatar: name → initials in DOM',
    component: CometChatAvatarComponent,
    inputKey: 'name',
    arbitrary: arbName,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatAvatarComponent;
      const initials = comp.initials;
      if (!value || !value.trim()) return initials === '';
      return initials.length > 0 && initials === initials.toUpperCase();
    },
  },
  {
    name: 'Avatar: image → component.image reflects value',
    component: CometChatAvatarComponent,
    inputKey: 'image',
    arbitrary: arbUrl,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatAvatarComponent;
      return comp.image === value;
    },
  },
  {
    name: 'Avatar: name → aria-label contains name',
    component: CometChatAvatarComponent,
    inputKey: 'name',
    arbitrary: arbName,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const div = el.querySelector('.cometchat-avatar');
      if (!div) return false;
      const ariaLabel = div.getAttribute('aria-label') || '';
      return ariaLabel.includes(value);
    },
  },

  // --- CometChatButtonComponent ---
  {
    name: 'Button: text → label text in DOM',
    component: CometChatButtonComponent,
    inputKey: 'text',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const label = el.querySelector('.cometchat-button__text');
      if (!label) return false;
      return (label.textContent || '').trim() === value;
    },
  },
  {
    name: 'Button: hoverText → title attribute on button',
    component: CometChatButtonComponent,
    inputKey: 'hoverText',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector('button.cometchat-button');
      if (!btn) return false;
      return btn.getAttribute('title') === value;
    },
  },
  {
    name: 'Button: disabled → button disabled attribute',
    component: CometChatButtonComponent,
    inputKey: 'disabled',
    arbitrary: arbBool,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const btn = el.querySelector('button.cometchat-button') as HTMLButtonElement | null;
      if (!btn) return false;
      return btn.disabled === !!value;
    },
    setup: (fixture) => {
      fixture.componentRef.setInput('isLoading', false);
    },
  },

  // --- CometChatDeleteBubbleComponent ---
  {
    name: 'DeleteBubble: text → displayed text in DOM',
    component: CometChatDeleteBubbleComponent,
    inputKey: 'text',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const textEl = el.querySelector('.cometchat-delete-bubble__text');
      if (!textEl) return false;
      return (textEl.textContent || '').trim() === value;
    },
  },
  {
    name: 'DeleteBubble: isSentByMe → sender/receiver CSS class',
    component: CometChatDeleteBubbleComponent,
    inputKey: 'isSentByMe',
    arbitrary: arbBool,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const bubble = el.querySelector('.cometchat-delete-bubble');
      if (!bubble) return false;
      if (value) {
        return bubble.classList.contains('cometchat-delete-bubble--sender');
      } else {
        return bubble.classList.contains('cometchat-delete-bubble--receiver');
      }
    },
  },

  // --- CometChatActionBubbleComponent ---
  {
    name: 'ActionBubble: messageText → text in DOM',
    component: CometChatActionBubbleComponent,
    inputKey: 'messageText',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatActionBubbleComponent;
      if (comp.messageText !== value) return false;
      if (comp.shouldRender) {
        const el: HTMLElement = fixture.nativeElement;
        const textEl = el.querySelector('.cometchat-action-bubble__text');
        if (!textEl) return false;
        return (textEl.textContent || '').trim() === value;
      }
      return true;
    },
  },
  {
    name: 'ActionBubble: iconErrorColor → internal state reflects value',
    component: CometChatActionBubbleComponent,
    inputKey: 'iconErrorColor',
    arbitrary: arbBool,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatActionBubbleComponent;
      return comp.iconErrorColor === value;
    },
  },

  // --- CometChatDateComponent ---
  {
    name: 'Date: timestamp → internal state reflects value',
    component: CometChatDateComponent,
    inputKey: 'timestamp',
    arbitrary: arbTimestamp,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatDateComponent;
      return comp.timestamp === value;
    },
  },

  // --- CometChatListItemComponent ---
  {
    name: 'ListItem: title → title text in DOM',
    component: CometChatListItemComponent,
    inputKey: 'title',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const titleEl = el.querySelector('.cometchat-list-item__body-title');
      if (!titleEl) return false;
      return (titleEl.textContent || '').trim() === value;
    },
  },
  {
    name: 'ListItem: id → id attribute on DOM element',
    component: CometChatListItemComponent,
    inputKey: 'id',
    arbitrary: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const listItem = el.querySelector('.cometchat-list-item');
      if (!listItem) return false;
      return listItem.getAttribute('id') === value;
    },
  },
  {
    name: 'ListItem: avatarName → component internal state',
    component: CometChatListItemComponent,
    inputKey: 'avatarName',
    arbitrary: arbName,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatListItemComponent;
      return comp.avatarName === value;
    },
  },

  // --- CometChatCheckboxComponent ---
  {
    name: 'Checkbox: checked → isChecked internal state',
    component: CometChatCheckboxComponent,
    inputKey: 'checked',
    arbitrary: arbBool,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance as CometChatCheckboxComponent;
      return comp.isChecked === value;
    },
  },
  {
    name: 'Checkbox: labelText → label text in DOM',
    component: CometChatCheckboxComponent,
    inputKey: 'labelText',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const textEl = el.querySelector('.cometchat-checkbox__text');
      if (!textEl) return false;
      return (textEl.textContent || '').trim() === value;
    },
  },
  {
    name: 'Checkbox: disabled → input disabled attribute',
    component: CometChatCheckboxComponent,
    inputKey: 'disabled',
    arbitrary: arbBool,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement | null;
      if (!input) return false;
      return input.disabled === value;
    },
  },

  // --- CometChatToastComponent ---
  {
    name: 'Toast: text → text content in DOM',
    component: CometChatToastComponent,
    inputKey: 'text',
    arbitrary: arbNonEmptyString,
    verify: (fixture, value) => {
      const el: HTMLElement = fixture.nativeElement;
      const textEl = el.querySelector('.cometchat-toast__text');
      if (!textEl) return false;
      return (textEl.textContent || '').trim() === value;
    },
    setup: (fixture) => {
      fixture.componentRef.setInput('duration', 0);
    },
  },
  {
    name: 'Toast: type → CSS class modifier on toast element',
    component: CometChatToastComponent,
    inputKey: 'type',
    arbitrary: arbToastType,
    verify: (fixture, value) => {
      const comp = fixture.componentInstance;
      if (!comp.text) return true; // skip if not visible
      const el: HTMLElement = fixture.nativeElement;
      const toast = el.querySelector('.cometchat-toast');
      if (!toast) return true;
      return toast.classList.contains(`cometchat-toast--${value}`);
    },
    setup: (fixture) => {
      fixture.componentRef.setInput('text', 'Test message');
      fixture.componentRef.setInput('duration', 0);
    },
  },
];

/** Pick any reflection descriptor. */
const arbDescriptor = fc.constantFrom(...REFLECTION_DESCRIPTORS);


// ==================== Tests ====================

describe('Property 8: Input Reflection', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CometChatAvatarComponent,
        CometChatButtonComponent,
        CometChatDeleteBubbleComponent,
        CometChatActionBubbleComponent,
        CometChatDateComponent,
        CometChatListItemComponent,
        CometChatCheckboxComponent,
        CometChatToastComponent,
      ],
    });
  });

  // ---------- Core property: any input set to valid value reflects in state/DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   *
   * For any component and any @Input(), setting a valid value and calling
   * detectChanges() causes internal state or DOM to reflect the new value.
   */
  it('setting any @Input() to a valid value and calling detectChanges() reflects in state or DOM', () => {
    fc.assert(
      fc.property(arbDescriptor, descriptor => {
        const value = fc.sample(descriptor.arbitrary, 1)[0];
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        fixture.detectChanges(); // initial render

        if (descriptor.setup) descriptor.setup(fixture);
        setInputAndDetect(fixture, descriptor.inputKey, value);

        const result = descriptor.verify(fixture, value);
        fixture.destroy();
        return result;
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Avatar: name reflects as initials in DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Avatar: name input reflects as uppercase initials', () => {
    fc.assert(
      fc.property(arbName, name => {
        const fixture = TestBed.createComponent(CometChatAvatarComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'name', name);

        const comp = fixture.componentInstance;
        const initials = comp.initials;
        expect(initials.length).toBeGreaterThan(0);
        expect(initials).toBe(initials.toUpperCase());

        const el: HTMLElement = fixture.nativeElement;
        const textEl = el.querySelector('.cometchat-avatar__text');
        if (textEl) {
          expect((textEl.textContent || '').trim()).toBe(initials);
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Avatar: image reflects in showImage getter ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Avatar: image input reflects in showImage and component state', () => {
    fc.assert(
      fc.property(arbUrl, url => {
        const fixture = TestBed.createComponent(CometChatAvatarComponent);
        fixture.detectChanges();

        fixture.componentInstance.resetImageError();
        setInputAndDetect(fixture, 'image', url);

        const comp = fixture.componentInstance;
        expect(comp.image).toBe(url);
        expect(comp.showImage).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: text reflects in DOM label ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Button: text input reflects as label text in DOM', () => {
    fc.assert(
      fc.property(arbNonEmptyString, text => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'text', text);

        const el: HTMLElement = fixture.nativeElement;
        const label = el.querySelector('.cometchat-button__text');
        expect(label).toBeTruthy();
        expect((label!.textContent || '').trim()).toBe(text);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: hoverText reflects as title attribute ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Button: hoverText input reflects as title attribute on button', () => {
    fc.assert(
      fc.property(arbNonEmptyString, hoverText => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'hoverText', hoverText);

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button');
        expect(btn).toBeTruthy();
        expect(btn!.getAttribute('title')).toBe(hoverText);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: disabled reflects on button element ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Button: disabled input reflects as disabled attribute on button', () => {
    fc.assert(
      fc.property(arbBool, disabled => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentRef.setInput('isLoading', false);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'disabled', disabled);

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLButtonElement;
        expect(btn).toBeTruthy();
        expect(btn.disabled).toBe(disabled);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- DeleteBubble: isSentByMe reflects as CSS class ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('DeleteBubble: isSentByMe input reflects as sender/receiver CSS class', () => {
    fc.assert(
      fc.property(arbBool, isSentByMe => {
        const fixture = TestBed.createComponent(CometChatDeleteBubbleComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'isSentByMe', isSentByMe);

        const el: HTMLElement = fixture.nativeElement;
        const bubble = el.querySelector('.cometchat-delete-bubble');
        expect(bubble).toBeTruthy();

        if (isSentByMe) {
          expect(bubble!.classList.contains('cometchat-delete-bubble--sender')).toBe(true);
        } else {
          expect(bubble!.classList.contains('cometchat-delete-bubble--receiver')).toBe(true);
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- DeleteBubble: text reflects in DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('DeleteBubble: text input reflects as displayed text in DOM', () => {
    fc.assert(
      fc.property(arbNonEmptyString, text => {
        const fixture = TestBed.createComponent(CometChatDeleteBubbleComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'text', text);

        const el: HTMLElement = fixture.nativeElement;
        const textEl = el.querySelector('.cometchat-delete-bubble__text');
        expect(textEl).toBeTruthy();
        expect((textEl!.textContent || '').trim()).toBe(text);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ActionBubble: messageText reflects in DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('ActionBubble: messageText input reflects as text in DOM', () => {
    fc.assert(
      fc.property(arbNonEmptyString, messageText => {
        const fixture = TestBed.createComponent(CometChatActionBubbleComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'messageText', messageText);

        const comp = fixture.componentInstance;
        expect(comp.messageText).toBe(messageText);

        if (comp.shouldRender) {
          const el: HTMLElement = fixture.nativeElement;
          const textEl = el.querySelector('.cometchat-action-bubble__text');
          expect(textEl).toBeTruthy();
          expect((textEl!.textContent || '').trim()).toBe(messageText);
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: title reflects in DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('ListItem: title input reflects as title text in DOM', () => {
    fc.assert(
      fc.property(arbNonEmptyString, title => {
        const fixture = TestBed.createComponent(CometChatListItemComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'title', title);

        const el: HTMLElement = fixture.nativeElement;
        const titleEl = el.querySelector('.cometchat-list-item__body-title');
        expect(titleEl).toBeTruthy();
        expect((titleEl!.textContent || '').trim()).toBe(title);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: id reflects as DOM id attribute ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('ListItem: id input reflects as id attribute on DOM element', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
        id => {
          const fixture = TestBed.createComponent(CometChatListItemComponent);
          fixture.detectChanges();

          setInputAndDetect(fixture, 'id', id);

          const el: HTMLElement = fixture.nativeElement;
          const listItem = el.querySelector('.cometchat-list-item');
          expect(listItem).toBeTruthy();
          expect(listItem!.getAttribute('id')).toBe(id);

          fixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: checked reflects in internal state ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Checkbox: checked input reflects in isChecked internal state', () => {
    fc.assert(
      fc.property(arbBool, checked => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'checked', checked);

        expect(fixture.componentInstance.isChecked).toBe(checked);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: labelText reflects in DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Checkbox: labelText input reflects as text in DOM', () => {
    fc.assert(
      fc.property(arbNonEmptyString, labelText => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'labelText', labelText);

        const el: HTMLElement = fixture.nativeElement;
        const textEl = el.querySelector('.cometchat-checkbox__text');
        expect(textEl).toBeTruthy();
        expect((textEl!.textContent || '').trim()).toBe(labelText);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: disabled reflects on input element ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Checkbox: disabled input reflects as disabled attribute on input element', () => {
    fc.assert(
      fc.property(arbBool, disabled => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'disabled', disabled);

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.disabled).toBe(disabled);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Toast: text reflects in DOM ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Toast: text input reflects as text content in DOM', () => {
    fc.assert(
      fc.property(arbNonEmptyString, text => {
        const fixture = TestBed.createComponent(CometChatToastComponent);
        fixture.componentRef.setInput('duration', 0);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'text', text);

        const el: HTMLElement = fixture.nativeElement;
        const textEl = el.querySelector('.cometchat-toast__text');
        expect(textEl).toBeTruthy();
        expect((textEl!.textContent || '').trim()).toBe(text);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Toast: type reflects as CSS class modifier ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Toast: type input reflects as CSS class modifier on toast element', () => {
    fc.assert(
      fc.property(arbToastType, type => {
        const fixture = TestBed.createComponent(CometChatToastComponent);
        fixture.componentRef.setInput('text', 'Test message');
        fixture.componentRef.setInput('duration', 0);
        fixture.detectChanges();

        setInputAndDetect(fixture, 'type', type);

        const el: HTMLElement = fixture.nativeElement;
        const toast = el.querySelector('.cometchat-toast');
        expect(toast).toBeTruthy();
        expect(toast!.classList.contains(`cometchat-toast--${type}`)).toBe(true);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Input value change: old → new reflects correctly ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   *
   * For any component and any @Input(), changing from one valid value to
   * another valid value and calling detectChanges() causes the component
   * to reflect the new value (not the old one).
   */
  it('changing an @Input() from one valid value to another reflects the new value', () => {
    fc.assert(
      fc.property(arbDescriptor, descriptor => {
        const [value1, value2] = fc.sample(descriptor.arbitrary, 2);
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        fixture.detectChanges();

        if (descriptor.setup) descriptor.setup(fixture);

        // Set first value
        setInputAndDetect(fixture, descriptor.inputKey, value1);

        // Set second value
        setInputAndDetect(fixture, descriptor.inputKey, value2);

        // Verify the new value is reflected
        const result = descriptor.verify(fixture, value2);
        fixture.destroy();
        return result;
      }),
      { numRuns: 120 }
    );
  });

  // ---------- Date: timestamp reflects in component state ----------

  /**
   * **Validates: Requirements 2.2, 2.5**
   */
  it('Date: timestamp input reflects in component internal state', () => {
    fc.assert(
      fc.property(arbTimestamp, timestamp => {
        const fixture = TestBed.createComponent(CometChatDateComponent);
        fixture.componentRef.setInput('calendarObject', { relativeTime: {} as any });
        fixture.detectChanges();

        setInputAndDetect(fixture, 'timestamp', timestamp);

        expect(fixture.componentInstance.timestamp).toBe(timestamp);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
});
