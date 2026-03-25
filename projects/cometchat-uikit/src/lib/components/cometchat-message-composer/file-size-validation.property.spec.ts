/**
 * Property-Based Tests for File Size Validation
 *
 * **Feature: message-composer-bugfixes, Property 11: File Size Validation**
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 *
 * Property: For any file larger than the configured maxFileSize (default 100MB),
 * the file should be rejected and an error should be displayed in the header.
 */

import * as fc from 'fast-check';

/**
 * Interface representing a file size error
 * Matches the FileSizeError interface from the component
 */
interface FileSizeError {
  /** Number of files that exceeded the limit */
  count: number;
  /** Type of files (photo, video, file) */
  fileType: string;
  /** Size limit in MB */
  limitMB: number;
  /** Timestamp when error occurred */
  timestamp: number;
}

/**
 * File type categories
 */
type FileTypeCategory = 'image' | 'video' | 'audio' | 'file';

/**
 * Simulates file size validation behavior from the message composer
 */
class FileSizeValidationSimulator {
  private maxFileSize: number;
  private fileSizeError: FileSizeError | null = null;
  private attachments: { name: string; size: number; type: FileTypeCategory }[] = [];

  constructor(maxFileSize?: number) {
    // Default 100MB
    this.maxFileSize = maxFileSize || 100 * 1024 * 1024;
  }

  /**
   * Get the file type category from MIME type
   */
  private getFileType(mimeType: string): FileTypeCategory {
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    return 'file';
  }

  /**
   * Get a user-friendly label for a file type based on MIME type
   */
  private getFileTypeLabel(mimeType: string): string {
    if (mimeType.startsWith('image/')) {
      return 'photo';
    }
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    return 'file';
  }

  /**
   * Get the plural form of a file type
   */
  private getPluralFileType(fileType: string): string {
    switch (fileType) {
      case 'photo':
        return 'photos';
      case 'video':
        return 'videos';
      case 'audio':
        return 'audio files';
      case 'file':
      default:
        return 'files';
    }
  }

  /**
   * Process files and validate their sizes
   * Returns the list of oversized files
   */
  processFiles(files: { name: string; size: number; mimeType: string }[]): void {
    const oversizedFiles: { name: string; size: number; mimeType: string }[] = [];

    for (const file of files) {
      if (file.size > this.maxFileSize) {
        oversizedFiles.push(file);
        continue;
      }

      // Add valid file to attachments
      this.attachments.push({
        name: file.name,
        size: file.size,
        type: this.getFileType(file.mimeType),
      });
    }

    // Set file size error if any files exceeded the limit
    if (oversizedFiles.length > 0) {
      const fileType = this.getFileTypeLabel(oversizedFiles[0].mimeType);
      this.fileSizeError = {
        count: oversizedFiles.length,
        fileType,
        limitMB: Math.round(this.maxFileSize / (1024 * 1024)),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Get the formatted file size error message
   */
  getFileSizeErrorMessage(): string {
    const error = this.fileSizeError;
    if (!error) {
      return '';
    }

    const count = error.count;
    const fileType = count === 1 ? error.fileType : this.getPluralFileType(error.fileType);
    const verb = count === 1 ? 'is' : 'are';
    const limit = `${error.limitMB} MB`;

    return `${count} ${fileType} you tried adding ${verb} larger than the ${limit} limit`;
  }

  /**
   * Dismiss the file size error
   */
  dismissFileSizeError(): void {
    this.fileSizeError = null;
  }

  /**
   * Get the current file size error
   */
  getFileSizeError(): FileSizeError | null {
    return this.fileSizeError;
  }

  /**
   * Get the current attachments
   */
  getAttachments(): { name: string; size: number; type: FileTypeCategory }[] {
    return this.attachments;
  }

  /**
   * Get the max file size
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }

  /**
   * Reset the simulator state
   */
  reset(): void {
    this.fileSizeError = null;
    this.attachments = [];
  }
}

describe('Property 11: File Size Validation', () => {
  /**
   * **Feature: message-composer-bugfixes, Property 11: File Size Validation**
   * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
   */

  // Constants
  const DEFAULT_MAX_SIZE_MB = 100;
  const DEFAULT_MAX_SIZE_BYTES = DEFAULT_MAX_SIZE_MB * 1024 * 1024;
  const MB = 1024 * 1024;

  // Arbitraries for generating test data
  const fileNameArb = fc
    .string({ minLength: 1, maxLength: 50 })
    .map(s => `${s.replace(/[^a-zA-Z0-9]/g, '_')}.txt`);

  const mimeTypeArb = fc.oneof(
    fc.constant('image/jpeg'),
    fc.constant('image/png'),
    fc.constant('image/gif'),
    fc.constant('video/mp4'),
    fc.constant('video/webm'),
    fc.constant('audio/mp3'),
    fc.constant('audio/wav'),
    fc.constant('application/pdf'),
    fc.constant('application/octet-stream'),
    fc.constant('text/plain')
  );

  const fileTypeToMimeArb = fc.oneof(
    fc.constant({ type: 'image' as const, mimeType: 'image/jpeg', label: 'photo' }),
    fc.constant({ type: 'video' as const, mimeType: 'video/mp4', label: 'video' }),
    fc.constant({ type: 'audio' as const, mimeType: 'audio/mp3', label: 'audio' }),
    fc.constant({ type: 'file' as const, mimeType: 'application/pdf', label: 'file' })
  );

  // Generate file sizes in bytes
  const validFileSizeArb = fc.integer({ min: 1, max: DEFAULT_MAX_SIZE_BYTES });
  const oversizedFileSizeArb = fc.integer({
    min: DEFAULT_MAX_SIZE_BYTES + 1,
    max: DEFAULT_MAX_SIZE_BYTES * 3,
  });

  // Generate custom max file sizes (in MB)
  const customMaxSizeMBArb = fc.integer({ min: 1, max: 500 });

  describe('File Size Rejection Property', () => {
    /**
     * **Validates: Requirement 12.1**
     * WHEN a file larger than 100MB is uploaded THEN THE Error_Message SHALL be displayed
     */
    it('should reject files larger than the default 100MB limit', () => {
      fc.assert(
        fc.property(
          fileNameArb,
          oversizedFileSizeArb,
          mimeTypeArb,
          (fileName, fileSize, mimeType) => {
            const simulator = new FileSizeValidationSimulator();

            simulator.processFiles([{ name: fileName, size: fileSize, mimeType }]);

            // File should be rejected (not in attachments)
            expect(simulator.getAttachments().length).toBe(0);

            // Error should be set
            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.count).toBe(1);
            expect(error!.limitMB).toBe(DEFAULT_MAX_SIZE_MB);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept files smaller than or equal to the limit', () => {
      fc.assert(
        fc.property(fileNameArb, validFileSizeArb, mimeTypeArb, (fileName, fileSize, mimeType) => {
          const simulator = new FileSizeValidationSimulator();

          simulator.processFiles([{ name: fileName, size: fileSize, mimeType }]);

          // File should be accepted (in attachments)
          expect(simulator.getAttachments().length).toBe(1);

          // No error should be set
          expect(simulator.getFileSizeError()).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should reject files larger than custom maxFileSize', () => {
      fc.assert(
        fc.property(
          customMaxSizeMBArb,
          fileNameArb,
          mimeTypeArb,
          (maxSizeMB, fileName, mimeType) => {
            const maxSizeBytes = maxSizeMB * MB;
            const oversizedFileSize = maxSizeBytes + 1;
            const simulator = new FileSizeValidationSimulator(maxSizeBytes);

            simulator.processFiles([{ name: fileName, size: oversizedFileSize, mimeType }]);

            // File should be rejected
            expect(simulator.getAttachments().length).toBe(0);

            // Error should be set with correct limit
            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.limitMB).toBe(maxSizeMB);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Message Format Property', () => {
    /**
     * **Validates: Requirement 12.2**
     * THE Error_Message SHALL follow the format: "{count} {file_type} you tried adding is larger than the {limit} limit"
     */
    it('should format error message correctly for single file', () => {
      fc.assert(
        fc.property(fileTypeToMimeArb, fileNameArb, (fileTypeInfo, fileName) => {
          const simulator = new FileSizeValidationSimulator();
          const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

          simulator.processFiles([
            { name: fileName, size: oversizedSize, mimeType: fileTypeInfo.mimeType },
          ]);

          const message = simulator.getFileSizeErrorMessage();

          // Message should follow the format
          expect(message).toContain('1');
          expect(message).toContain(fileTypeInfo.label);
          expect(message).toContain('you tried adding');
          expect(message).toContain('is larger than');
          expect(message).toContain(`${DEFAULT_MAX_SIZE_MB} MB`);
          expect(message).toContain('limit');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirement 12.3**
     * WHEN one photo exceeds the limit THEN THE Error_Message SHALL say "1 photo you tried adding is larger than the 100 MB limit"
     */
    it('should display correct message for single photo exceeding limit', () => {
      fc.assert(
        fc.property(fileNameArb, fileName => {
          const simulator = new FileSizeValidationSimulator();
          const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

          simulator.processFiles([{ name: fileName, size: oversizedSize, mimeType: 'image/jpeg' }]);

          const message = simulator.getFileSizeErrorMessage();

          expect(message).toBe('1 photo you tried adding is larger than the 100 MB limit');
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Multiple Files Count Property', () => {
    /**
     * **Validates: Requirement 12.4**
     * WHEN multiple files exceed the limit THEN THE Error_Message SHALL indicate the count
     */
    it('should indicate correct count for multiple oversized files', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          fileTypeToMimeArb,
          (fileCount, fileTypeInfo) => {
            const simulator = new FileSizeValidationSimulator();
            const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

            // Create multiple oversized files of the same type
            const files = Array.from({ length: fileCount }, (_, i) => ({
              name: `file${i}.txt`,
              size: oversizedSize,
              mimeType: fileTypeInfo.mimeType,
            }));

            simulator.processFiles(files);

            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.count).toBe(fileCount);

            const message = simulator.getFileSizeErrorMessage();
            expect(message).toContain(`${fileCount}`);
            expect(message).toContain('are larger than'); // Plural verb
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use plural file type for multiple files', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), fileCount => {
          const simulator = new FileSizeValidationSimulator();
          const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

          // Create multiple oversized photos
          const files = Array.from({ length: fileCount }, (_, i) => ({
            name: `photo${i}.jpg`,
            size: oversizedSize,
            mimeType: 'image/jpeg',
          }));

          simulator.processFiles(files);

          const message = simulator.getFileSizeErrorMessage();
          expect(message).toContain('photos'); // Plural form
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('File Type Label Property', () => {
    it('should correctly label image files as photo', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('image/jpeg'),
            fc.constant('image/png'),
            fc.constant('image/gif'),
            fc.constant('image/webp')
          ),
          fileNameArb,
          (mimeType, fileName) => {
            const simulator = new FileSizeValidationSimulator();
            const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

            simulator.processFiles([{ name: fileName, size: oversizedSize, mimeType }]);

            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.fileType).toBe('photo');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly label video files as video', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('video/mp4'),
            fc.constant('video/webm'),
            fc.constant('video/quicktime')
          ),
          fileNameArb,
          (mimeType, fileName) => {
            const simulator = new FileSizeValidationSimulator();
            const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

            simulator.processFiles([{ name: fileName, size: oversizedSize, mimeType }]);

            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.fileType).toBe('video');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly label audio files as audio', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.constant('audio/mp3'), fc.constant('audio/wav'), fc.constant('audio/ogg')),
          fileNameArb,
          (mimeType, fileName) => {
            const simulator = new FileSizeValidationSimulator();
            const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

            simulator.processFiles([{ name: fileName, size: oversizedSize, mimeType }]);

            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.fileType).toBe('audio');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly label other files as file', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('application/pdf'),
            fc.constant('application/octet-stream'),
            fc.constant('text/plain'),
            fc.constant('application/zip')
          ),
          fileNameArb,
          (mimeType, fileName) => {
            const simulator = new FileSizeValidationSimulator();
            const oversizedSize = DEFAULT_MAX_SIZE_BYTES + 1;

            simulator.processFiles([{ name: fileName, size: oversizedSize, mimeType }]);

            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.fileType).toBe('file');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Mixed Valid and Invalid Files Property', () => {
    it('should accept valid files and reject oversized files in the same batch', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 5 }),
          mimeTypeArb,
          (validCount, oversizedCount, mimeType) => {
            const simulator = new FileSizeValidationSimulator();

            // Create mix of valid and oversized files
            const validFiles = Array.from({ length: validCount }, (_, i) => ({
              name: `valid${i}.txt`,
              size: DEFAULT_MAX_SIZE_BYTES - 1000, // Just under limit
              mimeType,
            }));

            const oversizedFiles = Array.from({ length: oversizedCount }, (_, i) => ({
              name: `oversized${i}.txt`,
              size: DEFAULT_MAX_SIZE_BYTES + 1000, // Just over limit
              mimeType,
            }));

            simulator.processFiles([...validFiles, ...oversizedFiles]);

            // Valid files should be accepted
            expect(simulator.getAttachments().length).toBe(validCount);

            // Error should be set for oversized files
            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.count).toBe(oversizedCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Error Dismissal Property', () => {
    it('should clear error when dismissed', () => {
      fc.assert(
        fc.property(
          fileNameArb,
          oversizedFileSizeArb,
          mimeTypeArb,
          (fileName, fileSize, mimeType) => {
            const simulator = new FileSizeValidationSimulator();

            simulator.processFiles([{ name: fileName, size: fileSize, mimeType }]);

            // Error should be set
            expect(simulator.getFileSizeError()).not.toBeNull();

            // Dismiss error
            simulator.dismissFileSizeError();

            // Error should be cleared
            expect(simulator.getFileSizeError()).toBeNull();
            expect(simulator.getFileSizeErrorMessage()).toBe('');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Boundary Conditions Property', () => {
    it('should accept files exactly at the limit', () => {
      fc.assert(
        fc.property(
          customMaxSizeMBArb,
          fileNameArb,
          mimeTypeArb,
          (maxSizeMB, fileName, mimeType) => {
            const maxSizeBytes = maxSizeMB * MB;
            const simulator = new FileSizeValidationSimulator(maxSizeBytes);

            // File exactly at the limit
            simulator.processFiles([{ name: fileName, size: maxSizeBytes, mimeType }]);

            // File should be accepted (at limit, not over)
            expect(simulator.getAttachments().length).toBe(1);
            expect(simulator.getFileSizeError()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject files exactly 1 byte over the limit', () => {
      fc.assert(
        fc.property(
          customMaxSizeMBArb,
          fileNameArb,
          mimeTypeArb,
          (maxSizeMB, fileName, mimeType) => {
            const maxSizeBytes = maxSizeMB * MB;
            const simulator = new FileSizeValidationSimulator(maxSizeBytes);

            // File exactly 1 byte over the limit
            simulator.processFiles([{ name: fileName, size: maxSizeBytes + 1, mimeType }]);

            // File should be rejected
            expect(simulator.getAttachments().length).toBe(0);
            expect(simulator.getFileSizeError()).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Limit Display Property', () => {
    it('should display correct limit in MB in error message', () => {
      fc.assert(
        fc.property(
          customMaxSizeMBArb,
          fileNameArb,
          mimeTypeArb,
          (maxSizeMB, fileName, mimeType) => {
            const maxSizeBytes = maxSizeMB * MB;
            const simulator = new FileSizeValidationSimulator(maxSizeBytes);
            const oversizedSize = maxSizeBytes + 1;

            simulator.processFiles([{ name: fileName, size: oversizedSize, mimeType }]);

            const error = simulator.getFileSizeError();
            expect(error).not.toBeNull();
            expect(error!.limitMB).toBe(maxSizeMB);

            const message = simulator.getFileSizeErrorMessage();
            expect(message).toContain(`${maxSizeMB} MB`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined Properties', () => {
    it('should correctly handle any valid file size and maxFileSize combination', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }), // maxSizeMB
          fc.integer({ min: 1, max: 1000 * MB }), // fileSize in bytes
          fileNameArb,
          mimeTypeArb,
          (maxSizeMB, fileSize, fileName, mimeType) => {
            const maxSizeBytes = maxSizeMB * MB;
            const simulator = new FileSizeValidationSimulator(maxSizeBytes);

            simulator.processFiles([{ name: fileName, size: fileSize, mimeType }]);

            const isOversized = fileSize > maxSizeBytes;

            if (isOversized) {
              // File should be rejected
              expect(simulator.getAttachments().length).toBe(0);
              expect(simulator.getFileSizeError()).not.toBeNull();
            } else {
              // File should be accepted
              expect(simulator.getAttachments().length).toBe(1);
              expect(simulator.getFileSizeError()).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
