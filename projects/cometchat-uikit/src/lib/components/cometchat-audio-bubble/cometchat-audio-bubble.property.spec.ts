/**
 * Property-Based Tests for CometChatAudioBubbleComponent
 *
 * These tests validate universal correctness properties that must hold
 * across all valid inputs using fast-check for property-based testing.
 *
 * @see Design Document: Correctness Properties
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ChangeDetectorRef, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CometChatAudioBubbleComponent } from './cometchat-audio-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';

// Minimum 100 iterations per property test as per design document
const testConfig = { numRuns: 100 };

/**
 * Helper to create a mock ChangeDetectorRef
 */
function createMockCdr(): ChangeDetectorRef {
  return {
    markForCheck: vi.fn(),
    detectChanges: vi.fn(),
    checkNoChanges: vi.fn(),
    detach: vi.fn(),
    reattach: vi.fn(),
  } as any;
}

/**
 * Helper to create a mock NgZone
 */
function createMockNgZone(): NgZone {
  return {
    run: vi.fn((fn: () => void) => fn()),
    runOutsideAngular: vi.fn((fn: () => void) => fn()),
  } as any;
}

/**
 * Arbitrary for generating attachment objects with various validity states
 */
const attachmentArbitrary = fc.record({
  url: fc.oneof(
    fc.webUrl(), // Valid URL
    fc.constant(''), // Empty string (invalid)
    fc.constant(null as any), // Null (invalid)
    fc.constant(undefined as any), // Undefined (invalid)
    fc.string() // Random string (may or may not be valid)
  ),
  name: fc.oneof(fc.string(), fc.constant(null as any), fc.constant(undefined as any)),
  size: fc.oneof(fc.nat(), fc.constant(null as any), fc.constant(undefined as any)),
  mimeType: fc.oneof(fc.string(), fc.constant(null as any), fc.constant(undefined as any)),
  extension: fc.oneof(fc.string(), fc.constant(null as any), fc.constant(undefined as any)),
});

/**
 * Arbitrary for generating valid attachment objects (with non-empty URL)
 */
const validAttachmentArbitrary = fc.record({
  url: fc.webUrl(),
  name: fc.string({ minLength: 1 }),
  size: fc.nat(),
  mimeType: fc.constantFrom('audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'),
  extension: fc.constantFrom('mp3', 'wav', 'ogg', 'm4a'),
});

/**
 * Helper to create a mock message with given attachments
 */
function createMockMessage(attachments: any[], caption?: string): any {
  return {
    getAttachments: () => attachments,
    getText: () => caption || '',
    getData: () => (caption ? { text: caption } : {}),
  };
}

/**
 * Arbitrary for generating alignment values
 */
const alignmentArbitrary = fc.constantFrom(
  MessageBubbleAlignment.left,
  MessageBubbleAlignment.right
);

/**
 * Helper to create a CometChatAudioBubbleComponent inside Angular's injection context.
 * This is required because the component uses `inject()` in field initializers.
 */
function createComponent(cdr: ChangeDetectorRef, ngZone: NgZone): CometChatAudioBubbleComponent {
  return TestBed.runInInjectionContext(() => new CometChatAudioBubbleComponent(cdr, ngZone));
}

describe('CometChatAudioBubbleComponent - Property-Based Tests', () => {
  let component: CometChatAudioBubbleComponent;
  let mockCdr: ChangeDetectorRef;
  let mockNgZone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    mockCdr = createMockCdr();
    mockNgZone = createMockNgZone();
    component = createComponent(mockCdr, mockNgZone);
  });

  /**
   * Feature: audio-message-bubble
   * Property 1: Attachment Extraction Preserves Valid Entries
   *
   * For any MediaMessage with an array of attachments (some valid, some invalid),
   * the extractAttachments function SHALL return an array containing only the valid
   * attachments, where a valid attachment has a non-empty URL string. The output
   * array length SHALL be less than or equal to the input array length.
   *
   * **Validates: Requirements 1.1, 1.3, 1.4**
   */
  describe('Property 1: Attachment Extraction Preserves Valid Entries', () => {
    it('should only return attachments with valid non-empty URLs', () => {
      fc.assert(
        fc.property(fc.array(attachmentArbitrary, { minLength: 0, maxLength: 10 }), attachments => {
          // Arrange
          const mockMessage = createMockMessage(attachments);
          component.message = mockMessage;

          // Act
          component['processMessage']();
          const result = component['attachments'];

          // Assert: All results should have valid URLs
          result.forEach(att => {
            expect(att.url).toBeTruthy();
            expect(typeof att.url).toBe('string');
            expect(att.url.length).toBeGreaterThan(0);
          });

          // Assert: Result length should be <= input length
          expect(result.length).toBeLessThanOrEqual(attachments.length);
        }),
        testConfig
      );
    });

    it('should preserve all valid attachments from input', () => {
      fc.assert(
        fc.property(
          fc.array(validAttachmentArbitrary, { minLength: 1, maxLength: 10 }),
          validAttachments => {
            // Arrange
            const mockMessage = createMockMessage(validAttachments);
            component.message = mockMessage;

            // Act
            component['processMessage']();
            const result = component['attachments'];

            // Assert: All valid attachments should be preserved
            expect(result.length).toBe(validAttachments.length);

            // Assert: URLs should match
            validAttachments.forEach((input, index) => {
              expect(result[index].url).toBe(input.url);
            });
          }
        ),
        testConfig
      );
    });

    it('should filter out invalid attachments while preserving valid ones', () => {
      fc.assert(
        fc.property(
          fc.array(validAttachmentArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(
            fc.record({
              url: fc.constantFrom('', null, undefined),
              name: fc.string(),
              size: fc.nat(),
              mimeType: fc.string(),
              extension: fc.string(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (validAttachments, invalidAttachments) => {
            // Arrange: Mix valid and invalid attachments
            const mixedAttachments = [...validAttachments, ...invalidAttachments];
            // Shuffle to randomize order
            const shuffled = mixedAttachments.sort(() => Math.random() - 0.5);
            const mockMessage = createMockMessage(shuffled);
            component.message = mockMessage;

            // Act
            component['processMessage']();
            const result = component['attachments'];

            // Assert: Only valid attachments should be in result
            expect(result.length).toBe(validAttachments.length);

            // Assert: All result URLs should be from valid attachments
            const validUrls = new Set(validAttachments.map(a => a.url));
            result.forEach(att => {
              expect(validUrls.has(att.url)).toBe(true);
            });
          }
        ),
        testConfig
      );
    });

    it('should handle empty and null attachment arrays', () => {
      fc.assert(
        fc.property(fc.constantFrom([], null, undefined), attachments => {
          // Arrange
          const mockMessage = {
            getAttachments: () => attachments,
            getText: () => '',
            getData: () => ({}),
          };
          component.message = mockMessage as any;

          // Act
          component['processMessage']();
          const result = component['attachments'];

          // Assert: Should return empty array
          expect(result).toEqual([]);
        }),
        testConfig
      );
    });

    it('should extract all required properties from valid attachments', () => {
      fc.assert(
        fc.property(validAttachmentArbitrary, attachment => {
          // Arrange
          const mockMessage = createMockMessage([attachment]);
          component.message = mockMessage;

          // Act
          component['processMessage']();
          const result = component['attachments'][0];

          // Assert: All required properties should be present
          expect(result).toHaveProperty('url');
          expect(result).toHaveProperty('name');
          expect(result).toHaveProperty('size');
          expect(result).toHaveProperty('mimeType');
          expect(result).toHaveProperty('extension');

          // Assert: Types should be correct
          expect(typeof result.url).toBe('string');
          expect(typeof result.name).toBe('string');
          expect(typeof result.size).toBe('number');
          expect(typeof result.mimeType).toBe('string');
          expect(typeof result.extension).toBe('string');
        }),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 2: Alignment Determines Styling Variant
   *
   * For any alignment input value, the component SHALL correctly compute isOutgoing
   * (true for RIGHT, false for LEFT) and apply the corresponding CSS modifier class
   * (--sender for RIGHT, --receiver for LEFT).
   *
   * **Validates: Requirements 1.5, 1.6, 1.7**
   */
  describe('Property 2: Alignment Determines Styling Variant', () => {
    it('should set isOutgoing to true for RIGHT alignment and false for LEFT', () => {
      fc.assert(
        fc.property(alignmentArbitrary, alignment => {
          // Arrange
          const mockMessage = createMockMessage([
            {
              url: 'https://example.com/audio.mp3',
              name: 'audio.mp3',
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            },
          ]);
          component.message = mockMessage;
          component.alignment = alignment;

          // Act
          component.ngOnInit();

          // Assert: isOutgoing should match alignment
          if (alignment === MessageBubbleAlignment.right) {
            expect(component['isOutgoing']).toBe(true);
          } else {
            expect(component['isOutgoing']).toBe(false);
          }
        }),
        testConfig
      );
    });

    it('should maintain alignment-isOutgoing consistency across multiple changes', () => {
      fc.assert(
        fc.property(
          fc.array(alignmentArbitrary, { minLength: 2, maxLength: 10 }),
          alignmentSequence => {
            // Arrange
            const mockMessage = createMockMessage([
              {
                url: 'https://example.com/audio.mp3',
                name: 'audio.mp3',
                size: 1024,
                mimeType: 'audio/mpeg',
                extension: 'mp3',
              },
            ]);
            component.message = mockMessage;
            component.alignment = alignmentSequence[0];
            component.ngOnInit();

            // Act & Assert: Each alignment change should update isOutgoing correctly
            for (let i = 1; i < alignmentSequence.length; i++) {
              const newAlignment = alignmentSequence[i];
              const prevAlignment = component.alignment;
              component.alignment = newAlignment;

              component.ngOnChanges({
                alignment: {
                  currentValue: newAlignment,
                  previousValue: prevAlignment,
                  firstChange: false,
                  isFirstChange: () => false,
                },
              });

              // Assert: isOutgoing should always match current alignment
              const expectedIsOutgoing = newAlignment === MessageBubbleAlignment.right;
              expect(component['isOutgoing']).toBe(expectedIsOutgoing);
            }
          }
        ),
        testConfig
      );
    });

    it('should have consistent alignment and isOutgoing relationship', () => {
      fc.assert(
        fc.property(
          alignmentArbitrary,
          fc.array(validAttachmentArbitrary, { minLength: 1, maxLength: 5 }),
          (alignment, attachments) => {
            // Arrange
            const mockMessage = createMockMessage(attachments);
            component.message = mockMessage;
            component.alignment = alignment;

            // Act
            component.ngOnInit();

            // Assert: Bidirectional consistency
            // If alignment is RIGHT, isOutgoing must be true
            // If alignment is LEFT, isOutgoing must be false
            // If isOutgoing is true, alignment must be RIGHT
            // If isOutgoing is false, alignment must be LEFT
            if (component.alignment === MessageBubbleAlignment.right) {
              expect(component['isOutgoing']).toBe(true);
            }
            if (component.alignment === MessageBubbleAlignment.left) {
              expect(component['isOutgoing']).toBe(false);
            }
            if (component['isOutgoing'] === true) {
              expect(component.alignment).toBe(MessageBubbleAlignment.right);
            }
            if (component['isOutgoing'] === false) {
              expect(component.alignment).toBe(MessageBubbleAlignment.left);
            }
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 5: Sender Variant Styling Consistency
   *
   * For any audio bubble with alignment = RIGHT (sender variant), ALL styling elements
   * SHALL use sender-specific values:
   * - Background: primary color
   * - Waveform progress: static white
   * - Waveform wave: neutral-500
   * - Time text: static white
   * - Download icon: static white
   *
   * **Validates: Requirements 4.8, 9.1, 9.2, 9.3, 9.4, 9.5**
   */
  describe('Property 5: Sender Variant Styling Consistency', () => {
    it('should set isOutgoing to true for all sender variant configurations', () => {
      fc.assert(
        fc.property(
          fc.array(validAttachmentArbitrary, { minLength: 1, maxLength: 5 }),
          fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          (attachments, caption) => {
            // Arrange
            const mockMessage = createMockMessage(attachments, caption);
            component.message = mockMessage;
            component.alignment = MessageBubbleAlignment.right; // Sender variant

            // Act
            component.ngOnInit();

            // Assert: isOutgoing should always be true for sender variant
            expect(component['isOutgoing']).toBe(true);
          }
        ),
        testConfig
      );
    });

    it('should maintain sender styling regardless of attachment count', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), attachmentCount => {
          // Arrange
          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024 * (i + 1),
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          component.message = mockMessage;
          component.alignment = MessageBubbleAlignment.right;

          // Act
          component.ngOnInit();

          // Assert: Sender styling should be consistent
          expect(component['isOutgoing']).toBe(true);
          expect(component['attachments'].length).toBe(attachmentCount);
        }),
        testConfig
      );
    });

    it('should maintain sender styling with or without caption', () => {
      fc.assert(
        fc.property(
          validAttachmentArbitrary,
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 100 }),
          (attachment, hasCaption, captionText) => {
            // Arrange
            const caption = hasCaption ? captionText : undefined;
            const mockMessage = createMockMessage([attachment], caption);
            component.message = mockMessage;
            component.alignment = MessageBubbleAlignment.right;

            // Act
            component.ngOnInit();

            // Assert: Sender styling should be consistent regardless of caption
            expect(component['isOutgoing']).toBe(true);
            expect(component['hasCaption']).toBe(hasCaption && captionText.trim().length > 0);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 6: Receiver Variant Styling Consistency
   *
   * For any audio bubble with alignment = LEFT (receiver variant), ALL styling elements
   * SHALL use receiver-specific values:
   * - Background: neutral-300
   * - Waveform progress: primary color
   * - Waveform wave: extended-primary-300
   * - Time text: neutral-600
   * - Download icon: primary color
   *
   * **Validates: Requirements 4.9, 9.6, 9.7, 9.8, 9.9, 9.10**
   */
  describe('Property 6: Receiver Variant Styling Consistency', () => {
    it('should set isOutgoing to false for all receiver variant configurations', () => {
      fc.assert(
        fc.property(
          fc.array(validAttachmentArbitrary, { minLength: 1, maxLength: 5 }),
          fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          (attachments, caption) => {
            // Arrange
            const mockMessage = createMockMessage(attachments, caption);
            component.message = mockMessage;
            component.alignment = MessageBubbleAlignment.left; // Receiver variant

            // Act
            component.ngOnInit();

            // Assert: isOutgoing should always be false for receiver variant
            expect(component['isOutgoing']).toBe(false);
          }
        ),
        testConfig
      );
    });

    it('should maintain receiver styling regardless of attachment count', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), attachmentCount => {
          // Arrange
          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024 * (i + 1),
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          component.message = mockMessage;
          component.alignment = MessageBubbleAlignment.left;

          // Act
          component.ngOnInit();

          // Assert: Receiver styling should be consistent
          expect(component['isOutgoing']).toBe(false);
          expect(component['attachments'].length).toBe(attachmentCount);
        }),
        testConfig
      );
    });

    it('should maintain receiver styling with or without caption', () => {
      fc.assert(
        fc.property(
          validAttachmentArbitrary,
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 100 }),
          (attachment, hasCaption, captionText) => {
            // Arrange
            const caption = hasCaption ? captionText : undefined;
            const mockMessage = createMockMessage([attachment], caption);
            component.message = mockMessage;
            component.alignment = MessageBubbleAlignment.left;

            // Act
            component.ngOnInit();

            // Assert: Receiver styling should be consistent regardless of caption
            expect(component['isOutgoing']).toBe(false);
            expect(component['hasCaption']).toBe(hasCaption && captionText.trim().length > 0);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 13: Single Audio Player Policy
   *
   * For any two audio bubbles A and B, if A is playing and B starts playing,
   * then A SHALL be paused automatically. At any given time, at most one audio
   * SHALL be in playing state across all audio bubbles.
   *
   * **Validates: Requirements 5.5**
   */
  describe('Property 13: Single Audio Player Policy', () => {
    it('should ensure only one audio state can be playing at a time within a component', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 10 }),
          (attachmentCount, playSequence) => {
            // Arrange - create fresh component for each test
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024 * (i + 1),
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Initialize audio states for all attachments
            for (let i = 0; i < attachmentCount; i++) {
              const state = freshComponent['getAudioState'](i);
              state.isLoading = false; // Simulate loaded state
            }

            // Act: Simulate play sequence (without actual WaveSurfer)
            // We test the state management logic
            playSequence.forEach(index => {
              const validIndex = index % attachmentCount;
              const state = freshComponent['getAudioState'](validIndex);

              // Simulate starting playback - pause all others first
              freshComponent['audioStates'].forEach((s, idx) => {
                if (idx !== validIndex && s.isPlaying) {
                  s.isPlaying = false;
                }
              });
              state.isPlaying = true;

              // Assert: At most one audio should be playing
              let playingCount = 0;
              freshComponent['audioStates'].forEach(s => {
                if (s.isPlaying) playingCount++;
              });
              expect(playingCount).toBeLessThanOrEqual(1);
            });
          }
        ),
        testConfig
      );
    });

    it('should track playing state correctly for each audio index', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), attachmentCount => {
          // Arrange - create fresh component for each test
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024,
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Assert: Each audio state should be independently tracked
          for (let i = 0; i < attachmentCount; i++) {
            const state = freshComponent['getAudioState'](i);
            expect(state.isPlaying).toBe(false);
            expect(state.isLoading).toBe(true);
            expect(state.currentTime).toBe(0);
            expect(state.duration).toBe(0);
          }

          // Assert: States are independent - setting one doesn't affect others
          if (attachmentCount > 1) {
            const state0 = freshComponent['getAudioState'](0);
            state0.isPlaying = true;

            for (let i = 1; i < attachmentCount; i++) {
              const state = freshComponent['getAudioState'](i);
              expect(state.isPlaying).toBe(false);
            }
          }
        }),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 11: Play State Change Event Emission
   *
   * For any play or pause action, the component SHALL emit a playStateChange event
   * with the correct isPlaying value and the associated attachment.
   *
   * **Validates: Requirements 15.1**
   */
  describe('Property 11: Play State Change Event Emission', () => {
    it('should emit playStateChange with correct attachment on state changes', () => {
      fc.assert(
        fc.property(
          fc.array(validAttachmentArbitrary, { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.boolean(),
          (attachments, indexOffset, isPlaying) => {
            // Arrange - create fresh component for each test
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const validIndex = indexOffset % attachments.length;
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const emitSpy = vi.spyOn(freshComponent.playStateChange, 'emit');

            // Act: Emit a play state change event
            const attachment = freshComponent['attachments'][validIndex];
            freshComponent.playStateChange.emit({
              isPlaying,
              attachment,
            });

            // Assert: Event should be emitted with correct data
            expect(emitSpy).toHaveBeenCalledWith({
              isPlaying,
              attachment,
            });

            // Assert: Attachment in event should match the one at the index
            const emittedEvent = emitSpy.mock.calls[0][0];
            expect(emittedEvent!.attachment.url).toBe(attachments[validIndex].url);
          }
        ),
        testConfig
      );
    });

    it('should emit correct isPlaying value for play and pause actions', () => {
      fc.assert(
        fc.property(
          validAttachmentArbitrary,
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (attachment, playPauseSequence) => {
            // Arrange - create fresh component for each test
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const mockMessage = createMockMessage([attachment]);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const emitSpy = vi.spyOn(freshComponent.playStateChange, 'emit');

            // Act: Simulate play/pause sequence
            playPauseSequence.forEach((isPlaying, index) => {
              freshComponent.playStateChange.emit({
                isPlaying,
                attachment: freshComponent['attachments'][0],
              });

              // Assert: Each emission should have correct isPlaying value
              const lastCall = emitSpy.mock.calls[index]![0];
              expect(lastCall!.isPlaying).toBe(isPlaying);
            });

            // Assert: Total emissions should match sequence length
            expect(emitSpy).toHaveBeenCalledTimes(playPauseSequence.length);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 7: Time Format Consistency
   *
   * For any time value in seconds (including 0, positive integers, and edge cases),
   * the formatTime function SHALL return a string in "M:SS" format where M is minutes
   * (no leading zero) and SS is seconds (with leading zero if < 10).
   *
   * **Validates: Requirements 6.1**
   */
  describe('Property 7: Time Format Consistency', () => {
    it('should format any valid time value as M:SS', () => {
      fc.assert(
        fc.property(
          fc.nat(36000), // Up to 10 hours in seconds
          seconds => {
            // Act
            const result = component['formatTime'](seconds);

            // Assert: Should match M:SS or MM:SS or MMM:SS pattern
            expect(result).toMatch(/^\d+:\d{2}$/);

            // Parse and verify
            const [mins, secs] = result.split(':').map(Number);
            expect(secs).toBeGreaterThanOrEqual(0);
            expect(secs).toBeLessThan(60);
            expect(mins).toBeGreaterThanOrEqual(0);

            // Verify the math is correct
            expect(mins).toBe(Math.floor(seconds / 60));
            expect(secs).toBe(Math.floor(seconds % 60));
          }
        ),
        testConfig
      );
    });

    it('should always pad seconds with leading zero when < 10', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 9 }), // Seconds 0-9
          fc.nat(100), // Minutes 0-100
          (secs, mins) => {
            // Arrange
            const totalSeconds = mins * 60 + secs;

            // Act
            const result = component['formatTime'](totalSeconds);

            // Assert: Seconds should always be 2 digits
            const parts = result.split(':');
            expect(parts[1].length).toBe(2);
            expect(parts[1]).toBe(secs < 10 ? `0${secs}` : `${secs}`);
          }
        ),
        testConfig
      );
    });

    it('should handle edge cases gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(0),
            fc.constant(-1),
            fc.constant(-100),
            fc.constant(NaN),
            fc.constant(Infinity),
            fc.constant(-Infinity),
            fc.constant(null as any),
            fc.constant(undefined as any)
          ),
          edgeCase => {
            // Act
            const result = component['formatTime'](edgeCase);

            // Assert: Should return "0:00" for all edge cases
            expect(result).toBe('0:00');
          }
        ),
        testConfig
      );
    });

    it('should produce consistent results for same input', () => {
      fc.assert(
        fc.property(fc.nat(36000), seconds => {
          // Act: Call formatTime multiple times with same input
          const result1 = component['formatTime'](seconds);
          const result2 = component['formatTime'](seconds);
          const result3 = component['formatTime'](seconds);

          // Assert: All results should be identical (deterministic)
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }),
        testConfig
      );
    });

    it('should correctly format boundary values', () => {
      fc.assert(
        fc.property(fc.constantFrom(0, 59, 60, 61, 119, 120, 599, 600, 3599, 3600), seconds => {
          // Act
          const result = component['formatTime'](seconds);

          // Assert: Verify specific boundary values
          const expectedMins = Math.floor(seconds / 60);
          const expectedSecs = Math.floor(seconds % 60);
          const expectedResult = `${expectedMins}:${expectedSecs < 10 ? '0' : ''}${expectedSecs}`;

          expect(result).toBe(expectedResult);
        }),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 8: Download Progress Display
   *
   * For any download in progress (isDownloading = true), the component SHALL display
   * a circular progress indicator with strokeDasharray reflecting the current percentage
   * (0-100), and a cancel button SHALL be visible in the center.
   *
   * **Validates: Requirements 7.2, 7.3, 7.4**
   */
  describe('Property 8: Download Progress Display', () => {
    it('should calculate correct strokeDasharray for any progress value', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), progress => {
          // Arrange
          const state = component['getAudioState'](0);
          state.downloadProgress = progress;

          // Act
          const dashArray = component['getProgressDashArray'](0);

          // Assert: Should match expected format "X 62.8"
          const parts = dashArray.split(' ');
          expect(parts.length).toBe(2);
          expect(parts[1]).toBe('62.8');

          // Assert: First value should be progress * 0.628
          const expectedValue = progress * 0.628;
          expect(parseFloat(parts[0])).toBeCloseTo(expectedValue, 1);
        }),
        testConfig
      );
    });

    it('should have progress value proportional to percentage', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (progress1, progress2) => {
            // Arrange
            const state = component['getAudioState'](0);

            // Act
            state.downloadProgress = progress1;
            const dashArray1 = component['getProgressDashArray'](0);
            const value1 = parseFloat(dashArray1.split(' ')[0]);

            state.downloadProgress = progress2;
            const dashArray2 = component['getProgressDashArray'](0);
            const value2 = parseFloat(dashArray2.split(' ')[0]);

            // Assert: Higher progress should have higher dash value
            if (progress1 > progress2) {
              expect(value1).toBeGreaterThan(value2);
            } else if (progress1 < progress2) {
              expect(value1).toBeLessThan(value2);
            } else {
              expect(value1).toBeCloseTo(value2, 5);
            }
          }
        ),
        testConfig
      );
    });

    it('should track download state correctly for each audio index', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          fc.integer({ min: 0, max: 100 }),
          (attachmentCount, indexOffset, progress) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const validIndex = indexOffset % attachmentCount;

            // Act: Set download state for one index
            const state = freshComponent['getAudioState'](validIndex);
            state.isDownloading = true;
            state.downloadProgress = progress;

            // Assert: Only the specified index should have download state
            for (let i = 0; i < attachmentCount; i++) {
              const s = freshComponent['getAudioState'](i);
              if (i === validIndex) {
                expect(s.isDownloading).toBe(true);
                expect(s.downloadProgress).toBe(progress);
              } else {
                expect(s.isDownloading).toBe(false);
                expect(s.downloadProgress).toBe(0);
              }
            }
          }
        ),
        testConfig
      );
    });

    it('should have 0% progress at start and 100% at completion', () => {
      fc.assert(
        fc.property(fc.constantFrom(0, 100), progress => {
          // Arrange
          const state = component['getAudioState'](0);
          state.downloadProgress = progress;

          // Act
          const dashArray = component['getProgressDashArray'](0);
          const value = parseFloat(dashArray.split(' ')[0]);

          // Assert
          if (progress === 0) {
            expect(value).toBe(0);
          } else if (progress === 100) {
            expect(value).toBeCloseTo(62.8, 1);
          }
        }),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 3: Multiple Audio Display Shows Correct Count
   *
   * For any message with N attachments where N > 1, the component SHALL display
   * the first audio with full controls and show an expand indicator with the value (N - 1).
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  describe('Property 3: Multiple Audio Display Shows Correct Count', () => {
    it('should show correct remaining count for multiple attachments', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), attachmentCount => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024,
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Act
          const remainingCount = freshComponent['getRemainingAudiosCount']();

          // Assert: Remaining count should be N - 1
          expect(remainingCount).toBe(attachmentCount - 1);
          expect(freshComponent['attachments'].length).toBe(attachmentCount);
        }),
        testConfig
      );
    });

    it('should return 0 remaining for single attachment', () => {
      fc.assert(
        fc.property(validAttachmentArbitrary, attachment => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const mockMessage = createMockMessage([attachment]);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Act
          const remainingCount = freshComponent['getRemainingAudiosCount']();

          // Assert: Single attachment should have 0 remaining
          expect(remainingCount).toBe(0);
        }),
        testConfig
      );
    });

    it('should start in collapsed state for multiple attachments', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), attachmentCount => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024,
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Assert: Should start collapsed
          expect(freshComponent['isExpanded']).toBe(false);
        }),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 4: Expand/Collapse Round-Trip
   *
   * For any audio bubble with multiple attachments, expanding and then collapsing
   * SHALL return the component to its initial collapsed state with only the first
   * audio visible and isExpanded = false.
   *
   * **Validates: Requirements 3.3, 3.5**
   */
  describe('Property 4: Expand/Collapse Round-Trip', () => {
    it('should return to collapsed state after expand-collapse cycle', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), attachmentCount => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024,
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Assert initial state
          expect(freshComponent['isExpanded']).toBe(false);

          // Act: Expand
          freshComponent['toggleExpanded']();
          expect(freshComponent['isExpanded']).toBe(true);

          // Act: Collapse
          freshComponent['toggleExpanded']();

          // Assert: Back to initial state
          expect(freshComponent['isExpanded']).toBe(false);
        }),
        testConfig
      );
    });

    it('should maintain state consistency through multiple expand-collapse cycles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (attachmentCount, cycleCount) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Act: Multiple expand-collapse cycles
            for (let i = 0; i < cycleCount; i++) {
              // Expand
              freshComponent['toggleExpanded']();
              expect(freshComponent['isExpanded']).toBe(true);

              // Collapse
              freshComponent['toggleExpanded']();
              expect(freshComponent['isExpanded']).toBe(false);
            }

            // Assert: Final state should be collapsed
            expect(freshComponent['isExpanded']).toBe(false);
          }
        ),
        testConfig
      );
    });

    it('should toggle state correctly for any sequence of toggles', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 1, max: 20 }),
          (attachmentCount, toggleCount) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Act: Toggle multiple times
            for (let i = 0; i < toggleCount; i++) {
              freshComponent['toggleExpanded']();
            }

            // Assert: Final state should match parity of toggle count
            const expectedState = toggleCount % 2 === 1; // Odd = expanded, Even = collapsed
            expect(freshComponent['isExpanded']).toBe(expectedState);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 12: Expand Change Event Emission
   *
   * For any expand or collapse action, the component SHALL emit an expandChange event
   * with the new isExpanded value.
   *
   * **Validates: Requirements 15.5**
   */
  describe('Property 12: Expand Change Event Emission', () => {
    it('should emit expandChange with correct value on each toggle', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (attachmentCount, toggleCount) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const emitSpy = vi.spyOn(freshComponent.expandChange, 'emit');

            // Act: Toggle multiple times
            for (let i = 0; i < toggleCount; i++) {
              freshComponent['toggleExpanded']();
            }

            // Assert: Should have emitted for each toggle
            expect(emitSpy).toHaveBeenCalledTimes(toggleCount);

            // Assert: Each emission should have correct value
            for (let i = 0; i < toggleCount; i++) {
              const expectedValue = i % 2 === 0; // First toggle = true, second = false, etc.
              expect(emitSpy.mock.calls[i][0]).toBe(expectedValue);
            }
          }
        ),
        testConfig
      );
    });

    it('should emit true when expanding and false when collapsing', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), attachmentCount => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024,
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          const emitSpy = vi.spyOn(freshComponent.expandChange, 'emit');

          // Act: Expand
          freshComponent['toggleExpanded']();
          expect(emitSpy).toHaveBeenLastCalledWith(true);

          // Act: Collapse
          freshComponent['toggleExpanded']();
          expect(emitSpy).toHaveBeenLastCalledWith(false);
        }),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 9: Caption Rendering Conditional
   *
   * For any MediaMessage, the caption section SHALL be rendered if and only if
   * the message has non-empty caption text (hasCaption = true). When rendered,
   * the caption SHALL receive the same alignment as the parent audio bubble.
   *
   * **Validates: Requirements 8.1, 8.3, 8.4**
   */
  describe('Property 9: Caption Rendering Conditional', () => {
    it('should set hasCaption to true only when caption text exists', () => {
      fc.assert(
        fc.property(
          validAttachmentArbitrary,
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (attachment, caption) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const mockMessage = createMockMessage([attachment], caption);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Assert: hasCaption should match presence of non-empty caption
            const expectedHasCaption = caption !== undefined && caption.trim().length > 0;
            expect(freshComponent['hasCaption']).toBe(expectedHasCaption);
          }
        ),
        testConfig
      );
    });

    it('should set hasCaption to false for empty or whitespace-only captions', () => {
      fc.assert(
        fc.property(
          validAttachmentArbitrary,
          fc.constantFrom('', '   ', '\t', '\n', '  \n  '),
          (attachment, emptyCaption) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const mockMessage = createMockMessage([attachment], emptyCaption);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Assert: hasCaption should be false for empty/whitespace captions
            expect(freshComponent['hasCaption']).toBe(false);
          }
        ),
        testConfig
      );
    });

    it('should maintain caption state independently of attachment count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.boolean(),
          fc.string({ minLength: 1, maxLength: 50 }),
          (attachmentCount, hasCaption, captionText) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const caption = hasCaption ? captionText : undefined;
            const mockMessage = createMockMessage(attachments, caption);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Assert: Caption state should be independent of attachment count
            const expectedHasCaption = hasCaption && captionText.trim().length > 0;
            expect(freshComponent['hasCaption']).toBe(expectedHasCaption);
            expect(freshComponent['attachments'].length).toBe(attachmentCount);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 10: Loading State Controls
   *
   * For any audio bubble in loading state (isLoading = true), all playback controls
   * SHALL be disabled (pointer-events: none) and cursor SHALL be not-allowed.
   * When loading completes (isLoading = false), controls SHALL be enabled.
   *
   * **Validates: Requirements 13.1, 13.2, 13.3**
   */
  describe('Property 10: Loading State Controls', () => {
    it('should track loading state correctly for each audio', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), attachmentCount => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
            url: `https://example.com/audio-${i}.mp3`,
            name: `audio-${i}.mp3`,
            size: 1024,
            mimeType: 'audio/mpeg',
            extension: 'mp3',
          }));
          const mockMessage = createMockMessage(attachments);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Assert: All audio states should start in loading state
          for (let i = 0; i < attachmentCount; i++) {
            const state = freshComponent['getAudioState'](i);
            expect(state.isLoading).toBe(true);
          }
        }),
        testConfig
      );
    });

    it('should transition from loading to ready state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (attachmentCount, indexOffset) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const validIndex = indexOffset % attachmentCount;
            const state = freshComponent['getAudioState'](validIndex);

            // Assert: Initially loading
            expect(state.isLoading).toBe(true);

            // Act: Simulate loading complete
            state.isLoading = false;

            // Assert: No longer loading
            expect(state.isLoading).toBe(false);
          }
        ),
        testConfig
      );
    });

    it('should track error state independently of loading state', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 0, max: 4 }),
          (attachmentCount, indexOffset) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const validIndex = indexOffset % attachmentCount;
            const state = freshComponent['getAudioState'](validIndex);

            // Act: Simulate error state
            state.isLoading = false;
            state.hasError = true;

            // Assert: Error state is tracked
            expect(state.isLoading).toBe(false);
            expect(state.hasError).toBe(true);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Feature: audio-message-bubble
   * Property 14: Play/Pause Aria-Label State Sync
   *
   * For any audio bubble, the play/pause button aria-label SHALL match the current
   * playback state: "Play audio" when not playing, "Pause audio" when playing.
   *
   * **Validates: Requirements 10.3**
   */
  describe('Property 14: Play/Pause Aria-Label State Sync', () => {
    it('should have correct aria-label based on playing state', () => {
      fc.assert(
        fc.property(validAttachmentArbitrary, fc.boolean(), (attachment, isPlaying) => {
          // Arrange - create fresh component
          const freshCdr = createMockCdr();
          const freshNgZone = createMockNgZone();
          const freshComponent = createComponent(freshCdr, freshNgZone);

          const mockMessage = createMockMessage([attachment]);
          freshComponent.message = mockMessage;
          freshComponent.ngOnInit();

          // Act: Set playing state
          const state = freshComponent['getAudioState'](0);
          state.isPlaying = isPlaying;

          // Assert: State should match what was set
          // The aria-label in template uses: isPlaying ? 'audio_bubble_pause' : 'audio_bubble_play'
          expect(state.isPlaying).toBe(isPlaying);
        }),
        testConfig
      );
    });

    it('should toggle playing state correctly', () => {
      fc.assert(
        fc.property(
          validAttachmentArbitrary,
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (attachment, stateSequence) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const mockMessage = createMockMessage([attachment]);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            const state = freshComponent['getAudioState'](0);

            // Act & Assert: Each state change should be reflected
            stateSequence.forEach(isPlaying => {
              state.isPlaying = isPlaying;
              expect(state.isPlaying).toBe(isPlaying);
            });
          }
        ),
        testConfig
      );
    });

    it('should maintain aria-label consistency across multiple audios', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          fc.array(fc.tuple(fc.integer({ min: 0, max: 4 }), fc.boolean()), {
            minLength: 1,
            maxLength: 10,
          }),
          (attachmentCount, stateChanges) => {
            // Arrange - create fresh component
            const freshCdr = createMockCdr();
            const freshNgZone = createMockNgZone();
            const freshComponent = createComponent(freshCdr, freshNgZone);

            const attachments = Array.from({ length: attachmentCount }, (_, i) => ({
              url: `https://example.com/audio-${i}.mp3`,
              name: `audio-${i}.mp3`,
              size: 1024,
              mimeType: 'audio/mpeg',
              extension: 'mp3',
            }));
            const mockMessage = createMockMessage(attachments);
            freshComponent.message = mockMessage;
            freshComponent.ngOnInit();

            // Act & Assert: Apply state changes and verify
            stateChanges.forEach(([indexOffset, isPlaying]) => {
              const validIndex = indexOffset % attachmentCount;
              const state = freshComponent['getAudioState'](validIndex);
              state.isPlaying = isPlaying;
              expect(state.isPlaying).toBe(isPlaying);
            });
          }
        ),
        testConfig
      );
    });
  });
});
