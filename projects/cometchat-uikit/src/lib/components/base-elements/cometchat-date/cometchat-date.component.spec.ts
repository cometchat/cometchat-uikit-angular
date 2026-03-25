/**
 * CometChatDate Component Tests
 *
 * Comprehensive test suite for the date component that displays formatted
 * dates using CometChatLocalize.formatDate(). Supports timestamp input,
 * calendarObject configuration, relative time with periodic updates,
 * ISO datetime and accessible label getters, and ARIA attributes on <time>.
 *
 * Categories: Initialization, Input Bindings, Formatted Output,
 *             isoDateTime Getter, accessibleLabel Getter, ARIA,
 *             Interval Update, Null/Zero Timestamp Handling,
 *             Localization, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 2.5, 3.1, 3.5,
 *            9.5, 9.6, 14.4, 14.5, 15.7
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatDateComponent } from './cometchat-date.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';

describe('CometChatDateComponent', () => {
  let fixture: ComponentFixture<CometChatDateComponent>;
  let component: CometChatDateComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    CometChatLocalize.init({
      language: 'en-US',
      timezone: 'UTC',
      disableAutoDetection: true,
    });

    await TestBed.configureTestingModule({
      imports: [CometChatDateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatDateComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  /** Standard calendarObject used across many tests */
  const defaultCalendar: CalendarObject = {
    today: 'h:mm A',
    yesterday: '[Yesterday]',
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY',
  };

  function getTimeElement(): HTMLTimeElement | null {
    return el.querySelector('time.cometchat-date');
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat-date__wrapper wrapper', () => {
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-date__wrapper')).toBeTruthy();
    });

    it('should render a <time> element with BEM class', () => {
      fixture.detectChanges();
      expect(getTimeElement()).toBeTruthy();
    });

    it('should have empty formattedDate by default', () => {
      expect(component.formattedDate).toBe('');
    });

    it('should have undefined timestamp by default', () => {
      expect(component.timestamp).toBeUndefined();
    });

    it('should have undefined calendarObject by default', () => {
      expect(component.calendarObject).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept timestamp input', () => {
      component.timestamp = 1700000000;
      fixture.detectChanges();
      expect(component.timestamp).toBe(1700000000);
    });

    it('should accept calendarObject input', () => {
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();
      expect(component.calendarObject).toBe(defaultCalendar);
    });

    it('should accept calendarObject with relativeTime config', () => {
      const cal: CalendarObject = {
        today: 'h:mm A',
        relativeTime: { minutes: '%d minutes ago', hour: '1 hour ago' },
      };
      component.calendarObject = cal;
      fixture.detectChanges();
      expect(component.calendarObject.relativeTime?.minutes).toBe('%d minutes ago');
    });

    it('should update formattedDate when timestamp changes via ngOnChanges', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();
      const first = component.formattedDate;

      component.timestamp = Math.floor(Date.now() / 1000) - 86400 * 30;
      fixture.detectChanges();
      // Manually trigger ngOnChanges since TestBed doesn't auto-trigger for programmatic changes
      component.ngOnChanges({
        timestamp: {
          previousValue: Math.floor(Date.now() / 1000),
          currentValue: component.timestamp,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      expect(component.formattedDate).not.toBe(first);
    });

    it('should handle null-like undefined for calendarObject gracefully', () => {
      component.timestamp = 1700000000;
      component.calendarObject = undefined!;
      expect(() => fixture.detectChanges()).not.toThrow();
      // Component uses fallback calendar when calendarObject is undefined
      expect(component.formattedDate).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Formatted Output
  // ---------------------------------------------------------------------------
  describe('Formatted Output', () => {
    it('should format a current timestamp with today pattern on init', () => {
      const now = Math.floor(Date.now() / 1000);
      component.timestamp = now;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      expect(component.formattedDate).toBeTruthy();
      expect(typeof component.formattedDate).toBe('string');
      // today pattern is 'h:mm A' → expect time with AM/PM
      expect(component.formattedDate).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
    });

    it('should format yesterday timestamp with yesterday pattern', () => {
      const yesterday = Math.floor(Date.now() / 1000) - 86400;
      component.timestamp = yesterday;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      expect(component.formattedDate).toBe('Yesterday');
    });

    it('should format older dates with otherDays pattern', () => {
      const oldDate = Math.floor(Date.now() / 1000) - 86400 * 30;
      component.timestamp = oldDate;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      // DD/MM/YYYY
      expect(component.formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format dates within last week with lastWeek pattern', () => {
      const threeDaysAgo = Math.floor(Date.now() / 1000) - 86400 * 3;
      component.timestamp = threeDaysAgo;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      // lastWeek pattern is 'dddd' → full weekday name
      expect(component.formattedDate).toBeTruthy();
      expect(component.formattedDate.length).toBeGreaterThan(0);
    });

    it('should format with relative time (minutes ago)', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      component.timestamp = fiveMinutesAgo;
      component.calendarObject = {
        today: 'h:mm A',
        relativeTime: { minutes: '%d minutes ago' },
      };
      fixture.detectChanges();

      expect(component.formattedDate).toContain('minutes ago');
    });

    it('should format with relative time (1 hour ago)', () => {
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      component.timestamp = oneHourAgo;
      component.calendarObject = {
        today: 'h:mm A',
        relativeTime: { hour: '%d hour ago', hours: '%d hours ago' },
      };
      fixture.detectChanges();

      expect(component.formattedDate).toContain('hour ago');
    });

    it('should render formattedDate as text content in the <time> element', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      expect(timeEl?.textContent?.trim()).toBe(component.formattedDate);
    });

    it('should update formattedDate on calendarObject change via ngOnChanges', () => {
      const now = Math.floor(Date.now() / 1000);
      component.timestamp = now;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      component.calendarObject = { today: 'DD/MM/YYYY', otherDays: 'DD/MM/YYYY' };
      component.ngOnChanges({
        calendarObject: {
          previousValue: defaultCalendar,
          currentValue: component.calendarObject,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();

      expect(component.formattedDate).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // isoDateTime Getter
  // ---------------------------------------------------------------------------
  describe('isoDateTime', () => {
    it('should return ISO 8601 string for a valid timestamp', () => {
      component.timestamp = 1700000000;
      expect(component.isoDateTime).toBe('2023-11-14T22:13:20.000Z');
    });

    it('should return empty string when timestamp is not set', () => {
      expect(component.isoDateTime).toBe('');
    });

    it('should return empty string when timestamp is 0', () => {
      component.timestamp = 0;
      expect(component.isoDateTime).toBe('');
    });

    it('should handle a very old timestamp (epoch start)', () => {
      component.timestamp = 1;
      expect(component.isoDateTime).toBe('1970-01-01T00:00:01.000Z');
    });

    it('should render datetime attribute on the <time> element', () => {
      component.timestamp = 1700000000;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      expect(timeEl?.getAttribute('datetime')).toBe('2023-11-14T22:13:20.000Z');
    });
  });

  // ---------------------------------------------------------------------------
  // accessibleLabel Getter
  // ---------------------------------------------------------------------------
  describe('accessibleLabel', () => {
    it('should return a human-readable date string for a valid timestamp', () => {
      component.timestamp = 1700000000;
      const label = component.accessibleLabel;
      expect(label).toBeTruthy();
      expect(label).toContain('2023');
      expect(label).toContain('November');
      expect(label).toMatch(/(AM|PM)/);
    });

    it('should return empty string when timestamp is not set', () => {
      expect(component.accessibleLabel).toBe('');
    });

    it('should return empty string when timestamp is 0', () => {
      component.timestamp = 0;
      expect(component.accessibleLabel).toBe('');
    });

    it('should render aria-label attribute on the <time> element', () => {
      component.timestamp = 1700000000;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      const ariaLabel = timeEl?.getAttribute('aria-label') ?? '';
      expect(ariaLabel).toContain('2023');
      expect(ariaLabel).toContain('November');
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should render a <time> element with datetime attribute', () => {
      component.timestamp = 1700000000;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      expect(timeEl).toBeTruthy();
      expect(timeEl?.getAttribute('datetime')).toBe('2023-11-14T22:13:20.000Z');
    });

    it('should render aria-label with accessible date string', () => {
      component.timestamp = 1700000000;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      const ariaLabel = timeEl?.getAttribute('aria-label') ?? '';
      expect(ariaLabel).toContain('2023');
      expect(ariaLabel).toContain('November');
    });

    it('should have empty datetime when timestamp is missing', () => {
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      expect(timeEl?.getAttribute('datetime')).toBe('');
    });

    it('should have empty aria-label when timestamp is missing', () => {
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      expect(timeEl?.getAttribute('aria-label')).toBe('');
    });

    it('should not be focusable (display-only component)', () => {
      component.timestamp = 1700000000;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      const tabindex = timeEl?.getAttribute('tabindex');
      expect(tabindex === null || tabindex === '-1').toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Interval Update
  // ---------------------------------------------------------------------------
  describe('Interval Update', () => {
    it('should start interval when calendarObject has relativeTime', () => {
      const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
      component.timestamp = fiveMinutesAgo;
      component.calendarObject = {
        today: 'h:mm A',
        relativeTime: { minutes: '%d minutes ago' },
      };
      fixture.detectChanges();

      expect(component.formattedDate).toContain('minutes ago');

      // Advance time by 60 seconds → interval fires
      vi.advanceTimersByTime(60000);

      // formattedDate may have updated (minute count changed)
      expect(component.formattedDate).toBeTruthy();
    });

    it('should not start interval when calendarObject has no relativeTime', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      // Advance time — no interval should fire, no error
      vi.advanceTimersByTime(120000);
      expect(component.formattedDate).toBeTruthy();
    });

    it('should stop interval on destroy', () => {
      component.timestamp = Math.floor(Date.now() / 1000) - 300;
      component.calendarObject = {
        today: 'h:mm A',
        relativeTime: { minutes: '%d minutes ago' },
      };
      fixture.detectChanges();

      const afterInit = component.formattedDate;
      fixture.destroy();

      vi.advanceTimersByTime(120000);
      // formattedDate should not change after destroy
      expect(component.formattedDate).toBe(afterInit);

      // Re-create fixture for afterEach cleanup
      fixture = TestBed.createComponent(CometChatDateComponent);
      component = fixture.componentInstance;
      el = fixture.nativeElement;
    });
  });

  // ---------------------------------------------------------------------------
  // Null / Zero Timestamp Handling
  // ---------------------------------------------------------------------------
  describe('Null/Zero Timestamp Handling', () => {
    it('should return empty formattedDate when timestamp is 0', () => {
      component.timestamp = 0;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      expect(component.formattedDate).toBe('');
    });

    it('should return formatted date using fallback calendar when calendarObject is not set', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      fixture.detectChanges();

      // Component uses FALLBACK_CALENDAR when no calendarObject is provided
      expect(component.formattedDate).toBeTruthy();
    });

    it('should return empty formattedDate when both inputs are missing', () => {
      fixture.detectChanges();
      expect(component.formattedDate).toBe('');
    });

    it('should handle timestamp set to NaN gracefully', () => {
      component.timestamp = NaN;
      component.calendarObject = defaultCalendar;
      // NaN is falsy → updateFormattedDate returns ''
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.formattedDate).toBe('');
    });

    it('should render empty text in <time> when timestamp is 0', () => {
      component.timestamp = 0;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const timeEl = getTimeElement();
      expect(timeEl?.textContent?.trim()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Localization
  // ---------------------------------------------------------------------------
  describe('Localization', () => {
    it('should use CometChatLocalize.formatDate for formatting', () => {
      const spy = vi.spyOn(CometChatLocalize, 'formatDate');
      const now = Math.floor(Date.now() / 1000);
      component.timestamp = now;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(now, defaultCalendar);
    });

    it('should reflect locale changes when re-initialized', () => {
      const now = Math.floor(Date.now() / 1000);
      component.timestamp = now;
      component.calendarObject = defaultCalendar;
      fixture.detectChanges();

      const enResult = component.formattedDate;

      // Re-init localization with a different language
      CometChatLocalize.init({
        language: 'de',
        timezone: 'UTC',
        disableAutoDetection: true,
      });

      // Trigger re-format via ngOnChanges
      component.ngOnChanges({
        calendarObject: {
          previousValue: defaultCalendar,
          currentValue: defaultCalendar,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();

      // The result may differ based on locale
      expect(component.formattedDate).toBeTruthy();
    });

    it('should produce non-empty string for valid timestamp and calendarObject', () => {
      component.timestamp = 1609459200; // 2021-01-01T00:00:00Z
      component.calendarObject = { otherDays: 'DD/MM/YYYY' };
      fixture.detectChanges();

      expect(component.formattedDate).toBeTruthy();
      expect(component.formattedDate.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle very large timestamp (max 32-bit Unix)', () => {
      component.timestamp = 2147483647; // 2038-01-19
      component.calendarObject = { otherDays: 'DD/MM/YYYY' };
      fixture.detectChanges();

      expect(component.formattedDate).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle calendarObject with all fields undefined', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      component.calendarObject = {
        today: undefined,
        yesterday: undefined,
        lastWeek: undefined,
        otherDays: undefined,
      };
      fixture.detectChanges();

      // Falls back to default 'DD/MM/YYYY' in formatDate
      expect(component.formattedDate).toBeTruthy();
    });

    it('should handle calendarObject with only otherDays', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      component.calendarObject = { otherDays: 'YYYY-MM-DD' };
      fixture.detectChanges();

      // Today with no today pattern → falls through to otherDays
      expect(component.formattedDate).toBeTruthy();
    });

    it('should handle empty calendarObject', () => {
      component.timestamp = Math.floor(Date.now() / 1000);
      component.calendarObject = {};
      fixture.detectChanges();

      expect(component.formattedDate).toBeTruthy();
    });

    it('should handle very long ago timestamp', () => {
      component.timestamp = 1; // 1 second after epoch
      component.calendarObject = { otherDays: 'DD/MM/YYYY' };
      fixture.detectChanges();

      expect(component.formattedDate).toMatch(/01\/01\/1970/);
    });

    it('should handle rapid input changes without error', () => {
      component.calendarObject = defaultCalendar;
      for (let i = 0; i < 10; i++) {
        component.timestamp = Math.floor(Date.now() / 1000) - i * 86400;
        component.ngOnChanges({
          timestamp: {
            previousValue: undefined,
            currentValue: component.timestamp,
            firstChange: false,
            isFirstChange: () => false,
          },
        });
      }
      fixture.detectChanges();
      expect(component.formattedDate).toBeTruthy();
    });
  });
});
