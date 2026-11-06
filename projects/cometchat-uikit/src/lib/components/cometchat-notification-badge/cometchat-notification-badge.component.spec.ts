/**
 * CometChatNotificationBadge Tests
 *
 * Categories: Initialization, Count Subscription, Display Text (max overflow),
 *             Rendering, Style Overrides, Accessibility, Cleanup
 *
 * @module components/cometchat-notification-badge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { CometChatNotificationBadgeComponent } from './cometchat-notification-badge.component';
import { NotificationUnreadCountService } from '../../services/notification-unread-count.service';

describe('CometChatNotificationBadgeComponent', () => {
  let fixture: ComponentFixture<CometChatNotificationBadgeComponent>;
  let component: CometChatNotificationBadgeComponent;
  let el: HTMLElement;

  let count$: BehaviorSubject<number>;
  let startSpy: ReturnType<typeof vi.fn>;
  let stopSpy: ReturnType<typeof vi.fn>;

  function badge(): HTMLElement | null {
    return el.querySelector('.cometchat-notification-badge');
  }

  /** Pushes a new count through the service and flushes change detection. */
  function emitCount(n: number): void {
    count$.next(n);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    count$ = new BehaviorSubject<number>(0);
    startSpy = vi.fn();
    stopSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CometChatNotificationBadgeComponent],
      providers: [
        {
          provide: NotificationUnreadCountService,
          useValue: { count$, start: startSpy, stop: stopSpy },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatNotificationBadgeComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default max to 99', () => {
      expect(component.max).toBe(99);
    });

    it('should default category to undefined', () => {
      expect(component.category).toBeUndefined();
    });

    it('should default style to undefined', () => {
      expect(component.style).toBeUndefined();
    });

    it('should start the unread count service on init', () => {
      fixture.detectChanges();
      expect(startSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass the category through to the service', () => {
      component.category = 'mentions';
      fixture.detectChanges();
      expect(startSpy).toHaveBeenCalledWith({ category: 'mentions' });
    });

    it('should pass an undefined category when none is set', () => {
      fixture.detectChanges();
      expect(startSpy).toHaveBeenCalledWith({ category: undefined });
    });
  });

  // -------------------------------------------------------------------------
  // Count subscription
  // -------------------------------------------------------------------------

  describe('Count subscription', () => {
    it('should start at zero', () => {
      fixture.detectChanges();
      expect(component.count()).toBe(0);
    });

    it('should adopt the count emitted by the service', () => {
      fixture.detectChanges();
      emitCount(7);
      expect(component.count()).toBe(7);
    });

    it('should track successive emissions', () => {
      fixture.detectChanges();
      emitCount(3);
      emitCount(12);
      expect(component.count()).toBe(12);
    });

    it('should adopt a count the service already holds', () => {
      count$.next(5);
      fixture.detectChanges();
      expect(component.count()).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // Display text
  // -------------------------------------------------------------------------

  describe('displayText', () => {
    it('should show the plain count below max', () => {
      fixture.detectChanges();
      emitCount(5);
      expect(component.displayText()).toBe('5');
    });

    it('should show the plain count exactly at max', () => {
      fixture.detectChanges();
      emitCount(99);
      expect(component.displayText()).toBe('99');
    });

    it('should show "99+" once the count passes max', () => {
      fixture.detectChanges();
      emitCount(100);
      expect(component.displayText()).toBe('99+');
    });

    it('should respect a custom max', () => {
      component.max = 9;
      fixture.detectChanges();
      emitCount(10);
      expect(component.displayText()).toBe('9+');
    });

    it('should not overflow at a custom max boundary', () => {
      component.max = 9;
      fixture.detectChanges();
      emitCount(9);
      expect(component.displayText()).toBe('9');
    });
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render nothing while the count is zero', () => {
      fixture.detectChanges();
      expect(badge()).toBeNull();
    });

    it('should render the badge once the count is positive', () => {
      fixture.detectChanges();
      emitCount(1);
      expect(badge()).not.toBeNull();
    });

    it('should render the display text', () => {
      fixture.detectChanges();
      emitCount(42);
      expect(badge()?.textContent?.trim()).toBe('42');
    });

    it('should render the overflow text', () => {
      fixture.detectChanges();
      emitCount(250);
      expect(badge()?.textContent?.trim()).toBe('99+');
    });

    it('should disappear again when the count returns to zero', () => {
      fixture.detectChanges();
      emitCount(4);
      expect(badge()).not.toBeNull();
      emitCount(0);
      expect(badge()).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Style overrides
  // -------------------------------------------------------------------------

  describe('Style overrides', () => {
    it('should apply every supplied style property', () => {
      component.style = {
        backgroundColor: 'rgb(255, 0, 0)',
        textColor: 'rgb(255, 255, 255)',
        fontSize: '10px',
        borderRadius: '4px',
      };
      fixture.detectChanges();
      emitCount(3);

      const node = badge()!;
      expect(node.style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(node.style.color).toBe('rgb(255, 255, 255)');
      expect(node.style.fontSize).toBe('10px');
      expect(node.style.borderRadius).toBe('4px');
    });

    it('should leave styles unset when no overrides are given', () => {
      fixture.detectChanges();
      emitCount(3);

      const node = badge()!;
      expect(node.style.backgroundColor).toBe('');
      expect(node.style.color).toBe('');
    });

    it('should apply a partial style object without disturbing the rest', () => {
      component.style = { backgroundColor: 'rgb(0, 0, 255)' };
      fixture.detectChanges();
      emitCount(3);

      const node = badge()!;
      expect(node.style.backgroundColor).toBe('rgb(0, 0, 255)');
      expect(node.style.fontSize).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should expose the badge as a live status region', () => {
      fixture.detectChanges();
      emitCount(2);
      expect(badge()?.getAttribute('role')).toBe('status');
    });

    it('should carry an aria-label that begins with the displayed count', () => {
      fixture.detectChanges();
      emitCount(2);
      expect(badge()?.getAttribute('aria-label')).toMatch(/^2\s/);
    });

    it('should carry the overflow text in the aria-label', () => {
      fixture.detectChanges();
      emitCount(500);
      expect(badge()?.getAttribute('aria-label')).toMatch(/^99\+\s/);
    });
  });

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe('Cleanup', () => {
    it('should stop the unread count service on destroy', () => {
      fixture.detectChanges();
      fixture.destroy();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });

    it('should stop reacting to the service after destroy', () => {
      fixture.detectChanges();
      fixture.destroy();
      count$.next(99);
      expect(component.count()).toBe(0);
    });

    it('should not throw when destroyed before init', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
