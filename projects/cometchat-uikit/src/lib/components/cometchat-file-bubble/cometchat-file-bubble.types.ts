/**
 * Types and utilities for CometChatFileBubble component.
 */

import { FileAttachment } from '../../modals/FileAttachment';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';

/**
 * File Type Icon Mapping
 * Maps file extensions to their corresponding icon assets.
 * @see Requirements 9.1-9.8
 */
export const FILE_TYPE_ICONS: Record<string, string> = {
  // Documents
  pdf: 'assets/file_type_pdf.png',
  doc: 'assets/file_type_word.png',
  docx: 'assets/file_type_word.png',
  txt: 'assets/file_type_txt.png',

  // Spreadsheets
  xls: 'assets/file_type_xlsx.png',
  xlsx: 'assets/file_type_xlsx.png',
  csv: 'assets/file_type_xlsx.png',

  // Presentations
  ppt: 'assets/file_type_ppt.png',
  pptx: 'assets/file_type_ppt.png',

  // Code files
  js: 'assets/file_type_txt.png',
  ts: 'assets/file_type_txt.png',
  html: 'assets/file_type_txt.png',
  css: 'assets/file_type_txt.png',
  json: 'assets/file_type_txt.png',

  // Archives
  zip: 'assets/file_type_zip.png',
  rar: 'assets/file_type_zip.png',
  tar: 'assets/file_type_zip.png',
  gz: 'assets/file_type_zip.png',

  // Media files
  jpg: 'assets/file_type_jpg.png',
  jpeg: 'assets/file_type_jpg.png',
  png: 'assets/file_type_jpg.png',
  gif: 'assets/file_type_jpg.png',
  mp3: 'assets/file_type_mp3.png',
  wav: 'assets/file_type_mp3.png',
  mp4: 'assets/file_type_mov.png',
  mov: 'assets/file_type_mov.png',
  avi: 'assets/file_type_mov.png',

  // Default
  default: 'assets/file_type_unsupported.png',
};

/**
 * Get the file type from attachment for icon mapping.
 * Determines file type from extension first, then falls back to MIME type parsing.
 */
export function getFileType(attachment: FileAttachment): string {
  const extension = attachment.extension.toLowerCase();
  if (FILE_TYPE_ICONS[extension]) return extension;

  const mimeType = attachment.mimeType.toLowerCase();
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ppt';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'zip';
  if (mimeType.includes('image')) return 'jpg';
  if (mimeType.includes('audio')) return 'mp3';
  if (mimeType.includes('video')) return 'mov';
  return 'default';
}

/**
 * Get the file icon URL for a file type.
 */
export function getFileIcon(fileType: string): string {
  return FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS['default'];
}

/**
 * Format file size in human-readable format.
 * Converts bytes to appropriate unit (B, KB, MB, GB) with 2 decimal places.
 * @see Requirements 10.1-10.6
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0 || typeof bytes !== 'number') {
    return CometChatLocalize.getLocalizedString('file_bubble_size_unknown');
  }
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}
