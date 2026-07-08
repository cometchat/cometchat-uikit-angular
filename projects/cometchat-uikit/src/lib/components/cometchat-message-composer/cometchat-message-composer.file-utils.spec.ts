/**
 * cometchat-message-composer.file-utils Tests
 *
 * Covers: getFileType, getFileTypeLabel, getPluralFileType,
 *         isFileSizeValid, getSizeLimitMB, createAttachmentFile,
 *         formatFileSize, getMediaMessageType, FILE_SIZE_LIMITS.
 *
 * @module components/cometchat-message-composer/file-utils
 */

import { describe, it, expect } from 'vitest';
import {
  getFileType,
  getFileTypeLabel,
  getPluralFileType,
  isFileSizeValid,
  getSizeLimitMB,
  createAttachmentFile,
  formatFileSize,
  getMediaMessageType,
  FILE_SIZE_LIMITS,
} from './cometchat-message-composer.file-utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File(['x'.repeat(Math.min(size, 100))], name, { type });
  Object.defineProperty(file, 'size', { value: size, configurable: true });
  return file;
}

describe('cometchat-message-composer.file-utils', () => {

  // ==================== FILE_SIZE_LIMITS ====================

  describe('FILE_SIZE_LIMITS', () => {
    it('should define limits for all four types', () => {
      expect(FILE_SIZE_LIMITS.image).toBeGreaterThan(0);
      expect(FILE_SIZE_LIMITS.video).toBeGreaterThan(0);
      expect(FILE_SIZE_LIMITS.audio).toBeGreaterThan(0);
      expect(FILE_SIZE_LIMITS.file).toBeGreaterThan(0);
    });

    it('should have video limit larger than image limit', () => {
      expect(FILE_SIZE_LIMITS.video).toBeGreaterThan(FILE_SIZE_LIMITS.image);
    });

    it('should have file limit as the largest', () => {
      expect(FILE_SIZE_LIMITS.file).toBeGreaterThanOrEqual(FILE_SIZE_LIMITS.video);
    });
  });

  // ==================== getFileType ====================

  describe('getFileType', () => {
    it('should return "image" for image MIME types', () => {
      expect(getFileType(makeFile('photo.jpg', 'image/jpeg'))).toBe('image');
      expect(getFileType(makeFile('photo.png', 'image/png'))).toBe('image');
      expect(getFileType(makeFile('photo.gif', 'image/gif'))).toBe('image');
    });

    it('should return "video" for video MIME types', () => {
      expect(getFileType(makeFile('video.mp4', 'video/mp4'))).toBe('video');
      expect(getFileType(makeFile('video.webm', 'video/webm'))).toBe('video');
    });

    it('should return "audio" for audio MIME types', () => {
      expect(getFileType(makeFile('audio.mp3', 'audio/mpeg'))).toBe('audio');
      expect(getFileType(makeFile('audio.wav', 'audio/wav'))).toBe('audio');
    });

    it('should return "file" for other MIME types', () => {
      expect(getFileType(makeFile('doc.pdf', 'application/pdf'))).toBe('file');
      expect(getFileType(makeFile('doc.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))).toBe('file');
    });

    it('should return "file" for unknown MIME types', () => {
      expect(getFileType(makeFile('unknown.xyz', 'application/octet-stream'))).toBe('file');
    });
  });

  // ==================== getFileTypeLabel ====================

  describe('getFileTypeLabel', () => {
    it('should return "photo" for image MIME types', () => {
      expect(getFileTypeLabel('image/jpeg')).toBe('photo');
      expect(getFileTypeLabel('image/png')).toBe('photo');
    });

    it('should return "video" for video MIME types', () => {
      expect(getFileTypeLabel('video/mp4')).toBe('video');
    });

    it('should return "audio" for audio MIME types', () => {
      expect(getFileTypeLabel('audio/mpeg')).toBe('audio');
    });

    it('should return "file" for other MIME types', () => {
      expect(getFileTypeLabel('application/pdf')).toBe('file');
      expect(getFileTypeLabel('text/plain')).toBe('file');
    });

    it('should be case-insensitive', () => {
      expect(getFileTypeLabel('IMAGE/JPEG')).toBe('photo');
      expect(getFileTypeLabel('VIDEO/MP4')).toBe('video');
    });
  });

  // ==================== getPluralFileType ====================

  describe('getPluralFileType', () => {
    it('should return "photos" for photo', () => {
      expect(getPluralFileType('photo')).toBe('photos');
    });

    it('should return "videos" for video', () => {
      expect(getPluralFileType('video')).toBe('videos');
    });

    it('should return "audio files" for audio', () => {
      expect(getPluralFileType('audio')).toBe('audio files');
    });

    it('should return "files" for file', () => {
      expect(getPluralFileType('file')).toBe('files');
    });

    it('should return "files" for unknown type', () => {
      expect(getPluralFileType('unknown')).toBe('files');
    });
  });

  // ==================== isFileSizeValid ====================

  describe('isFileSizeValid', () => {
    it('should return true for file within image limit', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024 * 1024); // 1MB
      expect(isFileSizeValid(file, 'image')).toBe(true);
    });

    it('should return false for file exceeding image limit', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', FILE_SIZE_LIMITS.image + 1);
      expect(isFileSizeValid(file, 'image')).toBe(false);
    });

    it('should return true for file exactly at the limit', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', FILE_SIZE_LIMITS.image);
      expect(isFileSizeValid(file, 'image')).toBe(true);
    });

    it('should return true for small video file', () => {
      const file = makeFile('video.mp4', 'video/mp4', 1024);
      expect(isFileSizeValid(file, 'video')).toBe(true);
    });

    it('should return false for video exceeding limit', () => {
      const file = makeFile('video.mp4', 'video/mp4', FILE_SIZE_LIMITS.video + 1);
      expect(isFileSizeValid(file, 'video')).toBe(false);
    });
  });

  // ==================== getSizeLimitMB ====================

  describe('getSizeLimitMB', () => {
    it('should return correct MB for image', () => {
      expect(getSizeLimitMB('image')).toBe(FILE_SIZE_LIMITS.image / (1024 * 1024));
    });

    it('should return correct MB for video', () => {
      expect(getSizeLimitMB('video')).toBe(FILE_SIZE_LIMITS.video / (1024 * 1024));
    });

    it('should return a positive number for all types', () => {
      expect(getSizeLimitMB('image')).toBeGreaterThan(0);
      expect(getSizeLimitMB('video')).toBeGreaterThan(0);
      expect(getSizeLimitMB('audio')).toBeGreaterThan(0);
      expect(getSizeLimitMB('file')).toBeGreaterThan(0);
    });
  });

  // ==================== createAttachmentFile ====================

  describe('createAttachmentFile', () => {
    it('should create an AttachmentFile with correct type', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      const attachment = createAttachmentFile(file);
      expect(attachment.type).toBe('image');
    });

    it('should set the file reference', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      const attachment = createAttachmentFile(file);
      expect(attachment.file).toBe(file);
    });

    it('should set the file name', () => {
      const file = makeFile('my-photo.jpg', 'image/jpeg', 1024);
      const attachment = createAttachmentFile(file);
      expect(attachment.name).toBe('my-photo.jpg');
    });

    it('should set the file size', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 2048);
      const attachment = createAttachmentFile(file);
      expect(attachment.size).toBe(2048);
    });

    it('should set initial uploadProgress to 0', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      const attachment = createAttachmentFile(file);
      expect(attachment.uploadProgress).toBe(0);
    });

    it('should set initial status to "pending"', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      const attachment = createAttachmentFile(file);
      expect(attachment.status).toBe('pending');
    });

    it('should generate a unique ID', () => {
      const file = makeFile('photo.jpg', 'image/jpeg', 1024);
      const a1 = createAttachmentFile(file);
      const a2 = createAttachmentFile(file);
      expect(a1.id).not.toBe(a2.id);
    });
  });

  // ==================== formatFileSize ====================

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
    });

    it('should handle 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should handle fractional KB', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  // ==================== getMediaMessageType ====================

  describe('getMediaMessageType', () => {
    it('should return "image" for image type', () => {
      expect(getMediaMessageType('image')).toBe('image');
    });

    it('should return "video" for video type', () => {
      expect(getMediaMessageType('video')).toBe('video');
    });

    it('should return "audio" for audio type', () => {
      expect(getMediaMessageType('audio')).toBe('audio');
    });

    it('should return "file" for file type', () => {
      expect(getMediaMessageType('file')).toBe('file');
    });

    it('should return "file" for unknown type', () => {
      expect(getMediaMessageType('unknown' as any)).toBe('file');
    });
  });
});
