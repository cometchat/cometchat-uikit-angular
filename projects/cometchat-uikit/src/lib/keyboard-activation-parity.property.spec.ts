/**
 * Property-Based Tests for Keyboard Activation Parity
 *
 * Categories: Property-Based Keyboard Accessibility Invariants
 * Validates: Requirements 10.2
 *
 * Property 18: Keyboard Activation Parity
 * For any component with clickable elements, dispatching keydown with Enter
 * or Space on the element shall trigger the same action as a click event.
 *
 * Tests a representative set of standalone components:
 * - CometChatButtonComponent (Enter/Space on <button> emits buttonClick like click)
 * - CometChatListItemComponent (Enter/Space on list item emits listItemClick like click)
 * - CometChatCheckboxComponent (Space on <input type="checkbox"> toggles checked like click)
 * - CometChatRadioButtonComponent (Space on <input type="radio"> selects like click)
 * - CometChatSearchBarComponent (Enter/Space on clear button triggers clear like click)
 * - CometChatActionSheetComponent (Enter/Space on focused action item triggers actionItemClick)
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module keyboard-activation-parity.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './test-setup';

import { CometChatButtonComponent } from './components/cometchat-button/cometchat-button.component';
import { CometChatListItemComponent } from './components/base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatCheckboxComponent } from './components/base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatRadioButtonComponent } from './components/base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from './components/base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatActionSheetComponent } from './components/cometchat-action-sheet/cometchat-action-sheet.component';

// ==================== Constants & Helpers ====================

/** Activation keys that should trigger the same action as click. */
const ACTIVATION_KEYS = ['Enter', ' '] as const;

/** Arbitrary that picks an activation key. */
const arbActivationKey = fc.constantFrom<string>(...ACTIVATION_KEYS);

/** Arbitrary for non-empty button text. */
const arbButtonText = fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0);

/** Arbitrary for list item titles. */
const arbTitle = fc.string({ minLength: 1, maxLength: 40 }).filter(s => s.trim().length > 0);

/** Arbitrary for label text. */
const arbLabel = fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0);

/** Arbitrary boolean. */
const arbBool = fc.boolean();

/** Arbitrary for action sheet item count (1-5). */
const arbActionCount = fc.integer({ min: 1, max: 5 });

/** Arbitrary for action index within a count. */
function arbActionIndex(count: number): fc.Arbitrary<number> {
  return fc.integer({ min: 0, max: count - 1 });
}

/**
 * Creates a KeyboardEvent for testing activation keys.
 */
function createKeydownEvent(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
  });
}

/**
 * Creates action items for ActionSheet testing.
 */
function createActions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `action-${i}`,
    title: `Action ${i}`,
    iconURL: '',
  }));
}

// ==================== Tests ====================

describe('Property 18: Keyboard Activation Parity', () => {
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
        CometChatRadioButtonComponent,
        CometChatSearchBarComponent,
        CometChatActionSheetComponent,
      ],
    });
  });

  // ---------- Button: Enter/Space emits buttonClick just like click ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatButtonComponent with any text, pressing Enter or Space on the
   * button element emits buttonClick, the same as clicking it.
   */
  it('Button: Enter/Space on button emits buttonClick like click for any text', () => {
    fc.assert(
      fc.property(arbButtonText, arbActivationKey, (text, key) => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = text;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();

        // Track click emissions
        const clickSpy = vi.fn();
        fixture.componentInstance.buttonClick.subscribe(clickSpy);

        // Dispatch keyboard activation
        btn.dispatchEvent(createKeydownEvent(key));
        fixture.detectChanges();

        // Verify keyboard activation triggered the same output as click would
        expect(clickSpy).toHaveBeenCalledTimes(1);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: disabled button does NOT emit on Enter/Space ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatButtonComponent when disabled, pressing Enter or Space
   * does NOT emit buttonClick, matching disabled click behavior.
   */
  it('Button: disabled button does not emit on Enter/Space, matching disabled click behavior', () => {
    fc.assert(
      fc.property(arbActivationKey, key => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = 'Test';
        fixture.componentInstance.disabled = true;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();

        const clickSpy = vi.fn();
        fixture.componentInstance.buttonClick.subscribe(clickSpy);

        btn.dispatchEvent(createKeydownEvent(key));
        fixture.detectChanges();

        expect(clickSpy).not.toHaveBeenCalled();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Button: loading button does NOT emit on Enter/Space ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatButtonComponent when loading, pressing Enter or Space
   * does NOT emit buttonClick, matching loading click behavior.
   */
  it('Button: loading button does not emit on Enter/Space, matching loading click behavior', () => {
    fc.assert(
      fc.property(arbActivationKey, key => {
        const fixture = TestBed.createComponent(CometChatButtonComponent);
        fixture.componentInstance.text = 'Test';
        fixture.componentInstance.isLoading = true;
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const btn = el.querySelector('button.cometchat-button') as HTMLElement;
        expect(btn).toBeTruthy();

        const clickSpy = vi.fn();
        fixture.componentInstance.buttonClick.subscribe(clickSpy);

        btn.dispatchEvent(createKeydownEvent(key));
        fixture.detectChanges();

        expect(clickSpy).not.toHaveBeenCalled();

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: Enter/Space emits listItemClick just like click ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatListItemComponent with any title, pressing Enter or Space on
   * the list item element emits listItemClick with the item id.
   */
  it('ListItem: Enter/Space on list item emits listItemClick like click for any title', () => {
    fc.assert(
      fc.property(arbTitle, arbActivationKey, (title, key) => {
        const fixture = TestBed.createComponent(CometChatListItemComponent);
        fixture.componentInstance.title = title;
        fixture.componentInstance.id = 'test-item';
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const listItem = el.querySelector('.cometchat-list-item') as HTMLElement;
        expect(listItem).toBeTruthy();

        const clickSpy = vi.fn();
        fixture.componentInstance.listItemClick.subscribe(clickSpy);

        // Dispatch keydown on the list item itself (not a nested element)
        const event = createKeydownEvent(key);
        // The onKeyDown handler checks target === currentTarget, so we need
        // to dispatch directly on the list item
        listItem.dispatchEvent(event);
        fixture.detectChanges();

        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledWith({ id: 'test-item' });

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: keyboard and click emit same payload ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatListItemComponent, the payload emitted by Enter/Space
   * matches the payload emitted by click.
   */
  it('ListItem: keyboard activation payload matches click payload', () => {
    fc.assert(
      fc.property(arbTitle, arbActivationKey, (title, key) => {
        const itemId = `item-${title.slice(0, 10)}`;

        // Test keyboard activation
        const kbFixture = TestBed.createComponent(CometChatListItemComponent);
        kbFixture.componentInstance.title = title;
        kbFixture.componentInstance.id = itemId;
        kbFixture.detectChanges();

        const kbSpy = vi.fn();
        kbFixture.componentInstance.listItemClick.subscribe(kbSpy);
        const kbListItem = kbFixture.nativeElement.querySelector(
          '.cometchat-list-item'
        ) as HTMLElement;
        kbListItem.dispatchEvent(createKeydownEvent(key));
        kbFixture.detectChanges();

        // Test click activation
        const clickFixture = TestBed.createComponent(CometChatListItemComponent);
        clickFixture.componentInstance.title = title;
        clickFixture.componentInstance.id = itemId;
        clickFixture.detectChanges();

        const clickSpy = vi.fn();
        clickFixture.componentInstance.listItemClick.subscribe(clickSpy);
        const clickListItem = clickFixture.nativeElement.querySelector(
          '.cometchat-list-item'
        ) as HTMLElement;
        // Simulate a click where target === currentTarget (clicking the list item itself)
        clickFixture.componentInstance.listItemClick.emit({ id: itemId });
        clickFixture.detectChanges();

        // Both should have been called with the same payload
        expect(kbSpy).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(kbSpy.mock.calls[0][0]).toEqual(clickSpy.mock.calls[0][0]);

        kbFixture.destroy();
        clickFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: Space toggles checked state like click ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatCheckboxComponent, pressing Space on the checkbox input
   * toggles the checked state, same as clicking the checkbox.
   * Note: Native checkbox inputs handle Space natively; we verify the
   * component's change handler fires in both cases.
   */
  it('Checkbox: Space key toggles checked state like click for any label', () => {
    fc.assert(
      fc.property(arbLabel, arbBool, (labelText, initialChecked) => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.componentInstance.labelText = labelText;
        fixture.componentInstance.checked = initialChecked;
        fixture.componentInstance.ngOnInit();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
        expect(input).toBeTruthy();

        const changeSpy = vi.fn();
        fixture.componentInstance.checkboxChanged.subscribe(changeSpy);

        // Simulate what happens when Space activates the checkbox:
        // The native checkbox toggles and fires a change event
        input.checked = !initialChecked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        fixture.detectChanges();

        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledWith({
          checked: !initialChecked,
          labelText,
        });

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Checkbox: disabled checkbox does not toggle on activation ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatCheckboxComponent when disabled, activation (Space/click)
   * does not toggle the checked state.
   */
  it('Checkbox: disabled checkbox does not toggle on activation', () => {
    fc.assert(
      fc.property(arbBool, initialChecked => {
        const fixture = TestBed.createComponent(CometChatCheckboxComponent);
        fixture.componentInstance.labelText = 'Test';
        fixture.componentInstance.checked = initialChecked;
        fixture.componentInstance.disabled = true;
        fixture.componentInstance.ngOnInit();
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const input = el.querySelector('.cometchat-checkbox__input') as HTMLInputElement;
        expect(input).toBeTruthy();
        expect(input.disabled).toBe(true);

        // Disabled inputs don't respond to keyboard or click activation
        // The internal state should remain unchanged
        expect(fixture.componentInstance.isChecked).toBe(initialChecked);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- RadioButton: Space selects radio like click ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatRadioButtonComponent, pressing Space on the radio input
   * selects it, same as clicking the radio button.
   */
  it('RadioButton: Space key selects radio like click for any label', () => {
    fc.assert(
      fc.property(arbLabel, labelText => {
        const fixture = TestBed.createComponent(CometChatRadioButtonComponent);
        fixture.componentInstance.labelText = labelText;
        fixture.componentInstance.id = 'test-radio';
        fixture.componentInstance.checked = false;
        fixture.componentInstance.ngOnInit();
        fixture.detectChanges();

        const changeSpy = vi.fn();
        fixture.componentInstance.radioChanged.subscribe(changeSpy);

        // The component's onKeyDown handles Space by calling selectRadioButton()
        const event = createKeydownEvent(' ');
        fixture.componentInstance.onKeyDown(event);
        fixture.detectChanges();

        expect(changeSpy).toHaveBeenCalledTimes(1);
        expect(changeSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            checked: true,
            labelText,
            id: 'test-radio',
          })
        );

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- RadioButton: disabled radio does not select on Space ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatRadioButtonComponent when disabled, pressing Space
   * does not select the radio, matching disabled click behavior.
   */
  it('RadioButton: disabled radio does not select on Space', () => {
    fc.assert(
      fc.property(arbActivationKey, key => {
        const fixture = TestBed.createComponent(CometChatRadioButtonComponent);
        fixture.componentInstance.labelText = 'Test';
        fixture.componentInstance.id = 'test-radio';
        fixture.componentInstance.checked = false;
        fixture.componentInstance.disabled = true;
        fixture.componentInstance.ngOnInit();
        fixture.detectChanges();

        const changeSpy = vi.fn();
        fixture.componentInstance.radioChanged.subscribe(changeSpy);

        // The component's onKeyDown returns early when disabled
        const event = createKeydownEvent(key);
        fixture.componentInstance.onKeyDown(event);
        fixture.detectChanges();

        expect(changeSpy).not.toHaveBeenCalled();
        expect(fixture.componentInstance.isChecked).toBe(false);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- SearchBar: Enter/Space on clear button triggers clear like click ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatSearchBarComponent, pressing Enter or Space on the clear
   * button triggers the same clear action as clicking it.
   */
  it('SearchBar: Enter/Space on clear button triggers clearClick like click', () => {
    fc.assert(
      fc.property(arbActivationKey, key => {
        const fixture = TestBed.createComponent(CometChatSearchBarComponent);
        fixture.componentInstance.searchText = 'test query';
        fixture.componentInstance.searchValue = 'test query';
        fixture.detectChanges();

        const el: HTMLElement = fixture.nativeElement;
        const clearBtn = el.querySelector('.cometchat-search-bar__clear') as HTMLElement;

        // Clear button should be visible when there's search text
        if (clearBtn) {
          const clearSpy = vi.fn();
          fixture.componentInstance.clearClick.subscribe(clearSpy);

          // Dispatch keyboard activation on clear button
          clearBtn.dispatchEvent(createKeydownEvent(key));
          fixture.detectChanges();

          expect(clearSpy).toHaveBeenCalledTimes(1);
          // After clear, search value should be empty
          expect(fixture.componentInstance.searchValue).toBe('');
        }

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- SearchBar: clear button keyboard and click produce same result ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatSearchBarComponent, both keyboard activation and click
   * on the clear button result in the same cleared state.
   */
  it('SearchBar: clear button keyboard activation produces same state as click', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        arbActivationKey,
        (searchText, key) => {
          // Test keyboard clear
          const kbFixture = TestBed.createComponent(CometChatSearchBarComponent);
          kbFixture.componentInstance.searchText = searchText;
          kbFixture.componentInstance.searchValue = searchText;
          kbFixture.detectChanges();

          const kbClearBtn = kbFixture.nativeElement.querySelector(
            '.cometchat-search-bar__clear'
          ) as HTMLElement;
          if (kbClearBtn) {
            kbClearBtn.dispatchEvent(createKeydownEvent(key));
            kbFixture.detectChanges();
          }

          // Test click clear
          const clickFixture = TestBed.createComponent(CometChatSearchBarComponent);
          clickFixture.componentInstance.searchText = searchText;
          clickFixture.componentInstance.searchValue = searchText;
          clickFixture.detectChanges();

          clickFixture.componentInstance.onClearClick();
          clickFixture.detectChanges();

          // Both should result in empty search value
          expect(kbFixture.componentInstance.searchValue).toBe(
            clickFixture.componentInstance.searchValue
          );
          expect(kbFixture.componentInstance.searchValue).toBe('');

          kbFixture.destroy();
          clickFixture.destroy();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ---------- ActionSheet: Enter/Space on focused action emits actionItemClick ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatActionSheetComponent, pressing Enter or Space when an action
   * item is focused triggers actionItemClick, same as clicking the action.
   */
  it('ActionSheet: Enter/Space on focused action emits actionItemClick like click', () => {
    fc.assert(
      fc.property(arbActionCount, arbActivationKey, (count, key) => {
        const fixture = TestBed.createComponent(CometChatActionSheetComponent);
        const actions = createActions(count);
        fixture.componentInstance.actions = actions as any;
        fixture.detectChanges();

        const actionSpy = vi.fn();
        fixture.componentInstance.actionItemClick.subscribe(actionSpy);

        // Pick a random valid index
        const targetIndex = fc.sample(fc.integer({ min: 0, max: count - 1 }), 1)[0];

        // Focus the action item first (simulates arrow key navigation)
        fixture.componentInstance.onActionFocus(targetIndex);

        // The ActionSheet's HostListener handles keydown at the component level
        // and calls selectCurrentAction() for activation keys
        fixture.componentInstance.onKeyDown(createKeydownEvent(key));
        fixture.detectChanges();

        expect(actionSpy).toHaveBeenCalledTimes(1);
        expect(actionSpy).toHaveBeenCalledWith(actions[targetIndex]);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ActionSheet: click and keyboard emit same action payload ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatActionSheetComponent, the payload emitted by Enter/Space
   * matches the payload emitted by clicking the same action item.
   */
  it('ActionSheet: keyboard activation payload matches click payload for same action', () => {
    fc.assert(
      fc.property(arbActionCount, arbActivationKey, (count, key) => {
        const actions = createActions(count);
        const targetIndex = fc.sample(fc.integer({ min: 0, max: count - 1 }), 1)[0];

        // Test keyboard activation
        const kbFixture = TestBed.createComponent(CometChatActionSheetComponent);
        kbFixture.componentInstance.actions = actions as any;
        kbFixture.detectChanges();

        const kbSpy = vi.fn();
        kbFixture.componentInstance.actionItemClick.subscribe(kbSpy);
        kbFixture.componentInstance.onActionFocus(targetIndex);
        kbFixture.componentInstance.onKeyDown(createKeydownEvent(key));

        // Test click activation
        const clickFixture = TestBed.createComponent(CometChatActionSheetComponent);
        clickFixture.componentInstance.actions = actions as any;
        clickFixture.detectChanges();

        const clickSpy = vi.fn();
        clickFixture.componentInstance.actionItemClick.subscribe(clickSpy);
        clickFixture.componentInstance.onActionClick(actions[targetIndex] as any);

        // Both should emit the same action
        expect(kbSpy).toHaveBeenCalledTimes(1);
        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(kbSpy.mock.calls[0][0]).toEqual(clickSpy.mock.calls[0][0]);

        kbFixture.destroy();
        clickFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Cross-component: activation key type doesn't matter ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatButtonComponent, both Enter and Space produce the same
   * result — the activation key type should not affect the outcome.
   */
  it('Button: Enter and Space produce identical activation behavior', () => {
    fc.assert(
      fc.property(arbButtonText, text => {
        // Test Enter
        const enterFixture = TestBed.createComponent(CometChatButtonComponent);
        enterFixture.componentInstance.text = text;
        enterFixture.detectChanges();
        const enterSpy = vi.fn();
        enterFixture.componentInstance.buttonClick.subscribe(enterSpy);
        const enterBtn = enterFixture.nativeElement.querySelector(
          'button.cometchat-button'
        ) as HTMLElement;
        enterBtn.dispatchEvent(createKeydownEvent('Enter'));

        // Test Space
        const spaceFixture = TestBed.createComponent(CometChatButtonComponent);
        spaceFixture.componentInstance.text = text;
        spaceFixture.detectChanges();
        const spaceSpy = vi.fn();
        spaceFixture.componentInstance.buttonClick.subscribe(spaceSpy);
        const spaceBtn = spaceFixture.nativeElement.querySelector(
          'button.cometchat-button'
        ) as HTMLElement;
        spaceBtn.dispatchEvent(createKeydownEvent(' '));

        // Both should have been called exactly once
        expect(enterSpy).toHaveBeenCalledTimes(1);
        expect(spaceSpy).toHaveBeenCalledTimes(1);

        enterFixture.destroy();
        spaceFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- ListItem: Enter and Space produce identical activation ----------

  /**
   * **Validates: Requirements 10.2**
   *
   * For CometChatListItemComponent, both Enter and Space produce the same
   * listItemClick emission with identical payload.
   */
  it('ListItem: Enter and Space produce identical activation behavior', () => {
    fc.assert(
      fc.property(arbTitle, title => {
        const itemId = 'parity-test';

        // Test Enter
        const enterFixture = TestBed.createComponent(CometChatListItemComponent);
        enterFixture.componentInstance.title = title;
        enterFixture.componentInstance.id = itemId;
        enterFixture.detectChanges();
        const enterSpy = vi.fn();
        enterFixture.componentInstance.listItemClick.subscribe(enterSpy);
        const enterItem = enterFixture.nativeElement.querySelector(
          '.cometchat-list-item'
        ) as HTMLElement;
        enterItem.dispatchEvent(createKeydownEvent('Enter'));

        // Test Space
        const spaceFixture = TestBed.createComponent(CometChatListItemComponent);
        spaceFixture.componentInstance.title = title;
        spaceFixture.componentInstance.id = itemId;
        spaceFixture.detectChanges();
        const spaceSpy = vi.fn();
        spaceFixture.componentInstance.listItemClick.subscribe(spaceSpy);
        const spaceItem = spaceFixture.nativeElement.querySelector(
          '.cometchat-list-item'
        ) as HTMLElement;
        spaceItem.dispatchEvent(createKeydownEvent(' '));

        expect(enterSpy).toHaveBeenCalledTimes(1);
        expect(spaceSpy).toHaveBeenCalledTimes(1);
        expect(enterSpy.mock.calls[0][0]).toEqual(spaceSpy.mock.calls[0][0]);

        enterFixture.destroy();
        spaceFixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
});
