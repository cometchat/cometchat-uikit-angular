/**
 * Modals / Data Structures Tests
 *
 * Categories: CometChatActions, CometChatActionsIcon, CometChatActionsView,
 *             CometChatOption, CometChatMessageComposerAction,
 *              SelectionState, Attachment Interfaces,
 *             Property-Based Tests
 * Validates: Requirements 8.1, 8.6, 14.4, 14.5, 15.7
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({ default: {} }));

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fc from 'fast-check';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { CometChatActions } from './CometChatActions';
import { CometChatActionsIcon } from './CometChatActionsIcon';
import { CometChatActionsView } from './CometChatActionsView';
import { CometChatOption } from './CometChatOption';
import { CometChatMessageComposerAction } from './CometChatMessageComposerAction';
import { SelectionMode } from '../Enums/Enums';
import type { SelectionState } from './SelectionState';
import type { AudioAttachment } from './AudioAttachment';
import type { FileAttachment } from './FileAttachment';
import type { MediaAttachment, MediaLayoutType } from './MediaAttachment';

beforeAll(async () => {
  await ensureSdkReady();
});

afterAll(async () => {
  await sdkCleanup();
});

// ---------------------------------------------------------------------------
// CometChatActions
// ---------------------------------------------------------------------------
describe('CometChatActions', () => {
  it('should instantiate with required properties', () => {
    const action = new CometChatActions({ id: 'action-1', title: 'Delete' });
    expect(action.id).toBe('action-1');
    expect(action.title).toBe('Delete');
    expect(action.iconURL).toBeUndefined();
  });

  it('should accept optional iconURL', () => {
    const action = new CometChatActions({
      id: 'action-2',
      title: 'Edit',
      iconURL: 'https://example.com/edit.png',
    });
    expect(action.iconURL).toBe('https://example.com/edit.png');
  });
});

// ---------------------------------------------------------------------------
// CometChatActionsIcon
// ---------------------------------------------------------------------------
describe('CometChatActionsIcon', () => {
  it('should instantiate with all required properties', () => {
    const clickHandler = (_id: number) => {};
    const action = new CometChatActionsIcon({
      id: 'icon-1',
      title: 'React',
      iconURL: 'https://example.com/react.png',
      onClick: clickHandler,
    });
    expect(action.id).toBe('icon-1');
    expect(action.title).toBe('React');
    expect(action.iconURL).toBe('https://example.com/react.png');
    expect(action.onClick).toBe(clickHandler);
  });

  it('should extend CometChatActions', () => {
    const action = new CometChatActionsIcon({
      id: 'icon-2',
      title: 'Reply',
      iconURL: 'https://example.com/reply.png',
      onClick: () => {},
    });
    expect(action).toBeInstanceOf(CometChatActions);
  });

  it('should invoke onClick with message id', () => {
    let receivedId: number | undefined;
    const action = new CometChatActionsIcon({
      id: 'icon-3',
      title: 'Forward',
      iconURL: 'https://example.com/forward.png',
      onClick: (id: number) => {
        receivedId = id;
      },
    });
    action.onClick(42);
    expect(receivedId).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// CometChatActionsView
// ---------------------------------------------------------------------------
describe('CometChatActionsView', () => {
  it('should instantiate with required properties only', () => {
    const action = new CometChatActionsView({ id: 'view-1', title: 'Custom View' });
    expect(action.id).toBe('view-1');
    expect(action.title).toBe('Custom View');
    expect(action.iconURL).toBeUndefined();
    expect(action.customView).toBeUndefined();
  });

  it('should accept optional iconURL and customView', () => {
    const mockTemplate = {} as any;
    const action = new CometChatActionsView({
      id: 'view-2',
      title: 'AI Assist',
      iconURL: 'https://example.com/ai.png',
      customView: mockTemplate,
    });
    expect(action.iconURL).toBe('https://example.com/ai.png');
    expect(action.customView).toBe(mockTemplate);
  });

  it('should extend CometChatActions', () => {
    const action = new CometChatActionsView({ id: 'view-3', title: 'Test' });
    expect(action).toBeInstanceOf(CometChatActions);
  });

  it('should accept a function as customView', () => {
    const viewFactory = (_callbacks: any) => ({}) as any;
    const action = new CometChatActionsView({
      id: 'view-4',
      title: 'Dynamic',
      customView: viewFactory,
    });
    expect(typeof action.customView).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// CometChatOption
// ---------------------------------------------------------------------------
describe('CometChatOption', () => {
  it('should instantiate with default values', () => {
    const option = new CometChatOption({});
    expect(option.id).toBe('');
    expect(option.title).toBe('');
    expect(option.iconURL).toBe('');
    expect(option.onClick).toBeUndefined();
  });

  it('should assign all properties via constructor', () => {
    const clickFn = () => {};
    const option = new CometChatOption({
      id: 'opt-1',
      title: 'Delete',
      iconURL: 'https://example.com/delete.png',
      onClick: clickFn,
    });
    expect(option.id).toBe('opt-1');
    expect(option.title).toBe('Delete');
    expect(option.iconURL).toBe('https://example.com/delete.png');
    expect(option.onClick).toBe(clickFn);
  });

  it('should allow partial property assignment', () => {
    const option = new CometChatOption({ id: 'opt-2', title: 'Edit' });
    expect(option.id).toBe('opt-2');
    expect(option.title).toBe('Edit');
    expect(option.iconURL).toBe('');
    expect(option.onClick).toBeUndefined();
  });

  it('should invoke onClick when called', () => {
    let clicked = false;
    const option = new CometChatOption({
      onClick: () => {
        clicked = true;
      },
    });
    option.onClick!();
    expect(clicked).toBe(true);
  });
});


// ---------------------------------------------------------------------------
// CometChatMessageComposerAction
// ---------------------------------------------------------------------------
describe('CometChatMessageComposerAction', () => {
  it('should instantiate with default values', () => {
    const action = new CometChatMessageComposerAction({});
    expect(action.id).toBe('');
    expect(action.iconURL).toBe('');
    expect(action.onClick).toBeNull();
    expect(action.title).toBe('');
  });

  it('should assign all properties', () => {
    const clickFn = () => {};
    const action = new CometChatMessageComposerAction({
      id: 'attach-1',
      iconURL: 'https://example.com/attach.png',
      onClick: clickFn,
      title: 'Attach File',
    });
    expect(action.id).toBe('attach-1');
    expect(action.iconURL).toBe('https://example.com/attach.png');
    expect(action.onClick).toBe(clickFn);
    expect(action.title).toBe('Attach File');
  });

  it('should invoke onClick when called', () => {
    let invoked = false;
    const action = new CometChatMessageComposerAction({
      onClick: () => {
        invoked = true;
      },
    });
    action.onClick!();
    expect(invoked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SelectionState (interface conformance)
// ---------------------------------------------------------------------------
describe('SelectionState', () => {
  it('should conform to the interface with single mode', () => {
    const state: SelectionState = {
      mode: SelectionMode.single,
      selectedIds: new Set(['user-1']),
      lastSelectedId: 'user-1',
    };
    expect(state.mode).toBe(SelectionMode.single);
    expect(state.selectedIds.size).toBe(1);
    expect(state.selectedIds.has('user-1')).toBe(true);
    expect(state.lastSelectedId).toBe('user-1');
  });

  it('should conform to the interface with multiple mode', () => {
    const state: SelectionState = {
      mode: SelectionMode.multiple,
      selectedIds: new Set(['a', 'b', 'c']),
      lastSelectedId: 'c',
    };
    expect(state.mode).toBe(SelectionMode.multiple);
    expect(state.selectedIds.size).toBe(3);
  });

  it('should allow null lastSelectedId', () => {
    const state: SelectionState = {
      mode: SelectionMode.single,
      selectedIds: new Set(),
      lastSelectedId: null,
    };
    expect(state.lastSelectedId).toBeNull();
    expect(state.selectedIds.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// AudioAttachment (interface conformance)
// ---------------------------------------------------------------------------
describe('AudioAttachment', () => {
  it('should conform to the interface with required fields', () => {
    const attachment: AudioAttachment = {
      url: 'https://example.com/audio.mp3',
      name: 'recording.mp3',
      size: 1024000,
      mimeType: 'audio/mpeg',
      extension: 'mp3',
    };
    expect(attachment.url).toBe('https://example.com/audio.mp3');
    expect(attachment.name).toBe('recording.mp3');
    expect(attachment.size).toBe(1024000);
    expect(attachment.mimeType).toBe('audio/mpeg');
    expect(attachment.extension).toBe('mp3');
    expect(attachment.duration).toBeUndefined();
    expect(attachment.raw).toBeUndefined();
  });

  it('should accept optional duration', () => {
    const attachment: AudioAttachment = {
      url: 'https://example.com/audio.wav',
      name: 'clip.wav',
      size: 2048,
      mimeType: 'audio/wav',
      extension: 'wav',
      duration: 120,
    };
    expect(attachment.duration).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// FileAttachment (interface conformance)
// ---------------------------------------------------------------------------
describe('FileAttachment', () => {
  it('should conform to the interface with required fields', () => {
    const attachment: FileAttachment = {
      name: 'document.pdf',
      url: 'https://example.com/document.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
      size: 512000,
    };
    expect(attachment.name).toBe('document.pdf');
    expect(attachment.url).toBe('https://example.com/document.pdf');
    expect(attachment.mimeType).toBe('application/pdf');
    expect(attachment.extension).toBe('pdf');
    expect(attachment.size).toBe(512000);
    expect(attachment.raw).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// MediaAttachment (interface conformance)
// ---------------------------------------------------------------------------
describe('MediaAttachment', () => {
  it('should conform to the interface with only required url', () => {
    const attachment: MediaAttachment = { url: 'https://example.com/image.jpg' };
    expect(attachment.url).toBe('https://example.com/image.jpg');
    expect(attachment.type).toBeUndefined();
    expect(attachment.name).toBeUndefined();
    expect(attachment.thumbnail).toBeUndefined();
    expect(attachment.width).toBeUndefined();
    expect(attachment.height).toBeUndefined();
  });

  it('should accept all optional fields for an image', () => {
    const attachment: MediaAttachment = {
      url: 'https://example.com/photo.png',
      type: 'image',
      name: 'photo.png',
      width: 1920,
      height: 1080,
      size: 3000000,
      mimeType: 'image/png',
    };
    expect(attachment.type).toBe('image');
    expect(attachment.width).toBe(1920);
    expect(attachment.height).toBe(1080);
  });

  it('should accept video-specific fields', () => {
    const attachment: MediaAttachment = {
      url: 'https://example.com/video.mp4',
      type: 'video',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: 60,
    };
    expect(attachment.type).toBe('video');
    expect(attachment.thumbnail).toBe('https://example.com/thumb.jpg');
    expect(attachment.duration).toBe(60);
  });

  it('should support MediaLayoutType values', () => {
    const layouts: MediaLayoutType[] = ['single', 'grid', 'grid-2x2', 'overflow'];
    expect(layouts).toHaveLength(4);
    expect(layouts).toContain('single');
    expect(layouts).toContain('overflow');
  });
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------
describe('Modal constructor round-trip (property-based)', () => {
  it('CometChatActions: instantiation preserves id and title', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (id, title) => {
        const action = new CometChatActions({ id, title });
        expect(action.id).toBe(id);
        expect(action.title).toBe(title);
      })
    );
  });

  it('CometChatActions: instantiation preserves optional iconURL', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (id, title, iconURL) => {
        const action = new CometChatActions({ id, title, iconURL });
        expect(action.iconURL).toBe(iconURL);
      })
    );
  });

  it('CometChatOption: instantiation and readback returns the same values', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (id, title, iconURL) => {
        const option = new CometChatOption({ id, title, iconURL });
        expect(option.id).toBe(id);
        expect(option.title).toBe(title);
        expect(option.iconURL).toBe(iconURL);
      })
    );
  });

  it('CometChatMessageComposerAction: instantiation and readback returns the same values', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (id, title, iconURL) => {
        const action = new CometChatMessageComposerAction({ id, title, iconURL });
        expect(action.id).toBe(id);
        expect(action.title).toBe(title);
        expect(action.iconURL).toBe(iconURL);
      })
    );
  });


});
