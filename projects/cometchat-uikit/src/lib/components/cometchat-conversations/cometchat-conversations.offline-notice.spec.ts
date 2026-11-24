/** A notice's text is the live region; its close button is not inside it. */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { installOfflineSdk, OfflineSdkFake } from '../../testing/offline-sdk-fake';
import { OfflineHub } from '../../utils/offline/offline-hub';
import { CometChatConversationsComponent } from './cometchat-conversations.component';

describe('conversation list notice', () => {
  let fake: OfflineSdkFake;
  beforeEach(async () => {
    OfflineHub.resetForTests();
    fake = installOfflineSdk();
    await TestBed.configureTestingModule({
      imports: [CometChatConversationsComponent],
    }).compileComponents();
  });
  afterEach(() => {
    fake.restore();
    OfflineHub.resetForTests();
    TestBed.resetTestingModule();
  });

  it('keeps its close button outside the status region and announces the text', () => {
    const fixture = TestBed.createComponent(CometChatConversationsComponent);
    fixture.detectChanges();
    const hub = OfflineHub.getInstance();
    hub.notice$.next({ gen: hub.gen, kind: 'unsent_messages_lost', count: 2 });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-cc-notice] button')).not.toBeNull();
    expect(root.querySelectorAll('[role="status"] button')).toHaveLength(0);
    expect(root.querySelector('[data-cc-notice] [role="status"]')).not.toBeNull();
  });

  it('shows no notice when hideOfflineNotices is set', () => {
    const fixture = TestBed.createComponent(CometChatConversationsComponent);
    fixture.componentRef.setInput('hideOfflineNotices', true);
    fixture.detectChanges();
    const hub = OfflineHub.getInstance();
    hub.notice$.next({ gen: hub.gen, kind: 'unsent_messages_lost', count: 2 });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[data-cc-notice]')).toBeNull();
  });
});
