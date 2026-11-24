/**
 * angular.md §5 / §6: SDK callbacks arrive outside Angular's zone. The hub
 * service re-enters the zone for zone apps, and screens write signals, so an
 * OnPush view updates from a hub event both in a zone app and in a zoneless
 * app (provideZonelessChangeDetection, the Angular 21 default).
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  NgZone,
  provideZoneChangeDetection,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OfflineHubService } from './offline-hub.service';
import { OfflineHub } from '../utils/offline/offline-hub';

@Component({
  selector: 'cometchat-hub-probe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="signal">{{ fromSignal() }}</span
    ><span class="field">{{ fromField }}</span>`,
})
class HubProbeComponent {
  private readonly hub = inject(OfflineHubService);
  private readonly cdr = inject(ChangeDetectorRef);
  /** The kit's screens write signals... */
  readonly fromSignal = signal('none');
  /** ...and some mark an OnPush view for check on a plain field. */
  fromField = 'none';
  readonly zoneSeen: boolean[] = [];
  constructor() {
    this.hub.sendState$.pipe(takeUntilDestroyed()).subscribe(event => {
      this.zoneSeen.push(NgZone.isInAngularZone());
      this.fromSignal.set(event.state);
      this.fromField = event.state;
      this.cdr.markForCheck();
    });
  }
}

/** An SDK callback: fired outside Angular's zone. */
function fireOutsideZone(state: 'sending' | 'sent'): void {
  const zone = TestBed.inject(NgZone);
  zone.runOutsideAngular(() => {
    const hub = OfflineHub.getInstance();
    hub.sendState$.next({ gen: hub.gen, localMessageId: 'L1', message: {} as any, state });
  });
}

describe('OfflineHubService change detection', () => {
  beforeEach(() => OfflineHub.resetForTests());
  afterEach(() => {
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('zone app: a hub event from outside the zone re-enters it and updates an OnPush view', async () => {
    TestBed.configureTestingModule({
      imports: [HubProbeComponent],
      providers: [provideZoneChangeDetection()],
    });
    const fixture = TestBed.createComponent(HubProbeComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    fireOutsideZone('sending');
    await fixture.whenStable();
    expect(fixture.componentInstance.zoneSeen).toEqual([true]);
    expect(fixture.nativeElement.querySelector('.signal').textContent).toBe('sending');
    expect(fixture.nativeElement.querySelector('.field').textContent).toBe('sending');
  });

  it('zoneless app: the same event updates the OnPush view through its signal', async () => {
    TestBed.configureTestingModule({
      imports: [HubProbeComponent],
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(HubProbeComponent);
    await fixture.whenStable();
    fireOutsideZone('sent');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.signal').textContent).toBe('sent');
    expect(fixture.nativeElement.querySelector('.field').textContent).toBe('sent');
  });
});
