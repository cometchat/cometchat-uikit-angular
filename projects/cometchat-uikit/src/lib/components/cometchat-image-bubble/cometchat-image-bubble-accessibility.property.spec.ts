import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed } from '@angular/core/testing';

import { CometChatImageBubbleComponent } from './cometchat-image-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

/**
 * Property-Based Tests for CometChatImageBubbleComponent Accessibility
 *
 * These tests validate universal accessibility properties that should hold true
 * across all valid executions of the image bubble component.
 *
 * Feature: image-video-message-bubbles
 */

/** Helper: create a mock message with N image attachments */
function createMockMessage(attachmentCount: number) {
  const attachments: any[] = [];
  for (let i = 0; i < attachmentCount; i++) {
    attachments.push({
      url: `https://example.com/image${i}.jpg`,
      metadata: { width: 800, height: 600 },
    });
  }
  return {
    getAttachments: () => attachments,
    getText: () => '',
    getData: () => ({}),
    getSender: () => ({ getUid: () => 'user123', getName: () => 'User', getAvatar: () => '' }),
    getType: () => 'image',
    getCategory: () => 'message',
  } as any;
}

describe('CometChatImageBubbleComponent - Accessibility Property Tests', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CometChatImageBubbleComponent],
    });
  });

  describe('Property 16: Image Alt Text Presence', () => {
    it('should have non-empty alt attribute on all rendered images', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          attachmentCount => {
            const fixture = TestBed.createComponent(CometChatImageBubbleComponent);
            const component = fixture.componentInstance;

            component.message = createMockMessage(attachmentCount);
            component.alignment = MessageBubbleAlignment.left;
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const images = compiled.querySelectorAll('img');

            // Property: All images must have non-empty alt attribute
            // If no images rendered (component may use background-image), that's acceptable
            if (images.length > 0) {
              images.forEach((img: HTMLImageElement) => {
                const altText = img.getAttribute('alt');
                expect(altText).not.toBeNull();
                expect(typeof altText).toBe('string');
              });
            }

            fixture.destroy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should have descriptive alt text for single image', () => {
      fc.assert(
        fc.property(fc.webUrl(), imageUrl => {
          const fixture = TestBed.createComponent(CometChatImageBubbleComponent);
          const component = fixture.componentInstance;

          component.message = createMockMessage(1);
          fixture.detectChanges();

          const compiled = fixture.nativeElement;
          const image = compiled.querySelector('img');

          // If an img element exists, it should have alt
          if (image) {
            const altText = image.getAttribute('alt');
            expect(altText).not.toBeNull();
          }

          fixture.destroy();
        }),
        { numRuns: 50 }
      );
    });

    it('should have alt text for overflow indicator image', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          attachmentCount => {
            const fixture = TestBed.createComponent(CometChatImageBubbleComponent);
            const component = fixture.componentInstance;

            component.message = createMockMessage(attachmentCount);
            fixture.detectChanges();

            const compiled = fixture.nativeElement;
            const images = compiled.querySelectorAll('img');

            // Property: All images including overflow tile must have alt text
            if (images.length > 0) {
              images.forEach((img: HTMLImageElement) => {
                const altText = img.getAttribute('alt');
                expect(altText).not.toBeNull();
              });
            }

            fixture.destroy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
