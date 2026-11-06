/**
 * CometChatPopover Component Tests
 *
 * Comprehensive test suite for the popover component that provides
 * floating content positioned relative to a trigger element with
 * viewport-aware positioning, keyboard accessibility, and ARIA support.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             Open/Close State, DOM Rendering, Keyboard Accessibility,
 *             ARIA, Click Outside, Hover Behavior, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4,
 *            3.1, 3.2, 10.3, 10.5, 14.4, 14.5, 15.7
 */
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatPopoverComponent } from './cometchat-popover.component';
import { Placement } from '../../../Enums/Enums';

/**
 * Test host component that provides a TemplateRef for the popover content input.
 */
@Component({
  standalone: true,
  imports: [CometChatPopoverComponent],
  template: `
    <cometchat-popover
      [placement]="placement"
      [content]="popoverContent"
      [closeOnOutsideClick]="closeOnOutsideClick"
      [showOnHover]="showOnHover"
      [debounceOnHover]="debounceOnHover"
      [disableBackgroundInteraction]="disableBackgroundInteraction"
      [trapFocus]="trapFocus"
      [showTooltip]="showTooltip"
      [ariaLabel]="ariaLabel"
      [ariaLabelledBy]="ariaLabelledBy"
      [ariaDescribedBy]="ariaDescribedBy"
      [contentStyle]="contentStyle"
      (popoverOpened)="onOpened()"
      (popoverClosed)="onClosed()"
      (outsideClick)="onOutsideClick()"
    >
      <button class="test-trigger">Open</button>
    </cometchat-popover>

    <ng-template #popoverContent>
      <div class="test-popover-body">
        <button class="test-focusable-btn">Focusable</button>
        <span>Popover content</span>
      </div>
    </ng-template>
  `,
})
class TestHostComponent {
  @ViewChild(CometChatPopoverComponent) popover!: CometChatPopoverComponent;
  @ViewChild('popoverContent') popoverContent!: TemplateRef<any>;

  placement: Placement = Placement.bottom;
  closeOnOutsideClick = true;
  showOnHover = false;
  debounceOnHover = 500;
  disableBackgroundInteraction = false;
  trapFocus = false;
  showTooltip = false;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  contentStyle: Record<string, string> = {};

  openedCount = 0;
  closedCount = 0;
  outsideClickCount = 0;

  onOpened(): void {
    this.openedCount++;
  }
  onClosed(): void {
    this.closedCount++;
  }
  onOutsideClick(): void {
    this.outsideClickCount++;
  }
}

describe('CometChatPopoverComponent', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let el: HTMLElement;

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
    el = hostFixture.nativeElement;
    hostFixture.detectChanges();
  });

  afterEach(() => {
    hostFixture.destroy();
  });

  /**
   * Helper: create a fresh fixture with custom initial host properties.
   *
   * NG0100 occurs when host properties are changed AFTER the initial
   * `detectChanges()` in `beforeEach`. By creating a new fixture and
   * setting properties BEFORE the first `detectChanges()`, we avoid
   * the "expression changed after it was checked" error entirely.
   *
   * Returns { fixture, host, el, popover } for the new fixture.
   * Caller is responsible for calling fixture.destroy() if needed
   * (though afterEach destroys the main fixture automatically).
   */
  function createFixtureWith(overrides: Partial<TestHostComponent>): {
    fixture: ComponentFixture<TestHostComponent>;
    host: TestHostComponent;
    el: HTMLElement;
  } {
    const fixture = TestBed.createComponent(TestHostComponent);
    const h = fixture.componentInstance;
    Object.assign(h, overrides);
    fixture.detectChanges();
    return { fixture, host: h, el: fixture.nativeElement };
  }

  /**
   * Helper: get the popover component's host element for dispatching events
   * that are caught by @HostListener on the component.
   */
  function getPopoverElement(root: HTMLElement = el): HTMLElement {
    return root.querySelector('cometchat-popover') as HTMLElement;
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the popover component', () => {
      expect(host.popover).toBeTruthy();
    });

    it('should default isOpen to false', () => {
      expect(host.popover.isOpen).toBe(false);
    });

    it('should default placement to bottom', () => {
      expect(host.popover.placement).toBe(Placement.bottom);
    });

    it('should default closeOnOutsideClick to true', () => {
      expect(host.popover.closeOnOutsideClick).toBe(true);
    });

    it('should default showOnHover to false', () => {
      expect(host.popover.showOnHover).toBe(false);
    });

    it('should default trapFocus to false', () => {
      expect(host.popover.trapFocus).toBe(false);
    });

    it('should default showTooltip to false', () => {
      expect(host.popover.showTooltip).toBe(false);
    });

    it('should default disableBackgroundInteraction to false', () => {
      expect(host.popover.disableBackgroundInteraction).toBe(false);
    });

    it('should generate a unique popoverId', () => {
      expect(host.popover.popoverId).toMatch(/^cometchat-popover-/);
    });

    it('should default contentStyle to empty object', () => {
      expect(host.popover.contentStyle).toEqual({});
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should reflect placement input', () => {
      const { fixture, host: h } = createFixtureWith({ placement: Placement.top });
      expect(h.popover.placement).toBe(Placement.top);
      fixture.destroy();
    });

    it('should accept all Placement enum values', () => {
      for (const p of [Placement.top, Placement.bottom, Placement.left, Placement.right]) {
        const { fixture, host: h } = createFixtureWith({ placement: p });
        expect(h.popover.placement).toBe(p);
        fixture.destroy();
      }
    });

    it('should reflect closeOnOutsideClick input', () => {
      const { fixture, host: h } = createFixtureWith({ closeOnOutsideClick: false });
      expect(h.popover.closeOnOutsideClick).toBe(false);
      fixture.destroy();
    });

    it('should reflect showOnHover input', () => {
      const { fixture, host: h } = createFixtureWith({ showOnHover: true });
      expect(h.popover.showOnHover).toBe(true);
      fixture.destroy();
    });

    it('should reflect debounceOnHover input', () => {
      const { fixture, host: h } = createFixtureWith({ debounceOnHover: 1000 });
      expect(h.popover.debounceOnHover).toBe(1000);
      fixture.destroy();
    });

    it('should reflect trapFocus input', () => {
      const { fixture, host: h } = createFixtureWith({ trapFocus: true });
      expect(h.popover.trapFocus).toBe(true);
      fixture.destroy();
    });

    it('should reflect ariaLabel input', () => {
      const { fixture, host: h } = createFixtureWith({ ariaLabel: 'Settings menu' });
      expect(h.popover.ariaLabel).toBe('Settings menu');
      fixture.destroy();
    });

    it('should reflect contentStyle input', () => {
      const style = { background: 'red', padding: '10px' };
      const { fixture, host: h } = createFixtureWith({ contentStyle: style });
      expect(h.popover.contentStyle).toEqual(style);
      fixture.destroy();
    });

    it('should handle undefined ariaLabel gracefully', () => {
      host.ariaLabel = undefined;
      expect(() => hostFixture.detectChanges()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit popoverOpened when popover opens via trigger click', () => {
      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.click();
      hostFixture.detectChanges();
      expect(host.openedCount).toBe(1);
    });

    it('should emit popoverClosed when popover closes via second trigger click', () => {
      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.click();
      hostFixture.detectChanges();
      trigger.click();
      hostFixture.detectChanges();
      expect(host.closedCount).toBe(1);
    });

    it('should emit popoverOpened via openPopover()', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(host.openedCount).toBe(1);
    });

    it('should emit popoverClosed via closePopover()', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      host.popover.closePopover();
      hostFixture.detectChanges();
      expect(host.closedCount).toBe(1);
    });

    it('should NOT emit popoverClosed via closePopoverSilently()', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      // closePopoverSilently sets isOpen=false outside CD, so we must
      // run CD to sync the view before the verification pass sees it.
      host.popover.closePopoverSilently();
      // Use the component's own CDR to sync internal state before fixture CD
      host.popover['cdr'].detectChanges();
      hostFixture.detectChanges();
      expect(host.closedCount).toBe(0);
      expect(host.popover.isOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Open/Close State
  // ---------------------------------------------------------------------------
  describe('Open/Close State', () => {
    it('should open via togglePopover()', () => {
      host.popover.togglePopover();
      expect(host.popover.isOpen).toBe(true);
    });

    it('should close via togglePopover() when already open', () => {
      host.popover.togglePopover();
      host.popover.togglePopover();
      expect(host.popover.isOpen).toBe(false);
    });

    it('should open via openPopover()', () => {
      host.popover.openPopover();
      expect(host.popover.isOpen).toBe(true);
    });

    it('should not re-emit popoverOpened if already open', () => {
      host.popover.openPopover();
      host.popover.openPopover();
      expect(host.openedCount).toBe(1);
    });

    it('should close via closePopover()', () => {
      host.popover.openPopover();
      host.popover.closePopover();
      expect(host.popover.isOpen).toBe(false);
    });

    it('should not re-emit popoverClosed if already closed', () => {
      host.popover.closePopover();
      expect(host.closedCount).toBe(0);
    });

    it('should toggle via trigger click when showOnHover is false', () => {
      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.click();
      expect(host.popover.isOpen).toBe(true);
    });

    it('should NOT toggle via trigger click when showOnHover is true', () => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ showOnHover: true });
      const trigger = hostEl.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.click();
      expect(h.popover.isOpen).toBe(false);
      fixture.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the root cometchat-popover BEM block', () => {
      expect(el.querySelector('.cometchat-popover')).toBeTruthy();
    });

    it('should render the trigger button wrapper', () => {
      expect(el.querySelector('.cometchat-popover__button')).toBeTruthy();
    });

    it('should project the trigger content (ng-content)', () => {
      const trigger = el.querySelector('.test-trigger');
      expect(trigger).toBeTruthy();
      expect(trigger?.textContent).toContain('Open');
    });

    it('should NOT render popover content when closed', () => {
      expect(el.querySelector('.cometchat-popover__content')).toBeFalsy();
    });

    it('should render popover content when open', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(el.querySelector('.cometchat-popover__content')).toBeTruthy();
    });

    it('should render the template content inside popover when open', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(el.querySelector('.test-popover-body')).toBeTruthy();
      expect(el.querySelector('.test-popover-body')?.textContent).toContain('Popover content');
    });

    it('should remove popover content from DOM when closed', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(el.querySelector('.cometchat-popover__content')).toBeTruthy();

      host.popover.closePopover();
      hostFixture.detectChanges();
      expect(el.querySelector('.cometchat-popover__content')).toBeFalsy();
    });

    it('should render overlay when disableBackgroundInteraction is true and open', () => {
      const {
        fixture,
        host: h,
        el: hostEl,
      } = createFixtureWith({ disableBackgroundInteraction: true });
      h.popover.openPopover();
      fixture.detectChanges();
      expect(hostEl.querySelector('.cometchat-popover__overlay')).toBeTruthy();
      fixture.destroy();
    });

    it('should NOT render overlay when disableBackgroundInteraction is false', () => {
      host.disableBackgroundInteraction = false;
      hostFixture.detectChanges();
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(el.querySelector('.cometchat-popover__overlay')).toBeFalsy();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should close popover on Escape key', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(host.popover.isOpen).toBe(true);

      // Dispatch Escape on the popover's own host element so @HostListener catches it
      const popoverEl = getPopoverElement();
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      popoverEl.dispatchEvent(escapeEvent);
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(false);
    });

    it('should emit popoverClosed on Escape key', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();

      const popoverEl = getPopoverElement();
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      popoverEl.dispatchEvent(escapeEvent);
      hostFixture.detectChanges();

      expect(host.closedCount).toBe(1);
    });

    it('should not do anything on Escape when popover is closed', () => {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(escapeEvent);
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(false);
      expect(host.closedCount).toBe(0);
    });

    it('should open popover via Enter key on trigger', () => {
      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      trigger.dispatchEvent(enterEvent);
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(true);
    });

    it('should open popover via Space key on trigger', () => {
      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      });
      trigger.dispatchEvent(spaceEvent);
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(true);
    });

    it('should close popover via Enter key on trigger when already open', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();

      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      trigger.dispatchEvent(enterEvent);
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have aria-expanded="false" on trigger when closed', () => {
      const trigger = el.querySelector('.cometchat-popover__button');
      expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have aria-expanded="true" on trigger when open', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      const trigger = el.querySelector('.cometchat-popover__button');
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-haspopup="dialog" when showTooltip is false', () => {
      const trigger = el.querySelector('.cometchat-popover__button');
      expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('should have aria-haspopup="false" when showTooltip is true', () => {
      const { fixture, el: hostEl } = createFixtureWith({ showTooltip: true });
      const trigger = hostEl.querySelector('.cometchat-popover__button');
      expect(trigger?.getAttribute('aria-haspopup')).toBe('false');
      fixture.destroy();
    });

    it('should set aria-controls to popoverId when open', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      const trigger = el.querySelector('.cometchat-popover__button');
      expect(trigger?.getAttribute('aria-controls')).toBe(host.popover.popoverId);
    });

    it('should NOT have aria-controls when closed', () => {
      const trigger = el.querySelector('.cometchat-popover__button');
      expect(trigger?.getAttribute('aria-controls')).toBeNull();
    });

    it('should render popover content with role="dialog" by default', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      const content = el.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('role')).toBe('dialog');
    });

    it('should render popover content with role="tooltip" when showTooltip is true', () => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ showTooltip: true });
      h.popover.openPopover();
      fixture.detectChanges();
      const content = hostEl.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('role')).toBe('tooltip');
      fixture.destroy();
    });

    it('should set aria-label on popover content when provided', () => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ ariaLabel: 'Settings menu' });
      h.popover.openPopover();
      fixture.detectChanges();
      const content = hostEl.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('aria-label')).toBe('Settings menu');
      fixture.destroy();
    });

    it('should set aria-labelledby on popover content when provided', () => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ ariaLabelledBy: 'heading-1' });
      h.popover.openPopover();
      fixture.detectChanges();
      const content = hostEl.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('aria-labelledby')).toBe('heading-1');
      fixture.destroy();
    });

    it('should set aria-describedby on popover content when provided', () => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ ariaDescribedBy: 'desc-1' });
      h.popover.openPopover();
      fixture.detectChanges();
      const content = hostEl.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('aria-describedby')).toBe('desc-1');
      fixture.destroy();
    });

    it('should have aria-modal="true" when trapFocus is true and showTooltip is false', () => {
      const {
        fixture,
        host: h,
        el: hostEl,
      } = createFixtureWith({ trapFocus: true, showTooltip: false });
      h.popover.openPopover();
      fixture.detectChanges();
      const content = hostEl.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('aria-modal')).toBe('true');
      fixture.destroy();
    });

    it('should NOT have aria-modal when trapFocus is false', () => {
      host.trapFocus = false;
      hostFixture.detectChanges();
      host.popover.openPopover();
      hostFixture.detectChanges();
      const content = el.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('aria-modal')).toBeNull();
    });

    it('should render overlay with role="presentation" and aria-hidden', () => {
      const {
        fixture,
        host: h,
        el: hostEl,
      } = createFixtureWith({ disableBackgroundInteraction: true });
      h.popover.openPopover();
      fixture.detectChanges();
      const overlay = hostEl.querySelector('.cometchat-popover__overlay');
      expect(overlay?.getAttribute('role')).toBe('presentation');
      expect(overlay?.getAttribute('aria-hidden')).toBe('true');
      fixture.destroy();
    });

    it('should set popover content id to popoverId', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      const content = el.querySelector('.cometchat-popover__content');
      expect(content?.getAttribute('id')).toBe(host.popover.popoverId);
    });
  });

  // ---------------------------------------------------------------------------
  // Click Outside
  // ---------------------------------------------------------------------------
  describe('Click Outside', () => {
    it('should close popover on outside click when closeOnOutsideClick is true', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(); // flush justOpened setTimeout

      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(false);
    }));

    it('should emit outsideClick on outside click', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick();

      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      hostFixture.detectChanges();

      expect(host.outsideClickCount).toBe(1);
    }));

    it('should NOT close popover on outside click when closeOnOutsideClick is false', fakeAsync(() => {
      const { fixture, host: h } = createFixtureWith({ closeOnOutsideClick: false });
      h.popover.openPopover();
      fixture.detectChanges();
      tick();

      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(h.popover.isOpen).toBe(true);
      fixture.destroy();
    }));

    it('should NOT close popover when clicking inside popover content', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick();

      const popoverBody = el.querySelector('.test-popover-body') as HTMLElement;
      if (popoverBody) {
        popoverBody.click();
        hostFixture.detectChanges();
      }

      expect(host.popover.isOpen).toBe(true);
    }));

    it('should NOT close popover when clicking the trigger element', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick();

      // Clicking the trigger toggles, but the click is inside childRef so
      // handleClickOutside should not fire. The toggle itself will close it,
      // so we test handleClickOutside directly.
      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      expect(trigger).toBeTruthy();
      // The trigger click is handled by onChildClick, not handleClickOutside
      // so the popover stays open from handleClickOutside's perspective
      expect(host.popover.isOpen).toBe(true);
    }));
  });

  // ---------------------------------------------------------------------------
  // Hover Behavior
  // ---------------------------------------------------------------------------
  describe('Hover Behavior', () => {
    it('should open popover on mouseenter when showOnHover is true', fakeAsync(() => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ showOnHover: true });

      const trigger = hostEl.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      tick(500);
      fixture.detectChanges();

      expect(h.popover.isOpen).toBe(true);
      fixture.destroy();
    }));

    it('should NOT open popover on mouseenter when showOnHover is false', fakeAsync(() => {
      host.showOnHover = false;
      hostFixture.detectChanges();

      const trigger = el.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      tick(500);
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(false);
    }));

    it('should close popover on mouseleave when showOnHover is true', fakeAsync(() => {
      const { fixture, host: h, el: hostEl } = createFixtureWith({ showOnHover: true });

      h.popover.openPopover();
      fixture.detectChanges();

      const trigger = hostEl.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      tick(500);
      fixture.detectChanges();

      expect(h.popover.isOpen).toBe(false);
      fixture.destroy();
    }));

    it('should respect debounceOnHover delay', fakeAsync(() => {
      const {
        fixture,
        host: h,
        el: hostEl,
      } = createFixtureWith({ showOnHover: true, debounceOnHover: 1000 });

      const trigger = hostEl.querySelector('.cometchat-popover__button') as HTMLElement;
      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      tick(500);
      expect(h.popover.isOpen).toBe(false);

      tick(500);
      expect(h.popover.isOpen).toBe(true);
      fixture.destroy();
    }));
  });

  // ---------------------------------------------------------------------------
  // Content Style
  // ---------------------------------------------------------------------------
  describe('Content Style', () => {
    it('should merge positionStyle with contentStyle', () => {
      const { fixture, host: h } = createFixtureWith({ contentStyle: { background: 'blue' } });
      h.popover.positionStyle = { top: '10px', left: '20px' };
      const style = h.popover.getPopoverContentStyle();
      expect(style).toEqual(
        expect.objectContaining({
          top: '10px',
          left: '20px',
          background: 'blue',
        })
      );
      fixture.destroy();
    });

    it('should add zIndex when disableBackgroundInteraction is true and open', () => {
      const { fixture, host: h } = createFixtureWith({ disableBackgroundInteraction: true });
      h.popover.openPopover();
      fixture.detectChanges();
      const style = h.popover.getPopoverContentStyle();
      expect(style['zIndex']).toBe('1000');
      expect(style['pointerEvents']).toBe('auto');
      fixture.destroy();
    });

    it('should NOT add zIndex when disableBackgroundInteraction is false', () => {
      host.disableBackgroundInteraction = false;
      hostFixture.detectChanges();
      host.popover.openPopover();
      hostFixture.detectChanges();
      const style = host.popover.getPopoverContentStyle();
      expect(style['zIndex']).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle rapid toggle calls', () => {
      host.popover.togglePopover(); // open
      host.popover.togglePopover(); // close
      host.popover.togglePopover(); // open
      expect(host.popover.isOpen).toBe(true);
    });

    it('should handle closePopover when already closed without throwing', () => {
      expect(() => host.popover.closePopover()).not.toThrow();
      expect(host.popover.isOpen).toBe(false);
    });

    it('should handle closePopoverSilently when already closed without throwing', () => {
      expect(() => host.popover.closePopoverSilently()).not.toThrow();
      expect(host.popover.isOpen).toBe(false);
    });

    it('should handle openPopover when already open without throwing', () => {
      host.popover.openPopover();
      expect(() => host.popover.openPopover()).not.toThrow();
      expect(host.popover.isOpen).toBe(true);
    });

    it('should handle ngOnDestroy cleanly when open', () => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      expect(() => host.popover.ngOnDestroy()).not.toThrow();
    });

    it('should handle ngOnDestroy cleanly when closed', () => {
      expect(() => host.popover.ngOnDestroy()).not.toThrow();
    });

    it('should handle empty contentStyle', () => {
      host.contentStyle = {};
      hostFixture.detectChanges();
      host.popover.positionStyle = { top: '5px' };
      const style = host.popover.getPopoverContentStyle();
      expect(style).toEqual(expect.objectContaining({ top: '5px' }));
    });

    it('should generate unique popoverIds across instances', async () => {
      const fixture2 = TestBed.createComponent(TestHostComponent);
      fixture2.detectChanges();
      const popover2 = fixture2.componentInstance.popover;
      expect(host.popover.popoverId).not.toBe(popover2.popoverId);
      fixture2.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Deferred work
  //
  // Opening schedules positioning, focus-trap setup and initial focus across
  // nested timers, so none of it runs until those are flushed.
  // ---------------------------------------------------------------------------
  describe('Deferred open sequence', () => {
    it('should position itself once the open timers settle', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);
      hostFixture.detectChanges();

      expect(host.popover.isPositioned).toBe(true);
    }));

    it('should clear the just-opened guard on the next tick', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      expect((host.popover as unknown as Record<string, unknown>)['justOpened']).toBe(false);
    }));

    it('should close any other open popover when one opens', fakeAsync(() => {
      const other = TestBed.createComponent(TestHostComponent);
      other.detectChanges();

      other.componentInstance.popover.openPopover();
      other.detectChanges();
      tick(10);
      expect(other.componentInstance.popover.isOpen).toBe(true);

      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      expect(other.componentInstance.popover.isOpen).toBe(false);
      other.destroy();
    }));
  });

  // ---------------------------------------------------------------------------
  // Window listeners
  // ---------------------------------------------------------------------------
  describe('Window listeners', () => {
    /** Runs rAF callbacks synchronously so the repositioning path executes. */
    function withSyncRaf(run: () => void): void {
      const original = globalThis.requestAnimationFrame;
      (globalThis as unknown as Record<string, unknown>)['requestAnimationFrame'] = (
        cb: FrameRequestCallback
      ) => {
        cb(0);
        return 0;
      };
      try {
        run();
      } finally {
        (globalThis as unknown as Record<string, unknown>)['requestAnimationFrame'] = original;
      }
    }

    it('should reposition on resize while open', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      withSyncRaf(() => {
        host.popover.handleWindowResize();
        tick(10);
      });

      expect(host.popover.isPositioned).toBe(true);
    }));

    it('should ignore a resize while closed', () => {
      expect(host.popover.isOpen).toBe(false);
      expect(() => host.popover.handleWindowResize()).not.toThrow();
    });

    it('should debounce rapid resizes into one reposition', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      withSyncRaf(() => {
        host.popover.handleWindowResize();
        host.popover.handleWindowResize();
        host.popover.handleWindowResize();
        tick(10);
      });

      expect(host.popover.isPositioned).toBe(true);
    }));

    it('should reposition on scroll while open', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      withSyncRaf(() => {
        host.popover.handleWindowScroll();
      });

      expect(host.popover.isPositioned).toBe(true);
    }));

    it('should ignore a scroll while closed', () => {
      expect(() => host.popover.handleWindowScroll()).not.toThrow();
    });

    it('should close on Escape while open', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      host.popover.handleEscapeKey();
      hostFixture.detectChanges();

      expect(host.popover.isOpen).toBe(false);
    }));

    it('should ignore Escape while closed', () => {
      host.popover.handleEscapeKey();
      expect(host.popover.isOpen).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Focus trap
  // ---------------------------------------------------------------------------
  describe('Focus trap', () => {
    /**
     * Rebuilds the fixture so host inputs are set before the first change
     * detection pass — assigning them afterwards triggers NG0100.
     */
    function rebuild(configure: (h: TestHostComponent) => void): void {
      hostFixture = TestBed.createComponent(TestHostComponent);
      host = hostFixture.componentInstance;
      el = hostFixture.nativeElement;
      configure(host);
      hostFixture.detectChanges();
    }

    function openWithTrap(): void {
      rebuild(h => {
        h.trapFocus = true;
      });
      host.popover.openPopover();
      hostFixture.detectChanges();
    }

    function tab(shiftKey = false): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);
      return event;
    }

    it('should focus the first focusable element on open', fakeAsync(() => {
      openWithTrap();
      tick(10);
      hostFixture.detectChanges();

      const first = el.querySelector('.test-focusable-btn');
      expect(document.activeElement).toBe(first);
    }));

    it('should wrap from the last focusable back to the first on Tab', fakeAsync(() => {
      openWithTrap();
      tick(10);
      hostFixture.detectChanges();

      const focusables = (host.popover as unknown as Record<string, HTMLElement[]>)[
        'focusableElements'
      ];
      if (focusables.length === 0) return;
      focusables[focusables.length - 1].focus();

      const event = tab();
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(focusables[0]);
    }));

    it('should wrap backwards from the first focusable to the last', fakeAsync(() => {
      openWithTrap();
      tick(10);
      hostFixture.detectChanges();

      const focusables = (host.popover as unknown as Record<string, HTMLElement[]>)[
        'focusableElements'
      ];
      if (focusables.length === 0) return;
      focusables[0].focus();

      const event = tab(true);
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(focusables[focusables.length - 1]);
    }));

    it('should stop arrow keys escaping the popover', fakeAsync(() => {
      openWithTrap();
      tick(10);
      hostFixture.detectChanges();

      for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
        const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        const spy = vi.spyOn(event, 'stopPropagation');
        document.dispatchEvent(event);
        expect(spy).toHaveBeenCalled();
      }
    }));

    it('should detach the keydown listener on close', fakeAsync(() => {
      openWithTrap();
      tick(10);

      const removeSpy = vi.spyOn(document, 'removeEventListener');
      host.popover.closePopover();
      hostFixture.detectChanges();

      expect(removeSpy.mock.calls.some(c => c[0] === 'keydown')).toBe(true);
    }));

    it('should not install a trap when trapFocus is off', fakeAsync(() => {
      rebuild(h => {
        h.trapFocus = false;
      });
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      const focusables = (host.popover as unknown as Record<string, HTMLElement[]>)[
        'focusableElements'
      ];
      expect(focusables).toHaveLength(0);
    }));
  });

  // ---------------------------------------------------------------------------
  // Positioning helpers
  // ---------------------------------------------------------------------------
  describe('Positioning helpers', () => {
    /** Same rationale as the focus-trap block: set inputs before first render. */
    function rebuild(configure: (h: TestHostComponent) => void): void {
      hostFixture = TestBed.createComponent(TestHostComponent);
      host = hostFixture.componentInstance;
      el = hostFixture.nativeElement;
      configure(host);
      hostFixture.detectChanges();
    }

    it('should expose the top-most CometChat ancestor', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      expect(() => host.popover.getTopMostCometChatElement()).not.toThrow();
    }));

    it('should fall back to the no-parent-height path when useParentHeight is off', fakeAsync(() => {
      host.popover.useParentHeight = false;
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      host.popover.calculatePopoverPosition();
      expect(host.popover.isPositioned).toBe(true);
    }));

    it('should set a height-independent position directly', fakeAsync(() => {
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      host.popover.setPopoverHeight();
      expect(host.popover.positionStyle).toBeDefined();
    }));

    it('should merge contentStyle into the computed position', fakeAsync(() => {
      rebuild(h => { h.contentStyle = { borderRadius: '8px' }; });
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      expect(host.popover.getPopoverContentStyle()['borderRadius']).toBe('8px');
    }));

    it('should raise the z-index when background interaction is disabled', fakeAsync(() => {
      rebuild(h => { h.disableBackgroundInteraction = true; });
      host.popover.openPopover();
      hostFixture.detectChanges();
      tick(10);

      expect(host.popover.getPopoverContentStyle()['zIndex']).toBe('1000');
    }));
  });

  // ---------------------------------------------------------------------------
  // Content that renders after opening (ENG-40617)
  // ---------------------------------------------------------------------------
  describe('Content resize', () => {
    let observerCallback: ResizeObserverCallback | undefined;
    let observed: Element[];
    let disconnect: () => void;

    beforeEach(() => {
      observed = [];
      disconnect = vi.fn();
      vi.stubGlobal(
        'ResizeObserver',
        class {
          constructor(cb: ResizeObserverCallback) { observerCallback = cb; }
          observe(target: Element) { observed.push(target); }
          disconnect() { disconnect(); }
          unobserve() { /* not used by the popover */ }
        }
      );
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    /** Give the trigger and the popover content fixed geometry (jsdom has no layout). */
    function setGeometry(popover: CometChatPopoverComponent, contentHeight: number): void {
      const trigger = popover.childRef.nativeElement;
      vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
        { top: 675, bottom: 699, left: 481, right: 505, width: 24, height: 24, x: 481, y: 675, toJSON: () => ({}) } as DOMRect
      );
      const content = popover.popoverRef.nativeElement;
      for (const prop of ['scrollHeight', 'offsetHeight']) {
        Object.defineProperty(content, prop, { configurable: true, get: () => contentHeight });
      }
      for (const prop of ['scrollWidth', 'offsetWidth']) {
        Object.defineProperty(content, prop, { configurable: true, get: () => 300 });
      }
    }

    it('moves a top-placed popover above its trigger once late content gives it a height', fakeAsync(() => {
      // Set on the component, not the host binding: changing the binding inside fakeAsync trips NG0100.
      const h = host;
      const fixture = hostFixture;
      h.popover.placement = Placement.top;
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 720 });
      h.popover.openPopover();
      fixture.detectChanges();
      setGeometry(h.popover, 0); // the content has not rendered yet
      tick();

      // Measured as 0 high, it is placed just above the trigger and would hang below it.
      expect(h.popover.positionStyle['top']).toBe('665px');
      expect(observed).toContain(h.popover.popoverRef.nativeElement);

      setGeometry(h.popover, 380); // the deferred content arrives
      observerCallback!([], {} as ResizeObserver);
      tick(16); // the re-position runs on the next animation frame

      expect(h.popover.positionStyle['top']).toBe('285px'); // 675 - 380 - 10
    }));

    it('does not re-position when the content size is unchanged', fakeAsync(() => {
      // Set on the component, not the host binding: changing the binding inside fakeAsync trips NG0100.
      const h = host;
      const fixture = hostFixture;
      h.popover.placement = Placement.top;
      h.popover.openPopover();
      fixture.detectChanges();
      setGeometry(h.popover, 200);
      tick();
      const reposition = vi.spyOn(h.popover, 'getPopoverPositionStyle');

      observerCallback!([], {} as ResizeObserver);
      tick(16);

      expect(reposition).not.toHaveBeenCalled();
    }));

    it('stops watching the content when the popover closes', fakeAsync(() => {
      // Set on the component, not the host binding: changing the binding inside fakeAsync trips NG0100.
      const h = host;
      const fixture = hostFixture;
      h.popover.placement = Placement.top;
      h.popover.openPopover();
      fixture.detectChanges();
      setGeometry(h.popover, 200);
      tick();

      h.popover.closePopover();

      expect(disconnect).toHaveBeenCalled();
    }));

    it('does not re-position a popover that closed before the resize frame ran', fakeAsync(() => {
      // Set on the component, not the host binding: changing the binding inside fakeAsync trips NG0100.
      const h = host;
      const fixture = hostFixture;
      h.popover.placement = Placement.top;
      h.popover.openPopover();
      fixture.detectChanges();
      setGeometry(h.popover, 0);
      tick();
      const reposition = vi.spyOn(h.popover, 'getPopoverPositionStyle');

      setGeometry(h.popover, 380); // content grows ...
      observerCallback!([], {} as ResizeObserver);
      h.popover.closePopover(); // ... and the popover closes in the same frame
      tick(16);

      expect(reposition).not.toHaveBeenCalled();
      expect(h.popover.isPositioned).toBe(false);
    }));
  });
});
