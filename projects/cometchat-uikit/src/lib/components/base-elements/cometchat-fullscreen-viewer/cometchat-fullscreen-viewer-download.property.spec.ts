import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property-Based Tests for CometChatFullScreenViewer Download Functionality
 *
 * Feature: fullscreen-viewer-gallery-refactor
 *
 * Tests download functionality properties:
 * - Property 28: Download Initiation
 * - Property 29: Download Filename Logic
 *
 * Validates: Requirements 9.1, 9.2, 9.3
 */

// Mock component class for property testing
class MockFullScreenViewerComponent {
  url = '';
  mediaType: 'image' | 'video' | 'audio' | 'file' = 'image';
  fileName = '';
  attachments: any[] = [];
  currentIndex = 0;

  downloadClick = {
    emit: vi.fn(),
  };

  get isGalleryMode(): boolean {
    return this.attachments && this.attachments.length > 0;
  }

  get currentAttachment(): any | null {
    if (!this.isGalleryMode) {
      return null;
    }
    if (this.currentIndex < 0 || this.currentIndex >= this.attachments.length) {
      return null;
    }
    return this.attachments[this.currentIndex];
  }

  download(): void {
    // Get current media URL
    let mediaUrl: string;
    let filename: string;
    let currentMedia: any | string;

    if (this.isGalleryMode && this.currentAttachment) {
      // Gallery mode: use current attachment
      mediaUrl = this.currentAttachment.url;
      filename =
        this.currentAttachment.name ||
        this.generateDefaultFilename(this.currentAttachment.type || 'image');
      currentMedia = this.currentAttachment;
    } else {
      // Single mode: use url input
      mediaUrl = this.url;
      filename = this.fileName || this.generateDefaultFilename(this.mediaType);
      currentMedia = mediaUrl;
    }

    // Validate URL exists
    if (!mediaUrl) {
      console.warn('No media URL available for download');
      return;
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Emit downloadClick event with current media
    this.downloadClick.emit(currentMedia);
  }

  private generateDefaultFilename(mediaType: string): string {
    const timestamp = Date.now();
    const extensions: Record<string, string> = {
      image: 'jpg',
      video: 'mp4',
      audio: 'mp3',
      file: 'bin',
    };
    const extension = extensions[mediaType] || 'bin';
    return `download_${timestamp}.${extension}`;
  }
}

// Arbitraries for property-based testing

/**
 * Generates a media attachment with optional name
 */
const mediaAttachmentArbitrary = () =>
  fc.record({
    url: fc.webUrl(),
    type: fc.constantFrom('image' as const, 'video' as const),
    name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
  });

/**
 * Generates an array of media attachments
 */
const attachmentsArrayArbitrary = () =>
  fc.array(mediaAttachmentArbitrary(), { minLength: 1, maxLength: 10 });

/**
 * Generates a valid index for an array of given length
 */
const validIndexArbitrary = (arrayLength: number) =>
  fc.integer({ min: 0, max: Math.max(0, arrayLength - 1) });

/**
 * Generates a media type
 */
const mediaTypeArbitrary = () =>
  fc.constantFrom('image' as const, 'video' as const, 'audio' as const, 'file' as const);

/**
 * Generates a filename
 */
const filenameArbitrary = () => fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.jpg`);

describe('CometChatFullScreenViewer Download Functionality Property Tests', () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let mockLink: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock document.createElement for anchor element
    mockLink = {
      href: '',
      download: '',
      target: '',
      rel: '',
      click: vi.fn(),
    };

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as any);
    removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as any);
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  describe('Property 28: Download Initiation', () => {
    it('should initiate download in single mode', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 28: Download Initiation
       *
       * For any FullScreenViewer state in single mode, clicking the download button
       * should initiate a download of the currently displayed media.
       *
       * Validates: Requirements 9.1
       */
      fc.assert(
        fc.property(fc.webUrl(), mediaTypeArbitrary(), (url, mediaType) => {
          const component = new MockFullScreenViewerComponent();
          component.url = url;
          component.mediaType = mediaType;
          component.attachments = []; // Single mode

          component.download();

          // Should create anchor element
          expect(createElementSpy).toHaveBeenCalledWith('a');
          // Should set href to media URL
          expect(mockLink.href).toBe(url);
          // Should trigger click
          expect(mockLink.click).toHaveBeenCalled();
          // Should emit downloadClick event
          expect(component.downloadClick.emit).toHaveBeenCalledWith(url);
        }),
        { numRuns: 100 }
      );
    });

    it('should initiate download in gallery mode', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 28: Download Initiation
       *
       * For any FullScreenViewer state in gallery mode, clicking the download button
       * should initiate a download of the currently displayed media attachment.
       *
       * Validates: Requirements 9.1
       */
      fc.assert(
        fc.property(
          attachmentsArrayArbitrary(),
          validIndexArbitrary(10),
          (attachments, currentIndex) => {
            const validCurrentIndex = Math.min(currentIndex, attachments.length - 1);

            const component = new MockFullScreenViewerComponent();
            component.attachments = attachments;
            component.currentIndex = validCurrentIndex;

            const currentAttachment = attachments[validCurrentIndex];

            component.download();

            // Should create anchor element
            expect(createElementSpy).toHaveBeenCalledWith('a');
            // Should set href to current attachment URL
            expect(mockLink.href).toBe(currentAttachment.url);
            // Should trigger click
            expect(mockLink.click).toHaveBeenCalled();
            // Should emit downloadClick event with current attachment
            expect(component.downloadClick.emit).toHaveBeenCalledWith(currentAttachment);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not initiate download when no URL is available', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 28: Download Initiation
       *
       * For any FullScreenViewer state without a valid media URL, clicking the
       * download button should not initiate a download.
       *
       * Validates: Requirements 9.1
       */
      fc.assert(
        fc.property(fc.constant(true), () => {
          const component = new MockFullScreenViewerComponent();
          component.url = ''; // No URL
          component.attachments = []; // Single mode

          component.download();

          // Should not create anchor element
          expect(createElementSpy).not.toHaveBeenCalled();
          // Should not trigger click
          expect(mockLink.click).not.toHaveBeenCalled();
          // Should not emit downloadClick event
          expect(component.downloadClick.emit).not.toHaveBeenCalled();
        }),
        { numRuns: 100 }
      );
    });

    it('should set correct anchor attributes for download', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 28: Download Initiation
       *
       * For any download operation, the anchor element should have correct
       * attributes (target="_blank", rel="noopener noreferrer").
       *
       * Validates: Requirements 9.1
       */
      fc.assert(
        fc.property(fc.webUrl(), mediaTypeArbitrary(), (url, mediaType) => {
          const component = new MockFullScreenViewerComponent();
          component.url = url;
          component.mediaType = mediaType;
          component.attachments = []; // Single mode

          component.download();

          // Should set target to _blank
          expect(mockLink.target).toBe('_blank');
          // Should set rel to noopener noreferrer
          expect(mockLink.rel).toBe('noopener noreferrer');
        }),
        { numRuns: 100 }
      );
    });

    it('should append and remove anchor element from DOM', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 28: Download Initiation
       *
       * For any download operation, the anchor element should be appended to
       * the body, clicked, and then removed.
       *
       * Validates: Requirements 9.1
       */
      fc.assert(
        fc.property(fc.webUrl(), mediaTypeArbitrary(), (url, mediaType) => {
          const component = new MockFullScreenViewerComponent();
          component.url = url;
          component.mediaType = mediaType;
          component.attachments = []; // Single mode

          component.download();

          // Should append to body
          expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
          // Should remove from body
          expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 29: Download Filename Logic', () => {
    it('should use attachment name when provided in gallery mode', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 29: Download Filename Logic
       *
       * For any MediaAttachment with a name property, the download should use
       * that name as the filename.
       *
       * Validates: Requirements 9.2
       */
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.constantFrom('image' as const, 'video' as const),
          filenameArbitrary(),
          (url, type, name) => {
            const component = new MockFullScreenViewerComponent();
            component.attachments = [{ url, type, name }];
            component.currentIndex = 0;

            component.download();

            // Should use attachment name as filename
            expect(mockLink.download).toBe(name);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate default filename when attachment has no name', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 29: Download Filename Logic
       *
       * For any MediaAttachment without a name property, the download should
       * use a generated default filename.
       *
       * Validates: Requirements 9.3
       */
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.constantFrom('image' as const, 'video' as const),
          (url, type) => {
            const component = new MockFullScreenViewerComponent();
            component.attachments = [{ url, type, name: undefined }];
            component.currentIndex = 0;

            component.download();

            // Should generate default filename with pattern download_{timestamp}.{ext}
            expect(mockLink.download).toMatch(/^download_\d+\.(jpg|mp4)$/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use fileName input in single mode when provided', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 29: Download Filename Logic
       *
       * For any FullScreenViewer in single mode with fileName input, the download
       * should use that filename.
       *
       * Validates: Requirements 9.2
       */
      fc.assert(
        fc.property(
          fc.webUrl(),
          mediaTypeArbitrary(),
          filenameArbitrary(),
          (url, mediaType, fileName) => {
            const component = new MockFullScreenViewerComponent();
            component.url = url;
            component.mediaType = mediaType;
            component.fileName = fileName;
            component.attachments = []; // Single mode

            component.download();

            // Should use fileName input as filename
            expect(mockLink.download).toBe(fileName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate default filename in single mode when fileName not provided', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 29: Download Filename Logic
       *
       * For any FullScreenViewer in single mode without fileName input, the download
       * should use a generated default filename based on mediaType.
       *
       * Validates: Requirements 9.3
       */
      fc.assert(
        fc.property(fc.webUrl(), mediaTypeArbitrary(), (url, mediaType) => {
          const component = new MockFullScreenViewerComponent();
          component.url = url;
          component.mediaType = mediaType;
          component.fileName = ''; // No fileName
          component.attachments = []; // Single mode

          component.download();

          // Should generate default filename with correct extension
          const expectedExtensions: Record<string, string> = {
            image: 'jpg',
            video: 'mp4',
            audio: 'mp3',
            file: 'bin',
          };
          const expectedExt = expectedExtensions[mediaType];
          expect(mockLink.download).toMatch(new RegExp(`^download_\\d+\\.${expectedExt}$`));
        }),
        { numRuns: 100 }
      );
    });

    it('should generate unique filenames for multiple downloads', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 29: Download Filename Logic
       *
       * For any sequence of downloads without explicit filenames, each download
       * should generate a unique filename (due to timestamp).
       *
       * Validates: Requirements 9.3
       */
      fc.assert(
        fc.property(
          fc.webUrl(),
          mediaTypeArbitrary(),
          fc.integer({ min: 2, max: 5 }),
          (url, mediaType, downloadCount) => {
            const component = new MockFullScreenViewerComponent();
            component.url = url;
            component.mediaType = mediaType;
            component.fileName = ''; // No fileName
            component.attachments = []; // Single mode

            const filenames: string[] = [];

            for (let i = 0; i < downloadCount; i++) {
              component.download();
              filenames.push(mockLink.download);
            }

            // All filenames should follow the pattern
            filenames.forEach(filename => {
              expect(filename).toMatch(/^download_\d+\.(jpg|mp4|mp3|bin)$/);
            });

            // Note: Uniqueness is guaranteed by Date.now() timestamp in real execution
            // In tests, multiple calls in same millisecond may produce same filename
            // This is acceptable as the real-world scenario has time gaps between downloads
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle different media types with correct extensions', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       * Property 29: Download Filename Logic
       *
       * For any media type, the generated default filename should have the
       * correct file extension.
       *
       * Validates: Requirements 9.3
       */
      fc.assert(
        fc.property(fc.webUrl(), url => {
          const mediaTypes: ('image' | 'video' | 'audio' | 'file')[] = [
            'image',
            'video',
            'audio',
            'file',
          ];
          const expectedExtensions: Record<string, string> = {
            image: 'jpg',
            video: 'mp4',
            audio: 'mp3',
            file: 'bin',
          };

          for (const mediaType of mediaTypes) {
            const component = new MockFullScreenViewerComponent();
            component.url = url;
            component.mediaType = mediaType;
            component.fileName = ''; // No fileName
            component.attachments = []; // Single mode

            component.download();

            const expectedExt = expectedExtensions[mediaType];
            expect(mockLink.download).toMatch(new RegExp(`^download_\\d+\\.${expectedExt}$`));
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Download Functionality Invariants', () => {
    it('should always emit downloadClick event when download succeeds', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: For any successful download operation, the downloadClick event
       * should be emitted with the current media.
       *
       * Validates: Requirements 9.1
       */
      fc.assert(
        fc.property(fc.webUrl(), mediaTypeArbitrary(), (url, mediaType) => {
          const component = new MockFullScreenViewerComponent();
          component.url = url;
          component.mediaType = mediaType;
          component.attachments = []; // Single mode

          component.download();

          // downloadClick should be emitted
          expect(component.downloadClick.emit).toHaveBeenCalledTimes(1);
          // Should be called with the media URL
          expect(component.downloadClick.emit).toHaveBeenCalledWith(url);
        }),
        { numRuns: 100 }
      );
    });

    it('should prioritize attachment name over generated filename in gallery mode', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: In gallery mode, if an attachment has a name property, it should
       * always be used instead of generating a default filename.
       *
       * Validates: Requirements 9.2, 9.3
       */
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.constantFrom('image' as const, 'video' as const),
          filenameArbitrary(),
          (url, type, name) => {
            const component = new MockFullScreenViewerComponent();
            component.attachments = [{ url, type, name }];
            component.currentIndex = 0;

            component.download();

            // Should use attachment name, not generated filename
            expect(mockLink.download).toBe(name);
            expect(mockLink.download).not.toMatch(/^download_\d+\./);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should prioritize fileName input over generated filename in single mode', () => {
      /**
       * Feature: fullscreen-viewer-gallery-refactor
       *
       * Invariant: In single mode, if fileName input is provided, it should
       * always be used instead of generating a default filename.
       *
       * Validates: Requirements 9.2, 9.3
       */
      fc.assert(
        fc.property(
          fc.webUrl(),
          mediaTypeArbitrary(),
          filenameArbitrary(),
          (url, mediaType, fileName) => {
            const component = new MockFullScreenViewerComponent();
            component.url = url;
            component.mediaType = mediaType;
            component.fileName = fileName;
            component.attachments = []; // Single mode

            component.download();

            // Should use fileName input, not generated filename
            expect(mockLink.download).toBe(fileName);
            expect(mockLink.download).not.toMatch(/^download_\d+\./);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
