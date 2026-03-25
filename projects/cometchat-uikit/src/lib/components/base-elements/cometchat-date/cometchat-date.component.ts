import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';
import { CalendarObject } from '../../../resources/CometChatLocalize/localization.interfaces';

/**
 * CometChatDate is a component for displaying formatted dates.
 * It accepts a timestamp and a calendar configuration object to format the date
 * using the CometChatLocalize service.
 *
 * Uses OnPush change detection and caches the formatted date to prevent
 * ExpressionChangedAfterItHasBeenCheckedError when relative time changes.
 *
 * @example
 * ```html
 * <cometchat-date [timestamp]="message.sentAt" [calendarObject]="dateFormat"></cometchat-date>
 * ```
 */
@Component({
  selector: 'cometchat-date',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cometchat-date.component.html',
  styleUrls: ['./cometchat-date.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatDateComponent implements OnInit, OnDestroy, OnChanges {
  /** Timestamp of the time to be displayed (Unix timestamp in seconds) */
  @Input() timestamp!: number;

  /** Configuration for date formatting (optional; falls back to global then hardcoded defaults) */
  @Input() calendarObject?: CalendarObject;

  /** Hardcoded fallback CalendarObject used when no Input and no global CalendarObject is set */
  private static readonly FALLBACK_CALENDAR: CalendarObject = {
    today: 'hh:mm A',
    yesterday: '[Yesterday]',
    lastWeek: 'dddd',
    otherDays: 'DD/MM/YYYY',
  };

  /** Cached formatted date string to prevent change detection issues */
  formattedDate = '';

  /** Interval ID for updating relative time */
  private updateIntervalId: ReturnType<typeof setInterval> | null = null;

  /** Update interval in milliseconds (60 seconds) */
  private readonly UPDATE_INTERVAL = 60000;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.updateFormattedDate();
    this.startUpdateInterval();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timestamp'] || changes['calendarObject']) {
      this.updateFormattedDate();
    }
  }

  ngOnDestroy(): void {
    this.stopUpdateInterval();
  }

  /**
   * Resolves the effective CalendarObject using the fallback chain:
   * 1. Component @Input (highest priority)
   * 2. Global CalendarObject from CometChatLocalize
   * 3. Hardcoded FALLBACK_CALENDAR
   */
  private getEffectiveCalendarObject(): CalendarObject {
    if (this.calendarObject) {
      return this.calendarObject;
    }
    const global = CometChatLocalize.getCalendarObject();
    if (global && Object.keys(global).length > 0) {
      return global;
    }
    return CometChatDateComponent.FALLBACK_CALENDAR;
  }

  /**
   * Updates the cached formatted date string.
   * Called on init, input changes, and periodically for relative time updates.
   */
  private updateFormattedDate(): void {
    if (!this.timestamp) {
      this.formattedDate = '';
      return;
    }
    const calendarObj = this.getEffectiveCalendarObject();
    this.formattedDate = CometChatLocalize.formatDate(this.timestamp, calendarObj);
  }

  /**
   * Starts the interval to update relative time display.
   * Runs outside Angular zone to avoid triggering unnecessary change detection.
   */
  private startUpdateInterval(): void {
    // Only start interval if we have relative time configuration
    if (!this.getEffectiveCalendarObject().relativeTime) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.updateIntervalId = setInterval(() => {
        const calendarObj = this.getEffectiveCalendarObject();
        const newFormattedDate =
          this.timestamp
            ? CometChatLocalize.formatDate(this.timestamp, calendarObj)
            : '';

        // Only trigger change detection if the value actually changed
        if (newFormattedDate !== this.formattedDate) {
          this.formattedDate = newFormattedDate;
          this.ngZone.run(() => {
            this.cdr.markForCheck();
          });
        }
      }, this.UPDATE_INTERVAL);
    });
  }

  /**
   * Stops the update interval.
   */
  private stopUpdateInterval(): void {
    if (this.updateIntervalId !== null) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Returns ISO 8601 formatted datetime string for the time element's datetime attribute.
   * This provides a machine-readable format for assistive technologies.
   */
  get isoDateTime(): string {
    if (!this.timestamp) {
      return '';
    }
    // Convert Unix timestamp (seconds) to milliseconds and create ISO string
    return new Date(this.timestamp * 1000).toISOString();
  }

  /**
   * Returns an accessible label for screen readers.
   * Provides full date and time information in a readable format.
   */
  get accessibleLabel(): string {
    if (!this.timestamp) {
      return '';
    }
    const date = new Date(this.timestamp * 1000);
    // Format: "January 15, 2026 at 3:45 PM"
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
}
