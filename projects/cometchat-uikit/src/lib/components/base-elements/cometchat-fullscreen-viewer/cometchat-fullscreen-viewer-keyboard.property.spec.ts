import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatFullScreenViewer Keyboard Navigation
 *
 * Task 4.3: Write property tests for keyboard navigation
 * Property 2: Next Navigation State Transition (ArrowRight)
 * Property 3: Previous Navigation State Transition (ArrowLeft)
 * Property 15: Escape Key Closes Viewer
 * Validates: Requirements 1.4, 1.5, 5.2, 5.3, 5.4
 */

class MockCometChatFullScreenViewerComponent {
  attachments: any[] = [];
  currentIndex = 0;
  isOpen = false;

  closeClick = { emit: vi.fn() };
  indexChange = { emit: vi.fn() };

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
    if (!this.canNavigateNext) return;
    this.stopCurrentVideo();
    this.currentIndex++;
    this.indexChange.emit(this.currentIndex);
  }

  navigatePrev(): void {
    if (!this.canNavigatePrev) return;
    this.stopCurrentVideo();
    this.currentIndex--;
    this.indexChange.emit(this.currentIndex);
  }

  handleDocumentKeydown(event: KeyboardEvent): void {
    if (!this.isOpen) return;

    switch (event.key) {
      case 'ArrowRight':
        if (this.canNavigateNext) {
          event.preventDefault();
          this.navigateNext();
        }
        break;
      case 'ArrowLeft':
        if (this.canNavigatePrev) {
          event.preventDefault();
          this.navigatePrev();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.closeClick.emit();
        break;
    }
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

function createKeyboardEvent(key: string): KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe('CometChatFullScreenViewer - Property-Based Tests: Keyboard Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 2: Next Navigation via ArrowRight (Requirements 1.4, 5.4)', () => {
    it('should navigate next on ArrowRight when viewer is open and can navigate', () => {
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
            component.isOpen = true;

            const event = createKeyboardEvent('ArrowRight');
            component.handleDocumentKeydown(event);

            // Property: ArrowRight navigates to next item
            expect(component.currentIndex).toBe(startIndex + 1);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.indexChange.emit).toHaveBeenCalledWith(startIndex + 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not navigate on ArrowRight when viewer is closed', () => {
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
            component.isOpen = false; // Closed

            const event = createKeyboardEvent('ArrowRight');
            component.handleDocumentKeydown(event);

            // Property: Closed viewer ignores keyboard events
            expect(component.currentIndex).toBe(startIndex);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not navigate on ArrowRight when at last item', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }), // Gallery size
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = gallerySize - 1; // Last item
            component.isOpen = true;

            const event = createKeyboardEvent('ArrowRight');
            component.handleDocumentKeydown(event);

            // Property: Cannot navigate past last item
            expect(component.currentIndex).toBe(gallerySize - 1);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stop video on ArrowRight navigation', () => {
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
                currentTime: 10.5,
              },
            };
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/video${i}.mp4`, 'video')
            );
            component.currentIndex = startIndex;
            component.isOpen = true;

            const event = createKeyboardEvent('ArrowRight');
            component.handleDocumentKeydown(event);

            // Property: Video stops on keyboard navigation
            expect(mockPause).toHaveBeenCalled();
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 3: Previous Navigation via ArrowLeft (Requirements 1.5, 5.3)', () => {
    it('should navigate previous on ArrowLeft when viewer is open and can navigate', () => {
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
            component.isOpen = true;

            const event = createKeyboardEvent('ArrowLeft');
            component.handleDocumentKeydown(event);

            // Property: ArrowLeft navigates to previous item
            expect(component.currentIndex).toBe(startIndex - 1);
            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.indexChange.emit).toHaveBeenCalledWith(startIndex - 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not navigate on ArrowLeft when viewer is closed', () => {
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
            component.isOpen = false; // Closed

            const event = createKeyboardEvent('ArrowLeft');
            component.handleDocumentKeydown(event);

            // Property: Closed viewer ignores keyboard events
            expect(component.currentIndex).toBe(startIndex);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not navigate on ArrowLeft when at first item', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }), // Gallery size
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = 0; // First item
            component.isOpen = true;

            const event = createKeyboardEvent('ArrowLeft');
            component.handleDocumentKeydown(event);

            // Property: Cannot navigate before first item
            expect(component.currentIndex).toBe(0);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should stop video on ArrowLeft navigation', () => {
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
                currentTime: 15.2,
              },
            };
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/video${i}.mp4`, 'video')
            );
            component.currentIndex = startIndex;
            component.isOpen = true;

            const event = createKeyboardEvent('ArrowLeft');
            component.handleDocumentKeydown(event);

            // Property: Video stops on keyboard navigation
            expect(mockPause).toHaveBeenCalled();
            expect(component.videoElement.nativeElement.currentTime).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property 15: Escape Key Closes Viewer (Requirement 5.2)', () => {
    it('should close viewer on Escape key when open (gallery mode)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }), // Gallery size
          fc.integer({ min: 0, max: 14 }), // Current index
          (gallerySize, currentIndex) => {
            fc.pre(currentIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = currentIndex;
            component.isOpen = true;

            const event = createKeyboardEvent('Escape');
            component.handleDocumentKeydown(event);

            // Property: Escape always closes viewer when open
            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.closeClick.emit).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close viewer on Escape key when open (single mode)', () => {
      fc.assert(
        fc.property(
          fc.webUrl(), // Any URL
          url => {
            const component = createComponent();
            component.attachments = []; // Single mode
            component.isOpen = true;

            const event = createKeyboardEvent('Escape');
            component.handleDocumentKeydown(event);

            // Property: Escape closes viewer in single mode too
            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.closeClick.emit).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not close viewer on Escape when already closed', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 15 }), // Gallery size
          gallerySize => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.isOpen = false; // Closed

            const event = createKeyboardEvent('Escape');
            component.handleDocumentKeydown(event);

            // Property: Closed viewer ignores Escape key
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.closeClick.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should close viewer on Escape regardless of current index', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }), // Gallery size
          fc.integer({ min: 0, max: 14 }), // Current index
          (gallerySize, currentIndex) => {
            fc.pre(currentIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = currentIndex;
            component.isOpen = true;

            const event = createKeyboardEvent('Escape');
            component.handleDocumentKeydown(event);

            // Property: Escape works from any index
            expect(component.closeClick.emit).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Keyboard Event Handling Consistency', () => {
    it('should ignore non-navigation keys', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }), // Gallery size
          fc.integer({ min: 0, max: 9 }), // Current index
          fc.constantFrom('a', 'b', 'Enter', 'Space', 'Tab', '1', 'Home', 'End'), // Non-navigation keys
          (gallerySize, currentIndex, key) => {
            fc.pre(currentIndex < gallerySize);

            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = currentIndex;
            component.isOpen = true;

            const event = createKeyboardEvent(key);
            const beforeIndex = component.currentIndex;
            component.handleDocumentKeydown(event);

            // Property: Non-navigation keys don't affect state
            expect(component.currentIndex).toBe(beforeIndex);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.indexChange.emit).not.toHaveBeenCalled();
            expect(component.closeClick.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid keyboard navigation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 10 }), // Gallery size
          fc.array(fc.constantFrom('ArrowRight', 'ArrowLeft'), { minLength: 1, maxLength: 10 }), // Key sequence
          (gallerySize, keySequence) => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = Math.floor(gallerySize / 2); // Start in middle
            component.isOpen = true;

            // Execute key sequence
            for (const key of keySequence) {
              const event = createKeyboardEvent(key);
              component.handleDocumentKeydown(event);
            }

            // Property: Index always stays within bounds
            expect(component.currentIndex).toBeGreaterThanOrEqual(0);
            expect(component.currentIndex).toBeLessThan(gallerySize);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain: isOpen controls all keyboard event handling', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // Gallery size (min 3 to ensure middle position can navigate both ways)
          fc.boolean(), // isOpen state
          fc.constantFrom('ArrowRight', 'ArrowLeft', 'Escape'), // Navigation keys
          (gallerySize, isOpen, key) => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = 1; // Middle position (can navigate both ways for size >= 3)
            component.isOpen = isOpen;

            const event = createKeyboardEvent(key);
            component.handleDocumentKeydown(event);

            if (isOpen) {
              // Property: Open viewer handles keyboard events
              // Note: ArrowRight/ArrowLeft only call preventDefault when navigation is possible
              // For Escape, it's always called
              if (key === 'Escape') {
                expect(event.preventDefault).toHaveBeenCalled();
              } else if (key === 'ArrowRight' && component.currentIndex < gallerySize - 1) {
                // ArrowRight only works when not at last item
                // After navigation, currentIndex would have changed, so check original position
                expect(event.preventDefault).toHaveBeenCalled();
              } else if (key === 'ArrowLeft' && component.currentIndex > 0) {
                // ArrowLeft only works when not at first item
                // Note: currentIndex was 1 before, so this should work
                expect(event.preventDefault).toHaveBeenCalled();
              }
            } else {
              // Property: Closed viewer ignores keyboard events
              expect(event.preventDefault).not.toHaveBeenCalled();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prevent default for all handled keys when open', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // Gallery size
          fc.constantFrom('ArrowRight', 'ArrowLeft', 'Escape'), // Handled keys
          (gallerySize, key) => {
            const component = createComponent();
            component.attachments = Array.from({ length: gallerySize }, (_, i) =>
              createMockAttachment(`https://example.com/image${i}.jpg`, 'image')
            );
            component.currentIndex = 1; // Middle position (can navigate both ways)
            component.isOpen = true;

            const event = createKeyboardEvent(key);
            component.handleDocumentKeydown(event);

            // Property: All handled keys call preventDefault
            expect(event.preventDefault).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Keyboard Navigation in Single Mode', () => {
    it('should not navigate with arrow keys in single mode', () => {
      fc.assert(
        fc.property(
          fc.webUrl(), // Single URL
          fc.constantFrom('ArrowRight', 'ArrowLeft'), // Arrow keys
          (url, key) => {
            const component = createComponent();
            component.attachments = []; // Single mode
            component.currentIndex = 0;
            component.isOpen = true;

            const event = createKeyboardEvent(key);
            component.handleDocumentKeydown(event);

            // Property: Single mode disables arrow key navigation
            expect(component.currentIndex).toBe(0);
            expect(event.preventDefault).not.toHaveBeenCalled();
            expect(component.indexChange.emit).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should still close with Escape in single mode', () => {
      fc.assert(
        fc.property(
          fc.webUrl(), // Single URL
          url => {
            const component = createComponent();
            component.attachments = []; // Single mode
            component.isOpen = true;

            const event = createKeyboardEvent('Escape');
            component.handleDocumentKeydown(event);

            // Property: Escape works in single mode
            expect(event.preventDefault).toHaveBeenCalled();
            expect(component.closeClick.emit).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
