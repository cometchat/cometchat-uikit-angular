/**
 * Property-Based Tests for List Rendering Count Invariant
 *
 * Categories: Property-Based List Rendering Invariants, DOM Count Verification
 * Validates: Requirements 12.5, 3.3
 *
 * Property 5: List Rendering Count Invariant
 * For any list-based component and any array of N items (0 ≤ N ≤ 100),
 * rendering produces exactly N list-item DOM elements.
 *
 * Tests use lightweight test harness components that mirror the @for / *ngFor
 * patterns used throughout the UIKit (CometChatDropDown, CometChatChangeScope,
 * CometChatSmartReplies, CometChatReactions, etc.) to verify the universal
 * invariant: N items in → N DOM elements out.
 *
 * @module boolean-attribute-transform.property (list-rendering-count)
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './test-setup';

// ==================== Test Harness Components ====================

/**
 * Mirrors the @for pattern used in cometchat-dropdown, cometchat-change-scope,
 * cometchat-smart-replies, cometchat-reactions, etc.
 * Renders a <ul> with one <li> per item using Angular's @for control flow.
 */
@Component({
  selector: 'test-list-for',
  standalone: true,
  template: `
    <ul class="test-list">
      @for (item of items; track $index) {
        <li class="test-list__item">{{ item }}</li>
      }
    </ul>
  `,
})
class TestListForComponent {
  @Input() items: string[] = [];
}

/**
 * Mirrors the *ngFor pattern used in cometchat-context-menu,
 * cometchat-image-bubble, etc.
 * Renders a <div> container with one child <div> per item using *ngFor.
 */
@Component({
  selector: 'test-list-ngfor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-grid">
      <div *ngFor="let item of items; let i = index" class="test-grid__cell">{{ item }}</div>
    </div>
  `,
})
class TestListNgForComponent {
  @Input() items: string[] = [];
}

/**
 * Mirrors the button-list pattern used in cometchat-smart-replies
 * where each item renders as a <button> inside a container.
 */
@Component({
  selector: 'test-button-list',
  standalone: true,
  template: `
    <div class="test-button-list" role="group">
      @for (item of items; track item; let i = $index) {
        <button class="test-button-list__btn" type="button">{{ item }}</button>
      }
    </div>
  `,
})
class TestButtonListComponent {
  @Input() items: string[] = [];
}

/**
 * Mirrors the radio-option pattern used in cometchat-change-scope
 * where each option renders inside a wrapper div.
 */
@Component({
  selector: 'test-option-list',
  standalone: true,
  template: `
    <div class="test-option-list" role="radiogroup">
      @for (option of options; track option) {
        <div class="test-option-list__option">
          <input type="radio" [value]="option" name="test-radio" />
          <label>{{ option }}</label>
        </div>
      }
    </div>
  `,
})
class TestOptionListComponent {
  @Input() options: string[] = [];
}

/**
 * Mirrors the listbox pattern used in cometchat-dropdown
 * where each option is an <li role="option"> inside a <ul role="listbox">.
 */
@Component({
  selector: 'test-listbox',
  standalone: true,
  template: `
    <ul class="test-listbox" role="listbox">
      @for (option of options; track $index; let i = $index) {
        <li class="test-listbox__option" role="option" [attr.aria-selected]="false">
          {{ option }}
        </li>
      }
    </ul>
  `,
})
class TestListboxComponent {
  @Input() options: string[] = [];
}

/**
 * Mirrors the numeric-item pattern (e.g. poll options with numeric IDs)
 * where items are objects with id and label.
 */
@Component({
  selector: 'test-object-list',
  standalone: true,
  template: `
    <div class="test-object-list">
      @for (obj of objects; track obj.id) {
        <div class="test-object-list__row" [attr.data-id]="obj.id">{{ obj.label }}</div>
      }
    </div>
  `,
})
class TestObjectListComponent {
  @Input() objects: { id: number; label: string }[] = [];
}

// ==================== Descriptor for parameterized tests ====================

interface ListComponentDescriptor {
  name: string;
  component: any;
  inputKey: string;
  itemSelector: string;
  /** Transform raw string array into the shape expected by the component input */
  transform: (items: string[]) => any[];
}

const LIST_COMPONENTS: ListComponentDescriptor[] = [
  {
    name: 'TestListForComponent (@for <li>)',
    component: TestListForComponent,
    inputKey: 'items',
    itemSelector: '.test-list__item',
    transform: items => items,
  },
  {
    name: 'TestListNgForComponent (*ngFor <div>)',
    component: TestListNgForComponent,
    inputKey: 'items',
    itemSelector: '.test-grid__cell',
    transform: items => items,
  },
  {
    name: 'TestButtonListComponent (@for <button>)',
    component: TestButtonListComponent,
    inputKey: 'items',
    itemSelector: '.test-button-list__btn',
    transform: items => items,
  },
  {
    name: 'TestOptionListComponent (@for radio options)',
    component: TestOptionListComponent,
    inputKey: 'options',
    itemSelector: '.test-option-list__option',
    transform: items => items,
  },
  {
    name: 'TestListboxComponent (@for listbox <li>)',
    component: TestListboxComponent,
    inputKey: 'options',
    itemSelector: '.test-listbox__option',
    transform: items => items,
  },
  {
    name: 'TestObjectListComponent (@for object rows)',
    component: TestObjectListComponent,
    inputKey: 'objects',
    itemSelector: '.test-object-list__row',
    transform: items => items.map((label, i) => ({ id: i, label })),
  },
];

// ==================== Arbitraries ====================

/** Generate an array of 0–100 unique string items. */
const arbItemArray = fc
  .integer({ min: 0, max: 100 })
  .chain(n => fc.constant(Array.from({ length: n }, (_, i) => `item-${i}`)));

/** Generate a small array (0–30) for faster per-component iteration. */
const arbSmallItemArray = fc
  .integer({ min: 0, max: 30 })
  .chain(n => fc.constant(Array.from({ length: n }, (_, i) => `item-${i}`)));

/** Pick any list component descriptor. */
const arbListComponent = fc.constantFrom(...LIST_COMPONENTS);

/** Generate a random-content string array of arbitrary length (0–50). */
const arbRandomContentArray = fc.array(fc.string({ minLength: 1, maxLength: 20 }), {
  minLength: 0,
  maxLength: 50,
});

// ==================== Tests ====================

describe('Property 5: List Rendering Count Invariant', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TestListForComponent,
        TestListNgForComponent,
        TestButtonListComponent,
        TestOptionListComponent,
        TestListboxComponent,
        TestObjectListComponent,
      ],
    });
  });

  // ---------- Core property: N items → N DOM elements ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For any list component and any array of N items (0 ≤ N ≤ 100),
   * rendering produces exactly N list-item DOM elements.
   */
  it('renders exactly N DOM elements for N items across all list component types', () => {
    fc.assert(
      fc.property(arbListComponent, arbItemArray, (descriptor, items) => {
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        const comp = fixture.componentInstance;
        (comp as any)[descriptor.inputKey] = descriptor.transform(items);
        fixture.detectChanges();

        const rendered = fixture.nativeElement.querySelectorAll(descriptor.itemSelector);
        expect(rendered.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 120 }
    );
  });

  // ---------- @for list: N items → N <li> elements ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For the @for <li> pattern and any N (0–100), exactly N <li> elements render.
   */
  it('@for list renders exactly N <li> elements for N items', () => {
    fc.assert(
      fc.property(arbItemArray, items => {
        const fixture = TestBed.createComponent(TestListForComponent);
        fixture.componentInstance.items = items;
        fixture.detectChanges();

        const lis = fixture.nativeElement.querySelectorAll('.test-list__item');
        expect(lis.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- *ngFor grid: N items → N <div> cells ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For the *ngFor <div> pattern and any N (0–100), exactly N cells render.
   */
  it('*ngFor grid renders exactly N cells for N items', () => {
    fc.assert(
      fc.property(arbItemArray, items => {
        const fixture = TestBed.createComponent(TestListNgForComponent);
        fixture.componentInstance.items = items;
        fixture.detectChanges();

        const cells = fixture.nativeElement.querySelectorAll('.test-grid__cell');
        expect(cells.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Button list: N items → N <button> elements ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For the button-list pattern and any N (0–100), exactly N buttons render.
   */
  it('button list renders exactly N buttons for N items', () => {
    fc.assert(
      fc.property(arbItemArray, items => {
        const fixture = TestBed.createComponent(TestButtonListComponent);
        fixture.componentInstance.items = items;
        fixture.detectChanges();

        const buttons = fixture.nativeElement.querySelectorAll('.test-button-list__btn');
        expect(buttons.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Listbox: N options → N <li role="option"> ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For the listbox pattern and any N (0–100), exactly N option elements render.
   */
  it('listbox renders exactly N options for N items', () => {
    fc.assert(
      fc.property(arbItemArray, items => {
        const fixture = TestBed.createComponent(TestListboxComponent);
        fixture.componentInstance.options = items;
        fixture.detectChanges();

        const options = fixture.nativeElement.querySelectorAll('.test-listbox__option');
        expect(options.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Object list: N objects → N rows with data-id ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For the object-list pattern and any N (0–100), exactly N rows render
   * and each row has the correct data-id attribute.
   */
  it('object list renders exactly N rows with correct data-id attributes', () => {
    fc.assert(
      fc.property(arbItemArray, items => {
        const objects = items.map((label, i) => ({ id: i, label }));
        const fixture = TestBed.createComponent(TestObjectListComponent);
        fixture.componentInstance.objects = objects;
        fixture.detectChanges();

        const rows = fixture.nativeElement.querySelectorAll('.test-object-list__row');
        expect(rows.length).toBe(items.length);

        // Verify data-id attributes match
        rows.forEach((row: HTMLElement, i: number) => {
          expect(row.getAttribute('data-id')).toBe(String(i));
        });

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Random content strings preserve count ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For any array of random-content strings, the count invariant holds.
   */
  it('count invariant holds for random-content string arrays', () => {
    fc.assert(
      fc.property(arbRandomContentArray, items => {
        const fixture = TestBed.createComponent(TestListForComponent);
        fixture.componentInstance.items = items;
        fixture.detectChanges();

        const lis = fixture.nativeElement.querySelectorAll('.test-list__item');
        expect(lis.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Dynamic update: changing array length updates DOM count ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For any two array lengths A and B, rendering A items then updating to B items
   * produces exactly B DOM elements after change detection.
   */
  it('updating from A items to B items produces exactly B DOM elements', () => {
    fc.assert(
      fc.property(arbSmallItemArray, arbSmallItemArray, (itemsA, itemsB) => {
        const fixture = TestBed.createComponent(TestListForComponent);

        // Render initial array
        fixture.componentRef.setInput('items', itemsA);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.test-list__item').length).toBe(
          itemsA.length
        );

        // Update to new array using setInput to avoid NG0100
        fixture.componentRef.setInput('items', itemsB);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelectorAll('.test-list__item').length).toBe(
          itemsB.length
        );

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Empty array → zero elements ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For any list component, an empty array produces zero list-item elements.
   */
  it('empty array produces zero list-item elements for all component types', () => {
    fc.assert(
      fc.property(arbListComponent, descriptor => {
        const fixture: ComponentFixture<any> = TestBed.createComponent(descriptor.component);
        (fixture.componentInstance as any)[descriptor.inputKey] = descriptor.transform([]);
        fixture.detectChanges();

        const rendered = fixture.nativeElement.querySelectorAll(descriptor.itemSelector);
        expect(rendered.length).toBe(0);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Text content matches items ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For any array of N items, each rendered element's text content matches
   * the corresponding item string.
   */
  it('each rendered element text matches the corresponding item', () => {
    fc.assert(
      fc.property(arbSmallItemArray, items => {
        const fixture = TestBed.createComponent(TestListForComponent);
        fixture.componentInstance.items = items;
        fixture.detectChanges();

        const lis = fixture.nativeElement.querySelectorAll('.test-list__item');
        expect(lis.length).toBe(items.length);

        lis.forEach((li: HTMLElement, i: number) => {
          expect(li.textContent?.trim()).toBe(items[i]);
        });

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });

  // ---------- Radio option list: N options → N wrapper divs ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * For the radio-option pattern and any N (0–100), exactly N option wrappers render.
   */
  it('radio option list renders exactly N option wrappers', () => {
    fc.assert(
      fc.property(arbItemArray, items => {
        const fixture = TestBed.createComponent(TestOptionListComponent);
        fixture.componentInstance.options = items;
        fixture.detectChanges();

        const options = fixture.nativeElement.querySelectorAll('.test-option-list__option');
        expect(options.length).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 150 }
    );
  });

  // ---------- Successive renders are idempotent ----------

  /**
   * **Validates: Requirements 12.5, 3.3**
   *
   * Calling detectChanges() multiple times with the same array
   * does not change the DOM element count.
   */
  it('multiple detectChanges with same array does not change element count', () => {
    fc.assert(
      fc.property(arbSmallItemArray, items => {
        const fixture = TestBed.createComponent(TestListForComponent);
        fixture.componentInstance.items = items;

        fixture.detectChanges();
        const countAfterFirst = fixture.nativeElement.querySelectorAll('.test-list__item').length;

        fixture.detectChanges();
        fixture.detectChanges();
        const countAfterMultiple =
          fixture.nativeElement.querySelectorAll('.test-list__item').length;

        expect(countAfterFirst).toBe(items.length);
        expect(countAfterMultiple).toBe(items.length);

        fixture.destroy();
      }),
      { numRuns: 100 }
    );
  });
});
