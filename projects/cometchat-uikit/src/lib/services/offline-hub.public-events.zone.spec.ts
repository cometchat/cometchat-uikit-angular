/**
 * The public events an app subscribes to (`ccMessageSent`, `ccMessageSendStateChanged`) are
 * emitted inside Angular's zone, though the SDK callbacks that cause them arrive outside it: an
 * app's own OnPush view bound to them would otherwise stay stale in a zone app.
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NgZone, provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CometChatMessageEvents } from '../events/CometChatMessageEvents';
import { offlineMessage, textMessage } from '../testing/offline-sdk-fake';
import { OfflineHub } from '../utils/offline/offline-hub';
import { OfflineHubService } from './offline-hub.service';

describe('public offline events and Angular zone', () => {
  beforeEach(() => OfflineHub.resetForTests());
  afterEach(() => {
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('are delivered inside the zone when the SDK callback ran outside it', () => {
    TestBed.configureTestingModule({ providers: [provideZoneChangeDetection()] });
    const zone = TestBed.inject(NgZone);
    TestBed.inject(OfflineHubService);
    const seen: Record<string, boolean> = {};
    const a = CometChatMessageEvents.ccMessageSent.subscribe(
      () => (seen['sent'] = NgZone.isInAngularZone())
    );
    const b = CometChatMessageEvents.ccMessageSendStateChanged.subscribe(
      () => (seen['state'] = NgZone.isInAngularZone())
    );
    const message = offlineMessage(textMessage('x'), { localMessageId: 'L1', status: 'PENDING' });
    zone.runOutsideAngular(() => {
      OfflineHub.getInstance().reportSendState(message, 'sending', {});
      OfflineHub.getInstance().reportSendState(message, 'sent', {});
    });
    a.unsubscribe();
    b.unsubscribe();
    expect(seen).toEqual({ sent: true, state: true });
  });
});
