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
  pdf: 'assets/file_type_pdf.svg',
  doc: 'assets/file_type_word.svg',
  docx: 'assets/file_type_word.svg',
  txt: 'assets/file_type_txt.svg',
  rtf: 'assets/file_type_txt.svg',

  // Spreadsheets
  xls: 'assets/file_type_xlsx.svg',
  xlsx: 'assets/file_type_xlsx.svg',
  csv: 'assets/file_type_xlsx.svg',

  // Presentations
  ppt: 'assets/file_type_ppt.svg',
  pptx: 'assets/file_type_ppt.svg',

  // Code files
  js: 'assets/file_type_txt.svg',
  ts: 'assets/file_type_txt.svg',
  html: 'assets/file_type_txt.svg',
  css: 'assets/file_type_txt.svg',
  json: 'assets/file_type_txt.svg',

  // Archives
  zip: 'assets/file_type_zip.svg',
  rar: 'assets/file_type_zip.svg',
  tar: 'assets/file_type_zip.svg',
  gz: 'assets/file_type_zip.svg',
  '7z': 'assets/file_type_zip.svg',

  // Media files
  jpg: 'assets/file_type_jpg.svg',
  jpeg: 'assets/file_type_jpg.svg',
  png: 'assets/file_type_jpg.svg',
  gif: 'assets/file_type_jpg.svg',
  webp: 'assets/file_type_jpg.svg',
  bmp: 'assets/file_type_jpg.svg',
  svg: 'assets/file_type_jpg.svg',
  heic: 'assets/file_type_jpg.svg',
  heif: 'assets/file_type_jpg.svg',
  mp3: 'assets/file_type_mp3.svg',
  wav: 'assets/file_type_mp3.svg',
  m4a: 'assets/file_type_mp3.svg',
  aac: 'assets/file_type_mp3.svg',
  ogg: 'assets/file_type_mp3.svg',
  mp4: 'assets/file_type_mov.svg',
  mov: 'assets/file_type_mov.svg',
  avi: 'assets/file_type_mov.svg',
  mkv: 'assets/file_type_mov.svg',

  // Default
  default: 'assets/file_type_unsupported.svg',
};

/**
 * Get the file type from attachment for icon mapping.
 * Determines file type from extension first, then falls back to MIME type parsing.
 */
export function getFileType(attachment: FileAttachment): string {
  const extension = (attachment.extension ?? '').toLowerCase();
  if (FILE_TYPE_ICONS[extension]) return extension;

  const mimeType = (attachment.mimeType ?? '').toLowerCase();
  if (mimeType.includes('pdf')) return 'pdf';

  // OOXML first. EVERY Office 2007+ MIME type contains the literal "officedocument" — including
  // spreadsheets and presentations — so a generic `includes('document')` check would claim them
  // all as Word. Match the format-specific token instead.
  //   .docx -> application/vnd.openxmlformats-officedocument.wordprocessingml.document
  //   .xlsx -> application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  //   .pptx -> application/vnd.openxmlformats-officedocument.presentationml.presentation
  if (mimeType.includes('spreadsheetml')) return 'xls';
  if (mimeType.includes('presentationml')) return 'ppt';
  if (mimeType.includes('wordprocessingml')) return 'doc';

  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ppt';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'zip';
  if (mimeType.includes('image')) return 'jpg';
  if (mimeType.includes('audio')) return 'mp3';
  if (mimeType.includes('video')) return 'mov';
  return 'default';
}

/**
 * The extension for icon lookup: whatever the SDK reported, else the tail of the filename.
 * `Attachment.getExtension()` is frequently empty on received messages, and without this the
 * MIME fallback has to guess a format it can only approximate.
 */
export function resolveFileExtension(name: string | undefined, sdkExtension?: string): string {
  const fromSdk = (sdkExtension ?? '').trim().replace(/^\./, '');
  if (fromSdk) return fromSdk.toLowerCase();
  const fileName = name ?? '';
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
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
  // Rounded to match the React kit: "98 KB", "35.9 MB" — not "98.00 KB" / "35.90 MB".
  // The GB tier has no React counterpart (it would render "2048.0 MB"); kept deliberately.
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}
