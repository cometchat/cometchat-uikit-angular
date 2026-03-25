/**
 * CometChatListItem Component Tests
 *
 * Comprehensive test suite for the list item component that supports
 * avatar display, title/subtitle text, template projection (leadingView,
 * trailingView, subtitleView, titleView, menuView), keyboard activation
 * (Enter/Space), hover/focus state management, and ARIA accessibility.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Template Projection, Keyboard Accessibility,
 *             ARIA, Hover/Focus State Management, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5,
 *            3.1, 3.5, 3.6, 10.1, 10.2, 10.5, 14.4, 14.5, 15.7
 */
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatListItemComponent } from './cometchat-list-item.component';

/**
 * Test host component that provides real TemplateRef instances
 * for template projection tests.
 */
@Component({
  standalone: true,
  imports: [CometChatListItemComponent],
  template: `
    <ng-template #leadingTpl><span class="test-leading">Leading</span></ng-template>
    <ng-template #trailingTpl><span class="test-trailing">Trailing</span></ng-template>
    <ng-template #subtitleTpl><span class="test-subtitle">Custom Subtitle</span></ng-template>
    <ng-template #titleTpl><span class="test-title">Custom Title</span></ng-template>
    <ng-template #menuTpl><button class="test-menu-btn">Menu</button></ng-template>

    <cometchat-list-item
      [id]="id"
      [avatarURL]="avatarURL"
      [avatarName]="avatarName"
      [title]="title"
      [subtitle]="subtitle"
      [leadingView]="leadingViewRef"
      [trailingView]="trailingViewRef"
      [subtitleView]="subtitleViewRef"
      [titleView]="titleViewRef"
      [menuView]="menuViewRef"
      [disableTabIndex]="disableTabIndex"
      [isFocused]="isFocused"
      [ariaLabel]="ariaLabel"
      [menuShortcutKey]="menuShortcutKey"
      [stopEventPropagation]="stopEventPropagation"
      (listItemClick)="onListItemClick($event)"
    >
    </cometchat-list-item>
  `,
})
class TestHostComponent {
  @ViewChild('leadingTpl', { static: true }) leadingTpl!: TemplateRef<any>;
  @ViewChild('trailingTpl', { static: true }) trailingTpl!: TemplateRef<any>;
  @ViewChild('subtitleTpl', { static: true }) subtitleTpl!: TemplateRef<any>;
  @ViewChild('titleTpl', { static: true }) titleTpl!: TemplateRef<any>;
  @ViewChild('menuTpl', { static: true }) menuTpl!: TemplateRef<any>;

  id = '';
  avatarURL = '';
  avatarName = '';
  title = '';
  subtitle = '';
  disableTabIndex = false;
  isFocused = false;
  ariaLabel: string | undefined;
  menuShortcutKey: string | null = 'M';
  stopEventPropagation = false;

  leadingViewRef: TemplateRef<any> | null = null;
  trailingViewRef: TemplateRef<any> | null = null;
  subtitleViewRef: TemplateRef<any> | null = null;
  titleViewRef: TemplateRef<any> | null = null;
  menuViewRef: TemplateRef<any> | null = null;

  clickPayload: { id: string } | null = null;
  onListItemClick(event: { id: string }): void {
    this.clickPayload = event;
  }
}

describe('CometChatListItemComponent', () => {
  let fixture: ComponentFixture<CometChatListItemComponent>;
  let component: CometChatListItemComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatListItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatListItemComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getListItem(): HTMLElement | null {
    return el.querySelector('.cometchat-list-item');
  }

  function getTitleEl(): HTMLElement | null {
    return el.querySelector('.cometchat-list-item__body-title');
  }

  function getSubtitleEl(): HTMLElement | null {
    return el.querySelector('.cometchat-list-item__body-subtitle');
  }

  function getLeadingView(): HTMLElement | null {
    return el.querySelector('.cometchat-list-item__leading-view');
  }

  function getTrailingView(): HTMLElement | null {
    return el.querySelector('.cometchat-list-item__trailing-view');
  }

  function getMenuView(): HTMLElement | null {
    return el.querySelector('.cometchat-list-item__menu-view');
  }

  function dispatchKeydownOnListItem(key: string): void {
    const listItem = getListItem()!;
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    });
    listItem.dispatchEvent(event);
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat')).toBeTruthy();
    });

    it('should render the list item container', () => {
      fixture.detectChanges();
      expect(getListItem()).toBeTruthy();
    });

    it('should have empty string defaults for text inputs', () => {
      expect(component.id).toBe('');
      expect(component.avatarURL).toBe('');
      expect(component.avatarName).toBe('');
      expect(component.title).toBe('');
      expect(component.subtitle).toBe('');
    });

    it('should have null defaults for template inputs', () => {
      expect(component.menuView).toBeNull();
      expect(component.subtitleView).toBeNull();
      expect(component.trailingView).toBeNull();
      expect(component.titleView).toBeNull();
      expect(component.leadingView).toBeNull();
    });

    it('should have false defaults for boolean inputs', () => {
      expect(component.stopEventPropagation).toBe(false);
      expect(component.disableTabIndex).toBe(false);
      expect(component.isFocused).toBe(false);
    });

    it('should have default menuShortcutKey of M', () => {
      expect(component.menuShortcutKey).toBe('M');
    });

    it('should have false defaults for internal state', () => {
      expect(component.isHovering).toBe(false);
      expect(component.isMenuVisible).toBe(false);
      expect(component.isListItemFocused).toBe(false);
    });

    it('should render the body container', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-list-item__body')).toBeTruthy();
    });

    it('should render the title container', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-list-item__title-container')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept and reflect id input', () => {
      component.id = 'user-123';
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('id')).toBe('user-123');
    });

    it('should accept and render title input', () => {
      component.title = 'John Doe';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('John Doe');
    });

    it('should update DOM when title changes', () => {
      fixture.componentRef.setInput('title', 'First');
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('First');

      fixture.componentRef.setInput('title', 'Second');
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('Second');
    });

    it('should accept and render subtitle input', () => {
      component.subtitle = 'Online';
      fixture.detectChanges();
      expect(getSubtitleEl()?.textContent?.trim()).toBe('Online');
    });

    it('should accept avatarURL and show avatar', () => {
      component.avatarURL = 'https://example.com/avatar.png';
      fixture.detectChanges();
      expect(getLeadingView()).toBeTruthy();
      expect(el.querySelector('cometchat-avatar')).toBeTruthy();
    });

    it('should accept avatarName and show avatar', () => {
      component.avatarName = 'John Doe';
      fixture.detectChanges();
      expect(getLeadingView()).toBeTruthy();
    });

    it('should accept disableTabIndex and remove tabindex', () => {
      component.disableTabIndex = true;
      fixture.detectChanges();
      expect(getListItem()?.hasAttribute('tabindex')).toBe(false);
    });

    it('should handle null input for avatarURL gracefully', () => {
      component.avatarURL = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle null input for avatarName gracefully', () => {
      component.avatarName = null as any;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle empty string for title', () => {
      component.title = '';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit listItemClick when list item is clicked', () => {
      component.id = 'item-1';
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      getListItem()!.click();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ id: 'item-1' });
    });

    it('should emit listItemClick with updated id after id changes', () => {
      component.id = 'first';
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      getListItem()!.click();
      expect(spy).toHaveBeenCalledWith({ id: 'first' });

      component.id = 'second';
      fixture.detectChanges();
      getListItem()!.click();
      expect(spy).toHaveBeenCalledWith({ id: 'second' });
    });

    it('should emit listItemClick with empty id when id is not set', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      getListItem()!.click();

      expect(spy).toHaveBeenCalledWith({ id: '' });
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render BEM block class .cometchat-list-item', () => {
      fixture.detectChanges();
      expect(getListItem()).toBeTruthy();
    });

    it('should render title text in the body-title element', () => {
      component.title = 'Test User';
      fixture.detectChanges();
      expect(getTitleEl()?.textContent?.trim()).toBe('Test User');
    });

    it('should render subtitle when subtitle input is set', () => {
      component.subtitle = 'Last seen recently';
      fixture.detectChanges();
      const subtitleEl = getSubtitleEl();
      expect(subtitleEl).toBeTruthy();
      expect(subtitleEl?.textContent?.trim()).toBe('Last seen recently');
    });

    it('should not render subtitle element when no subtitle or subtitleView', () => {
      fixture.detectChanges();
      expect(getSubtitleEl()).toBeNull();
    });

    it('should render avatar when avatarURL is provided', () => {
      component.avatarURL = 'https://example.com/avatar.png';
      fixture.detectChanges();
      expect(getLeadingView()).toBeTruthy();
      expect(el.querySelector('cometchat-avatar')).toBeTruthy();
    });

    it('should not render avatar when neither avatarURL nor avatarName is set', () => {
      fixture.detectChanges();
      expect(getLeadingView()).toBeNull();
    });

    it('should render trailing view container by default', () => {
      fixture.detectChanges();
      expect(getTrailingView()).toBeTruthy();
    });

    it('should not render menu view when not hovering or focused', () => {
      fixture.detectChanges();
      expect(getMenuView()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit listItemClick on Enter key', () => {
      component.id = 'kb-1';
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      dispatchKeydownOnListItem('Enter');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ id: 'kb-1' });
    });

    it('should emit listItemClick on Space key', () => {
      component.id = 'kb-2';
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      dispatchKeydownOnListItem(' ');

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ id: 'kb-2' });
    });

    it('should not emit on unrelated keys like Tab or Escape', () => {
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      dispatchKeydownOnListItem('Tab');
      dispatchKeydownOnListItem('Escape');
      dispatchKeydownOnListItem('ArrowDown');

      expect(spy).not.toHaveBeenCalled();
    });

    it('should have tabindex="0" by default for keyboard focus', () => {
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('tabindex')).toBe('0');
    });

    it('should not have tabindex when disableTabIndex is true', () => {
      component.disableTabIndex = true;
      fixture.detectChanges();
      expect(getListItem()?.hasAttribute('tabindex')).toBe(false);
    });

    it('should not handle keydown from nested interactive elements', () => {
      component.id = 'kb-nested';
      fixture.detectChanges();
      const spy = vi.fn();
      component.listItemClick.subscribe(spy);

      // Dispatch keydown from a nested button, not the list item itself
      const nestedBtn = document.createElement('button');
      getListItem()!.appendChild(nestedBtn);

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      nestedBtn.dispatchEvent(event);
      fixture.detectChanges();

      // The component checks target !== currentTarget, so it should not emit
      expect(spy).not.toHaveBeenCalled();

      // Cleanup
      nestedBtn.remove();
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="listitem" on the list item container', () => {
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('role')).toBe('listitem');
    });

    it('should have aria-label from title when no custom ariaLabel or subtitle', () => {
      component.title = 'John Doe';
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('aria-label')).toBe('John Doe');
    });

    it('should have aria-label combining title and subtitle', () => {
      component.title = 'John Doe';
      component.subtitle = 'Online';
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('aria-label')).toBe('John Doe, Online');
    });

    it('should use custom ariaLabel when provided', () => {
      component.title = 'John Doe';
      component.subtitle = 'Online';
      component.ariaLabel = 'Custom accessible label';
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('aria-label')).toBe('Custom accessible label');
    });

    it('should have aria-describedby referencing subtitle element when subtitle exists', () => {
      component.id = 'user-1';
      component.subtitle = 'Online';
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('aria-describedby')).toBe('user-1-subtitle');
      expect(getSubtitleEl()?.getAttribute('id')).toBe('user-1-subtitle');
    });

    it('should not have aria-describedby when no subtitle', () => {
      fixture.detectChanges();
      expect(getListItem()?.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should set id attribute on the list item', () => {
      component.id = 'user-42';
      fixture.detectChanges();
      expect(getListItem()?.getAttribute('id')).toBe('user-42');
    });
  });

  // ---------------------------------------------------------------------------
  // Computed Properties
  // ---------------------------------------------------------------------------
  describe('Computed Properties', () => {
    it('showAvatar should be true when avatarURL is provided and no leadingView', () => {
      component.avatarURL = 'https://example.com/avatar.png';
      expect(component.showAvatar).toBe(true);
    });

    it('showAvatar should be true when avatarName is provided and no leadingView', () => {
      component.avatarName = 'John';
      expect(component.showAvatar).toBe(true);
    });

    it('showAvatar should be false when avatarURL is whitespace only', () => {
      component.avatarURL = '   ';
      expect(component.showAvatar).toBe(false);
    });

    it('showAvatar should be false when neither avatarURL nor avatarName is set', () => {
      expect(component.showAvatar).toBe(false);
    });

    it('showTrailingView should be true when not hovering/focused', () => {
      expect(component.showTrailingView).toBe(true);
    });

    it('showTrailingView should be true when hovering but no menuView', () => {
      component.isHovering = true;
      expect(component.showTrailingView).toBe(true);
    });

    it('showMenuView should be false when not hovering/focused', () => {
      expect(component.showMenuView).toBe(false);
    });

    it('computedAriaLabel should return title when no subtitle or custom ariaLabel', () => {
      component.title = 'Test';
      expect(component.computedAriaLabel).toBe('Test');
    });

    it('computedAriaLabel should combine title and subtitle', () => {
      component.title = 'Test';
      component.subtitle = 'Sub';
      expect(component.computedAriaLabel).toBe('Test, Sub');
    });

    it('subtitleId should combine id with -subtitle suffix', () => {
      component.id = 'user-1';
      expect(component.subtitleId).toBe('user-1-subtitle');
    });
  });

  // ---------------------------------------------------------------------------
  // Hover/Focus State Management
  // ---------------------------------------------------------------------------
  describe('Hover/Focus State Management', () => {
    it('should set isHovering to true on mouse enter', () => {
      component.onMouseEnter();
      expect(component.isHovering).toBe(true);
    });

    it('should set isHovering to false on mouse leave', () => {
      component.isHovering = true;
      component.onMouseLeave();
      expect(component.isHovering).toBe(false);
    });

    it('should hide menu on mouse leave when not focused', () => {
      component.isMenuVisible = true;
      component.isListItemFocused = false;
      component.onMouseLeave();
      expect(component.isMenuVisible).toBe(false);
    });

    it('should keep menu visible on mouse leave when focused', () => {
      component.isMenuVisible = true;
      component.isListItemFocused = true;
      component.onMouseLeave();
      expect(component.isMenuVisible).toBe(true);
    });

    it('should set isListItemFocused to true on focus', () => {
      component.onListItemFocus();
      expect(component.isListItemFocused).toBe(true);
    });

    it('should set isListItemFocused to false on blur', () => {
      component.isListItemFocused = true;
      component.onListItemBlur();
      expect(component.isListItemFocused).toBe(false);
    });

    it('should hide menu on blur when not hovering', () => {
      component.isMenuVisible = true;
      component.isHovering = false;
      component.onListItemBlur();
      expect(component.isMenuVisible).toBe(false);
    });

    it('should keep menu visible on blur when hovering', () => {
      component.isMenuVisible = true;
      component.isHovering = true;
      component.onListItemBlur();
      expect(component.isMenuVisible).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Event Propagation
  // ---------------------------------------------------------------------------
  describe('Event Propagation', () => {
    it('should stop propagation on trailing view click when stopEventPropagation is true', () => {
      component.stopEventPropagation = true;
      const event = new MouseEvent('click', { bubbles: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      component.onTrailingViewClick(event);
      expect(spy).toHaveBeenCalled();
    });

    it('should not stop propagation on trailing view click when stopEventPropagation is false', () => {
      component.stopEventPropagation = false;
      const event = new MouseEvent('click', { bubbles: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      component.onTrailingViewClick(event);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should always stop propagation on menu view click', () => {
      const event = new MouseEvent('click', { bubbles: true });
      const spy = vi.spyOn(event, 'stopPropagation');
      component.onMenuViewClick(event);
      expect(spy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle very long title without throwing', () => {
      component.title = 'A'.repeat(500);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(getTitleEl()?.textContent?.trim()).toBe('A'.repeat(500));
    });

    it('should handle very long subtitle without throwing', () => {
      component.subtitle = 'B'.repeat(500);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(getSubtitleEl()?.textContent?.trim()).toBe('B'.repeat(500));
    });

    it('should handle null avatarURL gracefully in showAvatar', () => {
      component.avatarURL = null as any;
      expect(() => component.showAvatar).not.toThrow();
      expect(component.showAvatar).toBe(false);
    });

    it('should handle null avatarName gracefully in showAvatar', () => {
      component.avatarName = null as any;
      expect(() => component.showAvatar).not.toThrow();
      expect(component.showAvatar).toBe(false);
    });

    it('should handle empty id in subtitleId', () => {
      expect(component.subtitleId).toBe('-subtitle');
    });

    it('should handle rapid hover enter/leave cycles', () => {
      component.onMouseEnter();
      component.onMouseLeave();
      component.onMouseEnter();
      component.onMouseLeave();
      expect(component.isHovering).toBe(false);
    });

    it('should handle rapid focus/blur cycles', () => {
      component.onListItemFocus();
      component.onListItemBlur();
      component.onListItemFocus();
      component.onListItemBlur();
      expect(component.isListItemFocused).toBe(false);
      expect(component.isMenuVisible).toBe(false);
    });

    it('should handle concurrent hover and focus states', () => {
      component.onMouseEnter();
      component.onListItemFocus();
      expect(component.isHovering).toBe(true);
      expect(component.isListItemFocused).toBe(true);

      // Mouse leaves but still focused
      component.onMouseLeave();
      expect(component.isHovering).toBe(false);
      expect(component.isListItemFocused).toBe(true);

      // Blur while not hovering
      component.onListItemBlur();
      expect(component.isMenuVisible).toBe(false);
    });

    it('should handle undefined ariaLabel gracefully', () => {
      component.ariaLabel = undefined;
      component.title = 'Test';
      expect(component.computedAriaLabel).toBe('Test');
    });

    it('should handle empty title in computedAriaLabel', () => {
      expect(component.computedAriaLabel).toBe('');
    });
  });
});

// =============================================================================
// Template Projection Tests (using TestHostComponent with real TemplateRefs)
// =============================================================================
describe('CometChatListItemComponent — Template Projection', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let hostEl: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostEl = hostFixture.nativeElement;
  });

  function getListItem(): HTMLElement | null {
    return hostEl.querySelector('.cometchat-list-item');
  }

  it('should render custom leadingView template and hide default avatar', () => {
    host.avatarURL = 'https://example.com/avatar.png';
    host.leadingViewRef = host.leadingTpl;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.test-leading')).toBeTruthy();
    expect(hostEl.querySelector('.cometchat-list-item__leading-view')).toBeNull();
  });

  it('should render default avatar when no leadingView is provided', () => {
    host.avatarURL = 'https://example.com/avatar.png';
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.cometchat-list-item__leading-view')).toBeTruthy();
    expect(hostEl.querySelector('cometchat-avatar')).toBeTruthy();
    expect(hostEl.querySelector('.test-leading')).toBeNull();
  });

  it('should render custom trailingView template', () => {
    host.trailingViewRef = host.trailingTpl;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.test-trailing')).toBeTruthy();
  });

  it('should render custom subtitleView template', () => {
    host.subtitleViewRef = host.subtitleTpl;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.test-subtitle')).toBeTruthy();
    expect(hostEl.querySelector('.cometchat-list-item__body-subtitle')).toBeTruthy();
  });

  it('should render default subtitle text when no subtitleView', () => {
    host.subtitle = 'Online';
    hostFixture.detectChanges();

    const subtitleEl = hostEl.querySelector('.cometchat-list-item__body-subtitle');
    expect(subtitleEl?.textContent?.trim()).toBe('Online');
    expect(hostEl.querySelector('.test-subtitle')).toBeNull();
  });

  it('should render custom titleView template and hide default title', () => {
    host.titleViewRef = host.titleTpl;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.test-title')).toBeTruthy();
    expect(hostEl.querySelector('.cometchat-list-item__body-title')).toBeNull();
  });

  it('should render default title when no titleView', () => {
    host.title = 'Default Title';
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.cometchat-list-item__body-title')?.textContent?.trim()).toBe(
      'Default Title'
    );
    expect(hostEl.querySelector('.test-title')).toBeNull();
  });

  it('should emit listItemClick through host binding', () => {
    host.id = 'host-item-1';
    hostFixture.detectChanges();

    getListItem()!.click();
    hostFixture.detectChanges();

    expect(host.clickPayload).toEqual({ id: 'host-item-1' });
  });

  it('should pass ariaLabel through to the list item', () => {
    host.ariaLabel = 'Custom host label';
    host.title = 'Title';
    hostFixture.detectChanges();

    expect(getListItem()?.getAttribute('aria-label')).toBe('Custom host label');
  });

  it('should pass disableTabIndex through to the list item', () => {
    host.disableTabIndex = true;
    hostFixture.detectChanges();

    expect(getListItem()?.hasAttribute('tabindex')).toBe(false);
  });

  it('should not render subtitle element when neither subtitle nor subtitleView is set', () => {
    hostFixture.detectChanges();
    expect(hostEl.querySelector('.cometchat-list-item__body-subtitle')).toBeNull();
  });
});
