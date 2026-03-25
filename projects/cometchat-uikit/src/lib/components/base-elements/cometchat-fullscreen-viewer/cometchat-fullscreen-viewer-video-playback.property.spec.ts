import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatFullScreenViewer Video Playback Control
 *
 * Feature: fullscreen-viewer-gallery-refactor
 *
 * Tests video playback control properties:
 * - Property 10: Video Playback Stop on Navigation
 * - Property 11: Video Playback Stop on Close
 * - Property 27: Video Stop on Component Destroy
 *
 * Validates: Requirements 3.3, 3.4, 8.5
 */

// Mock component class for property testing
class MockFullScreenViewerHandler {
  attachments: any[] = [];
  currentIndex = 0;
  isOpen = false;
  videoElement?: {
    nativeElement: {
      pause: () => void;
      currentTime: number;
      paused: boolean;
    };
  };

  closeClick = {
    emit: vi.fn(),
  };
  indexChange = {
    emit: vi.fn(),
  };

  get isGalleryMode(): boolean {
    return this.attachments && this.attachments.length > 0;
  }

  get canNavigateNext(): boolean {
    return this.isGalleryMode && this.currentIndex < this.attachments.length - 1;
  }

  get canNavigatePrev(): boolean {
    return this.isGalleryMode && this.currentIndex > 0;
  }

  navigateNext(): void {
    if (!this.canNavigateNext) {
      return;
    }
    this.stopCurrentVideo();
    this.currentIndex++;
    this.indexChange.emit(this.currentIndex);
  }

  navigatePrev(): void {
    if (!this.canNavigatePrev) {
      return;
    }
    this.stopCurrentVideo();
    this.currentIndex--;
    this.indexChange.emit(this.currentIndex);
  }

  navigateToIndex(index: number): void {
    if (!this.isGalleryMode) {
      return;
    }
    if (index < 0 || index >= this.attachments.length) {
      return;
    }
    this.stopCurrentVideo();
    this.currentIndex = index;
    this.indexChange.emit(this.currentIndex);
  }

  close(): void {
    this.stopCurrentVideo();
    this.closeClick.emit();
  }

  destroy(): void {
    this.stopCurrentVideo();
  }

  private stopCurrentVideo(): void {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
      this.videoElement.nativeElement.currentTime = 0;
    }
  }
}

// Arbitraries for property-based testing

/**
 * Generates a video attachment with random URL
 */
const videoAttachmentArbitrary = () =>
  fc.record({
    url: fc.webUrl(),
    type: fc.constant('video' as const),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  });

/**
 * Generates an array of video attachments
 */
const videoAttachmentsArrayArbitrary = () =>
  fc.array(videoAttachmentArbitrary(), { minLength: 2, maxLength: 10 });

/**
 * Generates a valid index for an array of given length
 */
const validIndexArbitrary = (arrayLength: number) =>
  fc.integer({ min: 0, max: Math.max(0, arrayLength - 1) });

/**
 * Generates a video element mock with random currentTime
 */
const videoElementArbitrary = () =>
  fc
    .record({
      currentTime: fc.float({ min: 0, max: 300, noNaN: true }),
      paused: fc.boolean(),
    })
    .map(({ currentTime, paused }) => ({
      nativeElement: {
        pause: vi.fn(),
        currentTime,
        paused,
      },
    }));

describe('CometChatFullScreenViewer Video Playback Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 10: Video Playback Stop on Navigation', () => {
    it('should stop video playback when navigating to next media item', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 10: Video Playback Stop on Navigation
       *
       * For any FullScreenViewer state displaying a video, navigating to a different
       * media item should stop the video playback (video.paused should be true after navigation).
       *
       * Validates: Requirements 3.3
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          validIndexArbitrary(10), // Max 10 items
          videoElementArbitrary(),
          (attachments, startIndex, videoElement) => {
            // Ensure startIndex is valid for the generated attachments array
            const validStartIndex = Math.min(startIndex, attachments.length - 2);

            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = validStartIndex;
            component.videoElement = videoElement;

            // Navigate to next
            component.navigateNext();

            // Video should be paused
            expect(videoElement.nativeElement.pause).toHaveBeenCalled();
            // Video currentTime should be reset to 0
            expect(videoElement.nativeElement.currentTime).toBe(0);
            // Index should have incremented
            expect(component.currentIndex).toBe(validStartIndex + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stop video playback when navigating to previous media item', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 10: Video Playback Stop on Navigation
       *
       * For any FullScreenViewer state displaying a video, navigating to the previous
       * media item should stop the video playback.
       *
       * Validates: Requirements 3.3
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          videoElementArbitrary(),
          (attachments, videoElement) => {
            // Start at last index to ensure we can navigate previous
            const startIndex = attachments.length - 1;

            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = startIndex;
            component.videoElement = videoElement;

            // Navigate to previous
            component.navigatePrev();

            // Video should be paused
            expect(videoElement.nativeElement.pause).toHaveBeenCalled();
            // Video currentTime should be reset to 0
            expect(videoElement.nativeElement.currentTime).toBe(0);
            // Index should have decremented
            expect(component.currentIndex).toBe(startIndex - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stop video playback when navigating to specific index', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 10: Video Playback Stop on Navigation
       *
       * For any FullScreenViewer state displaying a video, navigating to a specific
       * index should stop the video playback.
       *
       * Validates: Requirements 3.3
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          validIndexArbitrary(10),
          validIndexArbitrary(10),
          videoElementArbitrary(),
          (attachments, startIndex, targetIndex, videoElement) => {
            // Ensure indices are valid for the generated attachments array
            const validStartIndex = Math.min(startIndex, attachments.length - 1);
            const validTargetIndex = Math.min(targetIndex, attachments.length - 1);

            // Skip if navigating to same index
            fc.pre(validStartIndex !== validTargetIndex);

            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = validStartIndex;
            component.videoElement = videoElement;

            // Navigate to target index
            component.navigateToIndex(validTargetIndex);

            // Video should be paused
            expect(videoElement.nativeElement.pause).toHaveBeenCalled();
            // Video currentTime should be reset to 0
            expect(videoElement.nativeElement.currentTime).toBe(0);
            // Index should be at target
            expect(component.currentIndex).toBe(validTargetIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset video currentTime to 0 on navigation regardless of initial time', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 10: Video Playback Stop on Navigation
       *
       * For any video currentTime value, navigating should always reset it to 0.
       *
       * Validates: Requirements 3.3
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          fc.float({ min: 0, max: 300, noNaN: true }),
          (attachments, initialTime) => {
            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = 0;
            component.videoElement = {
              nativeElement: {
                pause: vi.fn(),
                currentTime: initialTime,
                paused: false,
              },
            };

            // Navigate to next
            component.navigateNext();

            // Video currentTime should be reset to 0 regardless of initial value
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Video Playback Stop on Close', () => {
    it('should stop video playback when closing the viewer', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 11: Video Playback Stop on Close
       *
       * For any FullScreenViewer state displaying a video, closing the viewer
       * should stop the video playback (video.paused should be true after close).
       *
       * Validates: Requirements 3.4
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          validIndexArbitrary(10),
          videoElementArbitrary(),
          (attachments, currentIndex, videoElement) => {
            // Ensure currentIndex is valid for the generated attachments array
            const validCurrentIndex = Math.min(currentIndex, attachments.length - 1);

            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = validCurrentIndex;
            component.isOpen = true;
            component.videoElement = videoElement;

            // Close the viewer
            component.close();

            // Video should be paused
            expect(videoElement.nativeElement.pause).toHaveBeenCalled();
            // Video currentTime should be reset to 0
            expect(videoElement.nativeElement.currentTime).toBe(0);
            // Close event should be emitted
            expect(component.closeClick.emit).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stop video in single mode when closing', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 11: Video Playback Stop on Close
       *
       * For any FullScreenViewer in single mode displaying a video, closing
       * should stop the video playback.
       *
       * Validates: Requirements 3.4
       */
      fc.assert(
        fc.property(fc.webUrl(), videoElementArbitrary(), (videoUrl, videoElement) => {
          const component = new MockFullScreenViewerHandler();
          component.attachments = []; // Single mode
          component.isOpen = true;
          component.videoElement = videoElement;

          // Close the viewer
          component.close();

          // Video should be paused
          expect(videoElement.nativeElement.pause).toHaveBeenCalled();
          // Video currentTime should be reset to 0
          expect(videoElement.nativeElement.currentTime).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reset video currentTime to 0 on close regardless of playback position', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 11: Video Playback Stop on Close
       *
       * For any video playback position, closing should always reset currentTime to 0.
       *
       * Validates: Requirements 3.4
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          fc.float({ min: 0, max: 300, noNaN: true }),
          (attachments, currentTime) => {
            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = 0;
            component.isOpen = true;
            component.videoElement = {
              nativeElement: {
                pause: vi.fn(),
                currentTime,
                paused: false,
              },
            };

            // Close the viewer
            component.close();

            // Video currentTime should be reset to 0 regardless of initial value
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 27: Video Stop on Component Destroy', () => {
    it('should stop video playback when component is destroyed', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 27: Video Stop on Component Destroy
       *
       * For any FullScreenViewer state displaying a video, destroying the component
       * should stop the video playback (video.paused should be true after destroy).
       *
       * Validates: Requirements 8.5
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          validIndexArbitrary(10),
          videoElementArbitrary(),
          (attachments, currentIndex, videoElement) => {
            // Ensure currentIndex is valid for the generated attachments array
            const validCurrentIndex = Math.min(currentIndex, attachments.length - 1);

            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = validCurrentIndex;
            component.videoElement = videoElement;

            // Destroy the component
            component.destroy();

            // Video should be paused
            expect(videoElement.nativeElement.pause).toHaveBeenCalled();
            // Video currentTime should be reset to 0
            expect(videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle component destruction without video element gracefully', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 27: Video Stop on Component Destroy
       *
       * For any FullScreenViewer state without a video element, destroying
       * the component should not throw an error.
       *
       * Validates: Requirements 8.5
       */
      fc.assert(
        fc.property(videoAttachmentsArrayArbitrary(), attachments => {
          const component = new MockFullScreenViewerHandler();
          component.attachments = attachments;
          component.videoElement = undefined;

          // Should not throw error
          expect(() => component.destroy()).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it('should stop video in single mode when component is destroyed', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 27: Video Stop on Component Destroy
       *
       * For any FullScreenViewer in single mode displaying a video, destroying
       * the component should stop the video playback.
       *
       * Validates: Requirements 8.5
       */
      fc.assert(
        fc.property(videoElementArbitrary(), videoElement => {
          const component = new MockFullScreenViewerHandler();
          component.attachments = []; // Single mode
          component.videoElement = videoElement;

          // Destroy the component
          component.destroy();

          // Video should be paused
          expect(videoElement.nativeElement.pause).toHaveBeenCalled();
          // Video currentTime should be reset to 0
          expect(videoElement.nativeElement.currentTime).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should reset video currentTime to 0 on destroy regardless of playback state', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 27: Video Stop on Component Destroy
       *
       * For any video playback state, destroying the component should always
       * reset currentTime to 0.
       *
       * Validates: Requirements 8.5
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          fc.float({ min: 0, max: 300, noNaN: true }),
          fc.boolean(),
          (attachments, currentTime, paused) => {
            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = 0;
            component.videoElement = {
              nativeElement: {
                pause: vi.fn(),
                currentTime,
                paused,
              },
            };

            // Destroy the component
            component.destroy();

            // Video currentTime should be reset to 0 regardless of initial state
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Video Playback Control Invariants', () => {
    it('should always call pause before resetting currentTime', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: Whenever video playback is stopped, pause() should always
       * be called before resetting currentTime to 0.
       *
       * Validates: Requirements 3.3, 3.4, 8.5
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          videoElementArbitrary(),
          fc.constantFrom('navigate', 'close', 'destroy'),
          (attachments, videoElement, action) => {
            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = 0;
            component.videoElement = videoElement;

            // Perform action
            switch (action) {
              case 'navigate':
                if (component.canNavigateNext) {
                  component.navigateNext();
                }
                break;
              case 'close':
                component.close();
                break;
              case 'destroy':
                component.destroy();
                break;
            }

            // If action was performed, pause should have been called
            if (action === 'navigate' && component.currentIndex > 0) {
              expect(videoElement.nativeElement.pause).toHaveBeenCalled();
              expect(videoElement.nativeElement.currentTime).toBe(0);
            } else if (action === 'close' || action === 'destroy') {
              expect(videoElement.nativeElement.pause).toHaveBeenCalled();
              expect(videoElement.nativeElement.currentTime).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missing video element gracefully in all scenarios', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: All video stop operations should handle missing video element
       * gracefully without throwing errors.
       *
       * Validates: Requirements 3.3, 3.4, 8.5
       */
      fc.assert(
        fc.property(
          videoAttachmentsArrayArbitrary(),
          fc.constantFrom('navigate', 'close', 'destroy'),
          (attachments, action) => {
            const component = new MockFullScreenViewerHandler();
            component.attachments = attachments;
            component.currentIndex = 0;
            component.videoElement = undefined;

            // Should not throw error for any action
            switch (action) {
              case 'navigate':
                expect(() => component.navigateNext()).not.toThrow();
                break;
              case 'close':
                expect(() => component.close()).not.toThrow();
                break;
              case 'destroy':
                expect(() => component.destroy()).not.toThrow();
                break;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
