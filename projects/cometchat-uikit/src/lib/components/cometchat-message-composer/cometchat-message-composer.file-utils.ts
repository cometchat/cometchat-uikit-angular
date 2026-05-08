/**
 * File handling utilities for CometChatMessageComposer component.
 *
 * Extracted from cometchat-message-composer.component.ts to isolate
 * file type detection, size validation, and attachment management logic.
 */

import { AttachmentFile } from './cometchat-message-composer.types';

// ==================== File Type Detection ====================

/**
 * Determines the attachment type from a File object's MIME type.
 */
export function getFileType(file: File): 'image' | 'video' | 'audio' | 'file' {
  const mime = file.type.toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
}

/**
 * Returns a human-readable label for a MIME type.
 * Used in error messages (e.g., "photo", "video", "audio", "file").
 */
export function getFileTypeLabel(mimeType: string): string {
  const lower = mimeType.toLowerCase();
  if (lower.startsWith('image/')) return 'photo';
  if (lower.startsWith('video/')) return 'video';
  if (lower.startsWith('audio/')) return 'audio';
  return 'file';
}

/**
 * Returns the plural form of a file type label.
 * Used in error messages (e.g., "photos", "videos").
 */
export function getPluralFileType(fileType: string): string {
  switch (fileType) {
    case 'photo': return 'photos';
    case 'video': return 'videos';
    case 'audio': return 'audio files';
    default: return 'files';
  }
}

// ==================== File Size Validation ====================

/**
 * Maximum file sizes in bytes per type.
 * These match the CometChat SDK limits.
 */
export const FILE_SIZE_LIMITS: Record<'image' | 'video' | 'audio' | 'file', number> = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 50 * 1024 * 1024,  // 50 MB
  audio: 10 * 1024 * 1024,  // 10 MB
  file: 100 * 1024 * 1024,  // 100 MB
};

/**
 * Checks whether a file exceeds the size limit for its type.
 *
 * @returns true if the file is within the allowed size, false if it exceeds the limit
 */
export function isFileSizeValid(file: File, type: 'image' | 'video' | 'audio' | 'file'): boolean {
  return file.size <= FILE_SIZE_LIMITS[type];
}

/**
 * Returns the size limit in MB for a given file type.
 */
export function getSizeLimitMB(type: 'image' | 'video' | 'audio' | 'file'): number {
  return FILE_SIZE_LIMITS[type] / (1024 * 1024);
}

// ==================== Attachment Object Helpers ====================

/**
 * Creates an AttachmentFile object from a raw File.
 */
export function createAttachmentFile(file: File): AttachmentFile {
  const type = getFileType(file);
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    file,
    type,
    name: file.name,
    size: file.size,
    uploadProgress: 0,
    status: 'pending',
  };
}

/**
 * Formats a file size in bytes to a human-readable string.
 * e.g. 1048576 → "1.0 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ==================== Media Message Type Mapping ====================

/**
 * Maps a file attachment type to the CometChat SDK media message type string.
 */
export function getMediaMessageType(fileType: 'image' | 'video' | 'audio' | 'file'): string {
  const typeMap: Record<string, string> = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    file: 'file',
  };
  return typeMap[fileType] ?? 'file';
}
