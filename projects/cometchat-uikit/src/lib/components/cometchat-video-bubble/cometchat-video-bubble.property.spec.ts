import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed, ComponentFixture } from '@angular/core/testing';

import { CometChatVideoBubbleComponent } from './cometchat-video-bubble.component';

/**
 * Property-Based Tests for CometChatVideoBubbleComponent
 *
 * These tests validate universal correctness properties that should hold true
 * across all valid executions of the video bubble component.
 *
 * Feature: image-video-message-bubbles
 */

/** Helper: create a mock MediaMessage with N video attachments */
function createMockMessage(attachmentCount: number) {
  const attachments: any[] = [];
  for (let i = 0; i < attachmentCount; i++) {
    attachments.push({
      url: `https://example.com/video${i}.mp4`,
      thumbnail: `https://example.com/thumb${i}.jpg`,
      metadata: { width: 1920, height: 1080, duration: 120 + i },
    });
  }
  return {
    getAttachments: () => attachments,
    getText: () => '',
    getData: () => ({}),
    getSender: () => ({ getUid: () => 'user123', getName: () => 'User', getAvatar: () => '' }),
    getType: () => 'video',
    getCategory: () => 'message',
  } as any;
}

describe('CometChatVideoBubbleComponent - Property-Based Tests', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CometChatVideoBubbleComponent],
    });
  });

  describe('Property 19: Video Click Event Emission', () => {
    it('should emit videoClick event with correct attachment and index for any valid click', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.nat(),
          (attachmentCount, rawClickIndex) => {
            const clickIndex = rawClickIndex % attachmentCount;
            const fixture: ComponentFixture<CometChatVideoBubbleComponent> =
              TestBed.createComponent(CometChatVideoBubbleComponent);
            const component = fixture.componentInstance;

            component.message = createMockMessage(attachmentCount);
            fixture.detectChanges();

            let emittedPayload: any = null;
            component.videoClick.subscribe((payload: any) => { emittedPayload = payload; });

            (component as any).onVideoClick(clickIndex);

            expect(emittedPayload).not.toBeNull();
            expect(emittedPayload.index).toBe(clickIndex);
            expect(emittedPayload.attachment.url).toBe(`https://example.com/video${clickIndex}.mp4`);

            fixture.destroy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not emit videoClick event for invalid indices', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer(),
          (attachmentCount, invalidIndex) => {
            fc.pre(invalidIndex < 0 || invalidIndex >= attachmentCount);

            const fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
            const component = fixture.componentInstance;

            component.message = createMockMessage(attachmentCount);
            fixture.detectChanges();

            let eventEmitted = false;
            component.videoClick.subscribe(() => { eventEmitted = true; });

            (component as any).onVideoClick(invalidIndex);
            expect(eventEmitted).toBe(false);

            fixture.destroy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should emit playerOpen event when video is clicked', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.nat(),
          (attachmentCount, rawClickIndex) => {
            const clickIndex = rawClickIndex % attachmentCount;
            const fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
            const component = fixture.componentInstance;

            component.message = createMockMessage(attachmentCount);
            fixture.detectChanges();

            let playerOpenEmitted = false;
            component.playerOpen.subscribe(() => { playerOpenEmitted = true; });

            (component as any).onVideoClick(clickIndex);

            expect(playerOpenEmitted).toBe(true);
            expect((component as any).showPlayerViewer).toBe(true);
            expect((component as any).playerStartIndex).toBe(clickIndex);

            fixture.destroy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should emit playerClose event when player is closed', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), attachmentCount => {
          const fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
          const component = fixture.componentInstance;

          component.message = createMockMessage(attachmentCount);
          fixture.detectChanges();

          (component as any).openPlayerViewer(0);
          expect((component as any).showPlayerViewer).toBe(true);

          let playerCloseEmitted = false;
          component.playerClose.subscribe(() => { playerCloseEmitted = true; });

          (component as any).closePlayerViewer();

          expect(playerCloseEmitted).toBe(true);
          expect((component as any).showPlayerViewer).toBe(false);

          fixture.destroy();
        }),
        { numRuns: 50 }
      );
    });
  });
});
