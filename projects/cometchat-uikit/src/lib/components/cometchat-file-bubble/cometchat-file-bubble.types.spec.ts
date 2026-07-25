import { describe, it, expect } from 'vitest';
import {
  FILE_TYPE_ICONS,
  getFileIcon,
  getFileType,
  resolveFileExtension,
} from './cometchat-file-bubble.types';
import type { FileAttachment } from '../../modals/FileAttachment';

const att = (extension: string, mimeType: string): FileAttachment =>
  ({ extension, mimeType }) as FileAttachment;

/** The Office 2007+ MIME types. Every one of them contains the substring "officedocument". */
const OOXML = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

describe('getFileType — extension wins', () => {
  it('uses a known extension and ignores the MIME type entirely', () => {
    expect(getFileType(att('xlsx', OOXML.docx))).toBe('xlsx');
    expect(getFileType(att('pdf', 'application/octet-stream'))).toBe('pdf');
  });

  it('tolerates a missing extension or MIME type without throwing', () => {
    expect(getFileType({} as FileAttachment)).toBe('default');
    expect(getFileType(att('', ''))).toBe('default');
  });
});

describe('getFileType — MIME fallback when no extension', () => {
  // The regression: "officedocument" appears in EVERY OOXML type, so a generic
  // includes('document') check claimed spreadsheets and presentations as Word documents.
  it('does not mistake an OOXML spreadsheet or presentation for a Word document', () => {
    expect(getFileType(att('', OOXML.xlsx))).toBe('xls');
    expect(getFileType(att('', OOXML.pptx))).toBe('ppt');
    expect(getFileType(att('', OOXML.docx))).toBe('doc');
  });

  it('still resolves the legacy binary Office types', () => {
    expect(getFileType(att('', 'application/msword'))).toBe('doc');
    expect(getFileType(att('', 'application/vnd.ms-excel'))).toBe('xls');
    expect(getFileType(att('', 'application/vnd.ms-powerpoint'))).toBe('ppt');
  });

  it('resolves the remaining families', () => {
    expect(getFileType(att('', 'application/pdf'))).toBe('pdf');
    expect(getFileType(att('', 'application/zip'))).toBe('zip');
    expect(getFileType(att('', 'image/png'))).toBe('jpg');
    expect(getFileType(att('', 'audio/mpeg'))).toBe('mp3');
    expect(getFileType(att('', 'video/mp4'))).toBe('mov');
    expect(getFileType(att('', 'application/x-thing'))).toBe('default');
  });
});

describe('getFileType -> getFileIcon end to end', () => {
  it('an .xlsx with no extension reported still gets the spreadsheet icon, not Word', () => {
    const icon = getFileIcon(getFileType(att('', OOXML.xlsx)));
    expect(icon).toBe(FILE_TYPE_ICONS['xls']);
    expect(icon).not.toBe(FILE_TYPE_ICONS['doc']);
  });

  it('an unknown type falls back to the unsupported glyph', () => {
    expect(getFileIcon('nonsense')).toBe(FILE_TYPE_ICONS['default']);
  });
});

describe('resolveFileExtension', () => {
  it('prefers the SDK value, normalizing case and a leading dot', () => {
    expect(resolveFileExtension('report.pdf', 'XLSX')).toBe('xlsx');
    expect(resolveFileExtension('report.pdf', '.Xlsx')).toBe('xlsx');
  });

  it('falls back to the filename when the SDK reports nothing', () => {
    expect(resolveFileExtension('Q3-Report.xlsx', '')).toBe('xlsx');
    expect(resolveFileExtension('Q3-Report.xlsx', undefined)).toBe('xlsx');
    expect(resolveFileExtension('Q3-Report.xlsx', '   ')).toBe('xlsx');
  });

  it('handles dots in the name and names with no extension at all', () => {
    expect(resolveFileExtension('Sample-Data copy 2.xlsx', '')).toBe('xlsx');
    expect(resolveFileExtension('README', '')).toBe('');
    expect(resolveFileExtension(undefined, undefined)).toBe('');
  });
});
