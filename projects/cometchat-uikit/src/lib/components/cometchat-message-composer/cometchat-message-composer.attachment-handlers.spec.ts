/**
 * cometchat-message-composer.attachment-handlers Tests
 *
 * Covers: handleAttachmentClickImpl, handleFullscreenViewerCloseImpl,
 *         handleFullscreenViewerPreviousImpl, handleFullscreenViewerNextImpl,
 *         getCurrentFullscreenAttachmentImpl, handleRemoveAttachmentImpl,
 *         handleAttachmentButtonClickImpl, handleAttachmentOptionClickImpl.
 *
 * @module components/cometchat-message-composer/attachment-handlers
 */

import { describe, it, expect, vi } from 'vitest';
import {
  handleAttachmentClickImpl,
  handleFullscreenViewerCloseImpl,
  handleFullscreenViewerPreviousImpl,
  handleFullscreenViewerNextImpl,
  getCurrentFullscreenAttachmentImpl,
  handleRemoveAttachmentImpl,
  handleAttachmentButtonClickImpl,
  handleAttachmentOptionClickImpl,
} from './cometchat-message-composer.attachment-handlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAttachment(id: string, type: 'image' | 'video' | 'audio' | 'file', name = `${id}.jpg`) {
  return {
    id,
    type,
    name,
    file: new File(['content'], name),
    size: 1024,
    uploadProgress: 0,
    status: 'pending' as const,
    thumbnailUrl: null as string | null,
  };
}

function makeSelf(attachments: any[] = [], overrides: Record<string, any> = {}) {
  let _attachments = [...attachments];
  let _index = 0;
  let _isOpen = false;

  const attachmentsSignal = {
    get value() { return _attachments; },
    set: vi.fn((v: any[]) => { _attachments = v; }),
    update: vi.fn((fn: (a: any[]) => any[]) => { _attachments = fn(_attachments); }),
  };
  const fullscreenViewerIndex = {
    get value() { return _index; },
    set: vi.fn((v: number) => { _index = v; }),
  };
  const isFullscreenViewerOpen = {
    get value() { return _isOpen; },
    set: vi.fn((v: boolean) => { _isOpen = v; }),
  };

  return {
    attachments: Object.assign(() => _attachments, attachmentsSignal),
    fullscreenViewerIndex: Object.assign(() => _index, fullscreenViewerIndex),
    isFullscreenViewerOpen: Object.assign(() => _isOpen, isFullscreenViewerOpen),
    contentToDisplay: { set: vi.fn() },
    syncLegacyPopoverSignals: vi.fn(),
    fileInputRef: null,
    openPollModal: vi.fn(),
    createCollaborativeDocument: vi.fn(),
    createCollaborativeWhiteboard: vi.fn(),
    attachmentRemoved: { emit: vi.fn() },
    announceAttachmentRemoved: vi.fn(),
    toggleAttachmentMenu: vi.fn(),
    ...overrides,
  };
}

describe('cometchat-message-composer.attachment-handlers', () => {

  // ==================== handleAttachmentClickImpl ====================

  describe('handleAttachmentClickImpl', () => {
    it('should open fullscreen viewer for image attachment', () => {
      const self = makeSelf();
      const attachment = makeAttachment('a1', 'image');
      handleAttachmentClickImpl(self, attachment, 2);
      expect(self.fullscreenViewerIndex.set).toHaveBeenCalledWith(2);
      expect(self.isFullscreenViewerOpen.set).toHaveBeenCalledWith(true);
    });

    it('should open fullscreen viewer for video attachment', () => {
      const self = makeSelf();
      const attachment = makeAttachment('a1', 'video');
      handleAttachmentClickImpl(self, attachment, 0);
      expect(self.isFullscreenViewerOpen.set).toHaveBeenCalledWith(true);
    });

    it('should not open fullscreen viewer for audio attachment', () => {
      const self = makeSelf();
      const attachment = makeAttachment('a1', 'audio');
      handleAttachmentClickImpl(self, attachment, 0);
      expect(self.isFullscreenViewerOpen.set).not.toHaveBeenCalled();
    });

    it('should not open fullscreen viewer for file attachment', () => {
      const self = makeSelf();
      const attachment = makeAttachment('a1', 'file');
      handleAttachmentClickImpl(self, attachment, 0);
      expect(self.isFullscreenViewerOpen.set).not.toHaveBeenCalled();
    });
  });

  // ==================== handleFullscreenViewerCloseImpl ====================

  describe('handleFullscreenViewerCloseImpl', () => {
    it('should set isFullscreenViewerOpen to false', () => {
      const self = makeSelf();
      handleFullscreenViewerCloseImpl(self);
      expect(self.isFullscreenViewerOpen.set).toHaveBeenCalledWith(false);
    });
  });

  // ==================== handleFullscreenViewerPreviousImpl ====================

  describe('handleFullscreenViewerPreviousImpl', () => {
    it('should move to previous index', () => {
      const attachments = [makeAttachment('a1', 'image'), makeAttachment('a2', 'image'), makeAttachment('a3', 'image')];
      const self = makeSelf(attachments);
      self.fullscreenViewerIndex.set(2);
      self.fullscreenViewerIndex.set.mockClear();
      handleFullscreenViewerPreviousImpl(self);
      expect(self.fullscreenViewerIndex.set).toHaveBeenCalledWith(1);
    });

    it('should wrap to last index from 0', () => {
      const attachments = [makeAttachment('a1', 'image'), makeAttachment('a2', 'image')];
      const self = makeSelf(attachments);
      // index is already 0 (default)
      handleFullscreenViewerPreviousImpl(self);
      expect(self.fullscreenViewerIndex.set).toHaveBeenCalledWith(1);
    });
  });

  // ==================== handleFullscreenViewerNextImpl ====================

  describe('handleFullscreenViewerNextImpl', () => {
    it('should move to next index', () => {
      const attachments = [makeAttachment('a1', 'image'), makeAttachment('a2', 'image'), makeAttachment('a3', 'image')];
      const self = makeSelf(attachments);
      self.fullscreenViewerIndex.value = 0;
      handleFullscreenViewerNextImpl(self);
      expect(self.fullscreenViewerIndex.set).toHaveBeenCalledWith(1);
    });

    it('should wrap to 0 from last index', () => {
      const attachments = [makeAttachment('a1', 'image'), makeAttachment('a2', 'image')];
      const self = makeSelf(attachments);
      self.fullscreenViewerIndex.set(1);
      self.fullscreenViewerIndex.set.mockClear();
      handleFullscreenViewerNextImpl(self);
      expect(self.fullscreenViewerIndex.set).toHaveBeenCalledWith(0);
    });
  });

  // ==================== getCurrentFullscreenAttachmentImpl ====================

  describe('getCurrentFullscreenAttachmentImpl', () => {
    it('should return the attachment at the current index', () => {
      const a1 = makeAttachment('a1', 'image');
      const a2 = makeAttachment('a2', 'image');
      const self = makeSelf([a1, a2]);
      self.fullscreenViewerIndex.set(1);
      expect(getCurrentFullscreenAttachmentImpl(self)).toBe(a2);
    });

    it('should return undefined for out-of-bounds index', () => {
      const self = makeSelf([]);
      self.fullscreenViewerIndex.value = 5;
      expect(getCurrentFullscreenAttachmentImpl(self)).toBeUndefined();
    });
  });

  // ==================== handleRemoveAttachmentImpl ====================

  describe('handleRemoveAttachmentImpl', () => {
    it('should remove the attachment from the list', () => {
      const a1 = makeAttachment('a1', 'image');
      const a2 = makeAttachment('a2', 'image');
      const self = makeSelf([a1, a2]);
      handleRemoveAttachmentImpl(self, a1);
      expect(self.attachments.update).toHaveBeenCalled();
      // Verify the filter was applied
      const filterFn = self.attachments.update.mock.calls[0][0];
      const result = filterFn([a1, a2]);
      expect(result).not.toContain(a1);
      expect(result).toContain(a2);
    });

    it('should emit attachmentRemoved event', () => {
      const a1 = makeAttachment('a1', 'image');
      const self = makeSelf([a1]);
      handleRemoveAttachmentImpl(self, a1);
      expect(self.attachmentRemoved.emit).toHaveBeenCalledWith(a1.file);
    });

    it('should call announceAttachmentRemoved with file name', () => {
      const a1 = makeAttachment('a1', 'image', 'photo.jpg');
      const self = makeSelf([a1]);
      handleRemoveAttachmentImpl(self, a1);
      expect(self.announceAttachmentRemoved).toHaveBeenCalledWith('photo.jpg');
    });

    it('should revoke thumbnailUrl when present', () => {
      const a1 = makeAttachment('a1', 'image');
      a1.thumbnailUrl = 'blob:http://localhost/test';
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const self = makeSelf([a1]);
      handleRemoveAttachmentImpl(self, a1);
      expect(revokeSpy).toHaveBeenCalledWith('blob:http://localhost/test');
      revokeSpy.mockRestore();
    });
  });

  // ==================== handleAttachmentButtonClickImpl ====================

  describe('handleAttachmentButtonClickImpl', () => {
    it('should call toggleAttachmentMenu', () => {
      const self = makeSelf();
      handleAttachmentButtonClickImpl(self);
      expect(self.toggleAttachmentMenu).toHaveBeenCalled();
    });
  });

  // ==================== handleAttachmentOptionClickImpl ====================

  describe('handleAttachmentOptionClickImpl', () => {
    it('should set contentToDisplay to none', () => {
      const self = makeSelf();
      handleAttachmentOptionClickImpl(self, 'polls');
      expect(self.contentToDisplay.set).toHaveBeenCalledWith('none');
    });

    it('should call openPollModal for polls option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'polls');
      expect(self.openPollModal).toHaveBeenCalled();
    });

    it('should call createCollaborativeDocument for collaborative-document option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'collaborative-document');
      expect(self.createCollaborativeDocument).toHaveBeenCalled();
    });

    it('should call createCollaborativeWhiteboard for collaborative-whiteboard option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'collaborative-whiteboard');
      expect(self.createCollaborativeWhiteboard).toHaveBeenCalled();
    });

    it('should not throw for unknown option', () => {
      const self = makeSelf();
      expect(() => handleAttachmentOptionClickImpl(self, 'unknown-option')).not.toThrow();
    });

    it('should not throw when fileInputRef is null for file options', () => {
      const self = makeSelf([], { fileInputRef: null });
      expect(() => handleAttachmentOptionClickImpl(self, 'image')).not.toThrow();
    });

    it('should click file input for image option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'image');
      expect(fileInput.accept).toBe('image/*');
      expect(fileInput.click).toHaveBeenCalled();
    });

    it('should click file input for video option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'video');
      expect(fileInput.accept).toBe('video/*');
      expect(fileInput.click).toHaveBeenCalled();
    });

    it('should click file input for audio option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'audio');
      expect(fileInput.accept).toBe('audio/*');
    });

    it('should click file input for file option', () => {
      const fileInput = { accept: '', click: vi.fn() };
      const self = makeSelf([], { fileInputRef: { nativeElement: fileInput } });
      handleAttachmentOptionClickImpl(self, 'file');
      expect(fileInput.accept).toBe('*/*');
    });
  });
});
