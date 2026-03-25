import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatFullScreenViewer Navigation State Transitions
 *
 * Task 3.6: Write property tests for navigation state transitions
 * Property 2: Next Navigation State Transition
 * Property 3: Previous Navigation State Transition
 * Property 4: Navigation Button State Invariants
 * Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

// Mock component class for property testing
class MockCometChatFullScreenViewerComponent {
  attachments: any[] = [];
  currentIndex = 0;
  isOpen = false;

  indexChange = {
    emit: vi.fn(),
  };

  videoElement?: {
    nativeElement: {
      pause: () => void;
      currentTime: number;
    };
  };

  get isGalleryMode(): boolean {
    return this.attachments && this.attachments.length > 0;
  }

  get canNavigatePrev(): boolean {
    return this.isGalleryMode && this.currentIndex > 0;
  }

  get canNavigateNext(): boolean {
    return this.isGalleryMode && this.currentIndex < this.attachments.length - 1;
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

  private stopCurrentVideo(): void {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.pause();
      this.videoElement.nativeElement.currentTime = 0;
    }
  }
}

function createComponent(): MockCometChatFullScreenViewerComponent {
  return new MockCometChatFullScreenViewerComponent();
}

function createMockAttachment(url: string, type: 'image' | 'video'): any {
  return { url, type, name: `${type}.${type === 'image' ? 'jpg' : 'mp4'}` };
}

describe('CometChatFullScreenViewer - Property-Based Tests: Navigation State Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 2: Next Navigation State Transition (Requirements 1.2, 1.4)', () => {
    it('should increment currentIndex by exactly 1 when navigating next', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // Gallery size
          fc.integer({ min: 0, max: 18 }), // Starting index (not last)
          (gallerySize, startIndex) => {
            fc.pre(startIndex < gallerySize - 1); // Ensure we can navigate next

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            const beforeIndex = component.currentIndex;
            component.navigateNext();
            const afterIndex = component.currentIndex;

            // Property: Next navigation increments index by exactly 1
            expect(afterIndex).toBe(beforeIndex + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit indexChange event with new index after next navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 15 }), // Gallery size
          fc.integer({ min: 0, max: 13 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex < gallerySize - 1);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            component.navigateNext();

            // Property: indexChange emitted with new index
            expect(component.indexChange.emit).toHaveBeenCalledWith(startIndex + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change index when at last item', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }), // Gallery size
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = gallerySize - 1; // Last index

            const beforeIndex = component.currentIndex;
            component.navigateNext();

            // Property: Cannot navigate past last item
            expect(component.currentIndex).toBe(beforeIndex);
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain invariant: 0 <= currentIndex < length after next navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 30 }), // Gallery size
          fc.integer({ min: 0, max: 28 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex < gallerySize - 1);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            component.navigateNext();

            // Property: Index always within valid bounds
            expect(component.currentIndex).toBeGreaterThanOrEqual(0);
            expect(component.currentIndex).toBeLessThan(gallerySize);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Property 3: Previous Navigation State Transition (Requirements 1.3, 1.5)', () => {
    it('should decrement currentIndex by exactly 1 when navigating previous', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // Gallery size
          fc.integer({ min: 1, max: 19 }), // Starting index (not first)
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            const beforeIndex = component.currentIndex;
            component.navigatePrev();
            const afterIndex = component.currentIndex;

            // Property: Previous navigation decrements index by exactly 1
            expect(afterIndex).toBe(beforeIndex - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should emit indexChange event with new index after previous navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 15 }), // Gallery size
          fc.integer({ min: 1, max: 14 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            component.navigatePrev();

            // Property: indexChange emitted with new index
            expect(component.indexChange.emit).toHaveBeenCalledWith(startIndex - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not change index when at first item', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }), // Gallery size
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = 0; // First index

            const beforeIndex = component.currentIndex;
            component.navigatePrev();

            // Property: Cannot navigate before first item
            expect(component.currentIndex).toBe(beforeIndex);
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain invariant: 0 <= currentIndex < length after previous navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 30 }), // Gallery size
          fc.integer({ min: 1, max: 29 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            component.navigatePrev();

            // Property: Index always within valid bounds
            expect(component.currentIndex).toBeGreaterThanOrEqual(0);
            expect(component.currentIndex).toBeLessThan(gallerySize);
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Property 4: Navigation Button State Invariants (Requirements 1.6, 1.7)', () => {
    it('should maintain: canNavigatePrev === (currentIndex > 0)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }), // Gallery size
          fc.integer({ min: 0, max: 19 }), // Current index
          (gallerySize, currentIndex) => {
            fc.pre(currentIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = currentIndex;

            // Property: canNavigatePrev exactly matches (currentIndex > 0)
            expect(component.canNavigatePrev).toBe(currentIndex > 0);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('should maintain: canNavigateNext === (currentIndex < length - 1)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }), // Gallery size
          fc.integer({ min: 0, max: 19 }), // Current index
          (gallerySize, currentIndex) => {
            fc.pre(currentIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = currentIndex;

            // Property: canNavigateNext exactly matches (currentIndex < length - 1)
            expect(component.canNavigateNext).toBe(currentIndex < gallerySize - 1);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('should maintain: at first index => !canNavigatePrev && canNavigateNext (for length > 1)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // Gallery size (at least 2)
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = 0;

            // Property: At first index, can only navigate next
            expect(component.canNavigatePrev).toBe(false);
            expect(component.canNavigateNext).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain: at last index => canNavigatePrev && !canNavigateNext (for length > 1)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // Gallery size (at least 2)
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = gallerySize - 1;

            // Property: At last index, can only navigate previous
            expect(component.canNavigatePrev).toBe(true);
            expect(component.canNavigateNext).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain: at middle index => canNavigatePrev && canNavigateNext', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 20 }), // Gallery size (at least 3 for middle)
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );

            // Test all middle indices
            for (let i = 1; i < gallerySize - 1; i++) {
              component.currentIndex = i;

              // Property: At middle index, can navigate both directions
              expect(component.canNavigatePrev).toBe(true);
              expect(component.canNavigateNext).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain: single-item gallery => !canNavigatePrev && !canNavigateNext', () => {
      const component = createComponent();
      component.attachments = [createMockAttachment('https://example.com/image.jpg', 'image')];
      component.currentIndex = 0;

      // Property: Single-item gallery disables all navigation
      expect(component.canNavigatePrev).toBe(false);
      expect(component.canNavigateNext).toBe(false);
    });

    it('should update navigation state after next navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }), // Gallery size (at least 3)
          fc.integer({ min: 0, max: 12 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex < gallerySize - 1);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            const beforeCanPrev = component.canNavigatePrev;
            const beforeCanNext = component.canNavigateNext;

            component.navigateNext();

            const afterCanPrev = component.canNavigatePrev;
            const afterCanNext = component.canNavigateNext;

            // Property: Navigation state updates correctly after transition
            expect(afterCanPrev).toBe(component.currentIndex > 0);
            expect(afterCanNext).toBe(component.currentIndex < gallerySize - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update navigation state after previous navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }), // Gallery size (at least 3)
          fc.integer({ min: 1, max: 14 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            component.navigatePrev();

            // Property: Navigation state updates correctly after transition
            expect(component.canNavigatePrev).toBe(component.currentIndex > 0);
            expect(component.canNavigateNext).toBe(component.currentIndex < gallerySize - 1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Navigation Sequence Consistency', () => {
    it('should maintain: next then prev returns to original index', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }), // Gallery size
          fc.integer({ min: 1, max: 13 }), // Starting index (not first or last)
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize - 1);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            const originalIndex = component.currentIndex;
            component.navigateNext();
            component.navigatePrev();

            // Property: Round-trip navigation returns to original
            expect(component.currentIndex).toBe(originalIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain: prev then next returns to original index', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }), // Gallery size
          fc.integer({ min: 1, max: 13 }), // Starting index (not first or last)
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize - 1);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = startIndex;

            const originalIndex = component.currentIndex;
            component.navigatePrev();
            component.navigateNext();

            // Property: Round-trip navigation returns to original
            expect(component.currentIndex).toBe(originalIndex);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reach any valid index through sequence of next navigations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Gallery size
          fc.integer({ min: 0, max: 9 }), // Target index
          (gallerySize, targetIndex) => {
            fc.pre(targetIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = 0;

            // Navigate to target
            for (let i = 0; i < targetIndex; i++) {
              component.navigateNext();
            }

            // Property: Can reach any index through navigation
            expect(component.currentIndex).toBe(targetIndex);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reach any valid index through sequence of prev navigations', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Gallery size
          fc.integer({ min: 0, max: 9 }), // Target index
          (gallerySize, targetIndex) => {
            fc.pre(targetIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = gallerySize - 1;

            // Navigate to target
            const steps = gallerySize - 1 - targetIndex;
            for (let i = 0; i < steps; i++) {
              component.navigatePrev();
            }

            // Property: Can reach any index through navigation
            expect(component.currentIndex).toBe(targetIndex);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Video Playback Control During Navigation', () => {
    it('should stop video when navigating next', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Gallery size
          fc.integer({ min: 0, max: 8 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex < gallerySize - 1);

            const component = createComponent();
            const mockPause = vi.fn();
            component.videoElement = {
              nativeElement: {
                pause: mockPause,
                currentTime: 15.5,
              },
            };
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/video${i}.mp4`, 'video')
            );
            component.currentIndex = startIndex;

            component.navigateNext();

            // Property: Video stops on navigation
            expect(mockPause).toHaveBeenCalled();
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should stop video when navigating previous', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Gallery size
          fc.integer({ min: 1, max: 9 }), // Starting index
          (gallerySize, startIndex) => {
            fc.pre(startIndex > 0 && startIndex < gallerySize);

            const component = createComponent();
            const mockPause = vi.fn();
            component.videoElement = {
              nativeElement: {
                pause: mockPause,
                currentTime: 20.3,
              },
            };
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/video${i}.mp4`, 'video')
            );
            component.currentIndex = startIndex;

            component.navigatePrev();

            // Property: Video stops on navigation
            expect(mockPause).toHaveBeenCalled();
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
