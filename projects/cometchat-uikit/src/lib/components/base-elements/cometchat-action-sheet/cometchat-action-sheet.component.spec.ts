/**
 * CometChatActionSheet Component Tests
 *
 * Comprehensive test suite for the action sheet component that displays
 * a list of action items with keyboard navigation (ArrowUp/Down, Enter,
 * Space, Escape), ARIA menu semantics, and click-based selection.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Keyboard Accessibility, ARIA, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 3.4,
 *            10.1, 10.2, 10.4, 10.5, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatActionSheetComponent } from './cometchat-action-sheet.component';
import { CometChatMessageComposerAction, CometChatActionsView } from '../../../modals';

describe('CometChatActionSheetComponent', () => {
  let fixture: ComponentFixture<CometChatActionSheetComponent>;
  let component: CometChatActionSheetComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatActionSheetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatActionSheetComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function createSampleActions(): CometChatMessageComposerAction[] {
    return [
      new CometChatMessageComposerAction({
        id: 'action-1',
        title: 'Send Photo',
        iconURL: 'path/to/photo-icon.svg',
      }),
      new CometChatMessageComposerAction({
        id: 'action-2',
        title: 'Send File',
        iconURL: 'path/to/file-icon.svg',
      }),
      new CometChatMessageComposerAction({
        id: 'action-3',
        title: 'Send Location',
        iconURL: 'path/to/location-icon.svg',
      }),
    ];
  }

  function dispatchKeydown(key: string, target?: HTMLElement): void {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    (target ?? el).dispatchEvent(event);
    fixture.detectChanges();
  }

  function getActionItems(): NodeListOf<Element> {
    return el.querySelectorAll('.cometchat-action-sheet__item');
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have empty actions array by default', () => {
      expect(component.actions).toEqual([]);
    });

    it('should render the root cometchat wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the action sheet container', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-sheet')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect actions input array', () => {
      const actions = createSampleActions();
      component.actions = actions;
      fixture.detectChanges();
      expect(component.actions).toBe(actions);
      expect(component.actions.length).toBe(3);
    });

    it('should render correct number of action items for given actions', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();
      expect(getActionItems().length).toBe(3);
    });

    it('should accept a single action', () => {
      component.actions = [
        new CometChatMessageComposerAction({ id: 'single', title: 'Single Action' }),
      ];
      fixture.detectChanges();
      expect(getActionItems().length).toBe(1);
    });

    it('should accept CometChatActionsView in actions array', () => {
      const view = new CometChatActionsView({ id: 'view-1', title: 'Custom View' });
      component.actions = [view];
      fixture.detectChanges();
      expect(getActionItems().length).toBe(1);
    });

    it('should accept mixed action types', () => {
      const composer = new CometChatMessageComposerAction({ id: 'c1', title: 'Composer' });
      const view = new CometChatActionsView({ id: 'v1', title: 'View' });
      component.actions = [composer, view];
      fixture.detectChanges();
      expect(getActionItems().length).toBe(2);
    });

    it('should update rendered items when actions input changes', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();
      expect(getActionItems().length).toBe(3);

      fixture.componentRef.setInput('actions', [
        new CometChatMessageComposerAction({ id: 'new', title: 'New' }),
      ]);
      fixture.detectChanges();
      expect(getActionItems().length).toBe(1);
    });

    it('should handle empty actions array', () => {
      component.actions = [];
      fixture.detectChanges();
      expect(getActionItems().length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit actionItemClick when an action item is clicked', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);
      const actions = createSampleActions();
      component.actions = actions;
      fixture.detectChanges();

      const items = getActionItems();
      (items[0] as HTMLElement).click();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(actions[0]);
    });

    it('should emit the correct action object for each click', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);
      const actions = createSampleActions();
      component.actions = actions;
      fixture.detectChanges();

      (getActionItems()[1] as HTMLElement).click();

      expect(spy).toHaveBeenCalledWith(actions[1]);
      expect(spy.mock.calls[0][0].id).toBe('action-2');
    });

    it('should emit different actions for sequential clicks', () => {
      const emitted: string[] = [];
      component.actionItemClick.subscribe(a => emitted.push(a.id));
      component.actions = createSampleActions();
      fixture.detectChanges();

      (getActionItems()[0] as HTMLElement).click();
      (getActionItems()[2] as HTMLElement).click();

      expect(emitted).toEqual(['action-1', 'action-3']);
    });

    it('should emit CometChatActionsView on click', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);
      const view = new CometChatActionsView({ id: 'view-1', title: 'View' });
      component.actions = [view];
      fixture.detectChanges();

      (getActionItems()[0] as HTMLElement).click();

      expect(spy).toHaveBeenCalledWith(view);
    });

    it('should emit closeSheet on Escape key', () => {
      const spy = vi.fn();
      component.closeSheet.subscribe(spy);
      component.actions = createSampleActions();
      fixture.detectChanges();

      dispatchKeydown('Escape');

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class on the action sheet', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-sheet')).toBeTruthy();
    });

    it('should render item icon element for each action', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      const icons = el.querySelectorAll('.cometchat-action-sheet__item-icon');
      expect(icons.length).toBe(3);
    });

    it('should render item body element for each action', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      const bodies = el.querySelectorAll('.cometchat-action-sheet__item-body');
      expect(bodies.length).toBe(3);
    });

    it('should display action title text in item body', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      const bodies = el.querySelectorAll('.cometchat-action-sheet__item-body');
      expect(bodies[0].textContent?.trim()).toContain('Send Photo');
      expect(bodies[1].textContent?.trim()).toContain('Send File');
      expect(bodies[2].textContent?.trim()).toContain('Send Location');
    });

    it('should render no items when actions is empty', () => {
      component.actions = [];
      fixture.detectChanges();
      expect(getActionItems().length).toBe(0);
    });

    it('should still render the menu container when actions is empty', () => {
      component.actions = [];
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-action-sheet')).toBeTruthy();
    });

    it('should apply mask style for icon when iconURL is provided', () => {
      component.actions = [
        new CometChatMessageComposerAction({ id: 'a1', title: 'Test', iconURL: 'test-icon.svg' }),
      ];
      fixture.detectChanges();

      const icon = el.querySelector('.cometchat-action-sheet__item-icon') as HTMLElement;
      // The template sets webkitMask and mask styles when iconURL is present
      const maskStyle =
        icon.style.getPropertyValue('mask') || icon.style.getPropertyValue('-webkit-mask');
      expect(maskStyle).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    beforeEach(() => {
      component.actions = createSampleActions();
      fixture.detectChanges();
    });

    it('should move focus to first item on ArrowDown from initial state', () => {
      dispatchKeydown('ArrowDown');

      const items = getActionItems();
      expect(document.activeElement === items[0] || items[0].matches(':focus')).toBe(true);
    });

    it('should move focus down sequentially with ArrowDown', () => {
      dispatchKeydown('ArrowDown'); // → index 0
      dispatchKeydown('ArrowDown'); // → index 1

      const items = getActionItems();
      expect(document.activeElement === items[1] || items[1].matches(':focus')).toBe(true);
    });

    it('should move focus up with ArrowUp', () => {
      // Focus index 1 first
      (getActionItems()[1] as HTMLElement).focus();
      fixture.detectChanges();

      dispatchKeydown('ArrowUp');

      const items = getActionItems();
      expect(document.activeElement === items[0] || items[0].matches(':focus')).toBe(true);
    });

    it('should wrap to last item when ArrowUp from first item', () => {
      // Focus first item
      (getActionItems()[0] as HTMLElement).focus();
      fixture.detectChanges();

      dispatchKeydown('ArrowUp');

      const items = getActionItems();
      expect(document.activeElement === items[2] || items[2].matches(':focus')).toBe(true);
    });

    it('should wrap to first item when ArrowDown from last item', () => {
      // Focus last item
      (getActionItems()[2] as HTMLElement).focus();
      fixture.detectChanges();

      dispatchKeydown('ArrowDown');

      const items = getActionItems();
      expect(document.activeElement === items[0] || items[0].matches(':focus')).toBe(true);
    });

    it('should emit actionItemClick on Enter when an item is focused', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);

      // Focus first item to set focusedIndex
      (getActionItems()[0] as HTMLElement).focus();
      fixture.detectChanges();

      dispatchKeydown('Enter');

      expect(spy).toHaveBeenCalledWith(component.actions[0]);
    });

    it('should emit actionItemClick on Space when an item is focused', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);

      // Focus second item
      (getActionItems()[1] as HTMLElement).focus();
      fixture.detectChanges();

      dispatchKeydown(' ');

      expect(spy).toHaveBeenCalledWith(component.actions[1]);
    });

    it('should not emit actionItemClick on Enter when no item is focused', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);

      // Don't focus any item — focusedIndex stays at -1
      dispatchKeydown('Enter');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should not preventDefault on Tab key (allow natural exit)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, 'preventDefault');

      el.dispatchEvent(event);

      expect(preventSpy).not.toHaveBeenCalled();
    });

    it('should have tabindex="0" on each action item for focusability', () => {
      const items = getActionItems();
      items.forEach(item => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="menu" on the action sheet container', () => {
      fixture.detectChanges();
      const menu = el.querySelector('.cometchat-action-sheet');
      expect(menu?.getAttribute('role')).toBe('menu');
    });

    it('should have aria-label on the menu container', () => {
      fixture.detectChanges();
      const menu = el.querySelector('.cometchat-action-sheet');
      const ariaLabel = menu?.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(typeof ariaLabel).toBe('string');
    });

    it('should have role="menuitem" on each action item', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      const items = getActionItems();
      expect(items.length).toBe(3);
      items.forEach(item => {
        expect(item.getAttribute('role')).toBe('menuitem');
      });
    });

    it('should set aria-label to action title on each item', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      const items = getActionItems();
      expect(items[0].getAttribute('aria-label')).toBe('Send Photo');
      expect(items[1].getAttribute('aria-label')).toBe('Send File');
      expect(items[2].getAttribute('aria-label')).toBe('Send Location');
    });

    it('should have tabindex="0" on each action item', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      const items = getActionItems();
      items.forEach(item => {
        expect(item.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should still render menu with role="menu" when actions is empty', () => {
      component.actions = [];
      fixture.detectChanges();

      const menu = el.querySelector('.cometchat-action-sheet');
      expect(menu).toBeTruthy();
      expect(menu?.getAttribute('role')).toBe('menu');
    });

    it('should handle action with empty title for aria-label', () => {
      component.actions = [new CometChatMessageComposerAction({ id: 'no-title' })];
      fixture.detectChanges();

      const item = getActionItems()[0];
      // title defaults to '' so aria-label should be empty string
      expect(item.getAttribute('aria-label')).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle keyboard navigation with empty actions', () => {
      component.actions = [];
      fixture.detectChanges();

      // Should not throw
      expect(() => dispatchKeydown('ArrowDown')).not.toThrow();
      expect(() => dispatchKeydown('ArrowUp')).not.toThrow();
    });

    it('should handle keyboard navigation with single action', () => {
      component.actions = [new CometChatMessageComposerAction({ id: 's', title: 'Single' })];
      fixture.detectChanges();

      dispatchKeydown('ArrowDown'); // → index 0
      dispatchKeydown('ArrowDown'); // wraps → index 0

      const items = getActionItems();
      expect(items.length).toBe(1);
      expect(document.activeElement === items[0] || items[0].matches(':focus')).toBe(true);
    });

    it('should emit closeSheet on Escape even with empty actions', () => {
      const spy = vi.fn();
      component.closeSheet.subscribe(spy);
      component.actions = [];
      fixture.detectChanges();

      dispatchKeydown('Escape');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not emit actionItemClick on Enter with empty actions', () => {
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);
      component.actions = [];
      fixture.detectChanges();

      dispatchKeydown('Enter');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should return action id from trackByAction when id exists', () => {
      const action = new CometChatMessageComposerAction({ id: 'test-id', title: 'Test' });
      expect(component.trackByAction(0, action)).toBe('test-id');
    });

    it('should return fallback from trackByAction when id is empty', () => {
      const action = new CometChatMessageComposerAction({ id: '', title: 'Test' });
      expect(component.trackByAction(5, action)).toBe('action-5');
    });

    it('should handle action without iconURL gracefully', () => {
      component.actions = [new CometChatMessageComposerAction({ id: 'no-icon', title: 'No Icon' })];
      expect(() => fixture.detectChanges()).not.toThrow();

      const icon = el.querySelector('.cometchat-action-sheet__item-icon') as HTMLElement;
      expect(icon).toBeTruthy();
    });

    it('should update focusedIndex via onActionFocus', () => {
      component.actions = createSampleActions();
      fixture.detectChanges();

      component.onActionFocus(2);
      // Verify by pressing Enter — should emit the action at index 2
      const spy = vi.fn();
      component.actionItemClick.subscribe(spy);
      dispatchKeydown('Enter');
      expect(spy).toHaveBeenCalledWith(component.actions[2]);
    });

    it('should handle large number of actions', () => {
      const manyActions = Array.from(
        { length: 50 },
        (_, i) => new CometChatMessageComposerAction({ id: `action-${i}`, title: `Action ${i}` })
      );
      component.actions = manyActions;
      fixture.detectChanges();

      expect(getActionItems().length).toBe(50);
    });
  });
});
