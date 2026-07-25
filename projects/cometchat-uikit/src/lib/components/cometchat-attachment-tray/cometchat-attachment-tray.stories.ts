import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular';
import { signal } from '@angular/core';
import { CometChatAttachmentTrayComponent } from './cometchat-attachment-tray.component';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import type { AttachmentFile } from '../cometchat-message-composer/cometchat-message-composer.types';

const THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Crect width='72' height='72' fill='%236852D6'/%3E%3C/svg%3E";

function tile(over: Partial<AttachmentFile> = {}): AttachmentFile {
  return {
    id: over.fileId ?? 'f',
    fileId: over.fileId ?? 'f',
    file: new File([new Uint8Array(1)], over.name ?? 'photo.png'),
    type: 'image',
    name: 'photo.png',
    size: 1024,
    mimeType: 'image/png',
    uploadProgress: 100,
    status: 'uploaded',
    thumbnailUrl: THUMB,
    ...over,
  } as AttachmentFile;
}

function trayStub(
  tiles: AttachmentFile[],
  agg: { loaded: number; total: number; percent: number },
) {
  return {
    tiles: signal(tiles),
    hasTiles: signal(tiles.length > 0),
    aggregate: signal(agg),
    notice: signal<string | null>(null),
    cancel: () => undefined,
    remove: () => undefined,
    retry: () => undefined,
  } as unknown as MediaUploadTrayService;
}

function withTray(
  tiles: AttachmentFile[],
  agg = { loaded: 0, total: 0, percent: 0 },
) {
  return moduleMetadata({
    providers: [{ provide: MediaUploadTrayService, useValue: trayStub(tiles, agg) }],
  });
}

const meta: Meta<CometChatAttachmentTrayComponent> = {
  title: 'Components/CometChatAttachmentTray',
  component: CometChatAttachmentTrayComponent,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<CometChatAttachmentTrayComponent>;

export const Uploading: Story = {
  decorators: [
    withTray(
      [
        tile({ fileId: '1', status: 'uploading', uploadProgress: 72 }),
        tile({ fileId: '2', status: 'uploaded' }),
        tile({
          fileId: '3',
          type: 'file',
          name: 'Invoice 45821.pdf',
          mimeType: 'application/pdf',
          thumbnailUrl: undefined,
          status: 'uploading',
          uploadProgress: 20,
        }),
      ],
      { loaded: 41, total: 98, percent: 42 },
    ),
  ],
};

export const AllUploaded: Story = {
  decorators: [
    withTray(
      [
        tile({ fileId: '1' }),
        tile({ fileId: '2', type: 'video', name: 'clip.mp4', mimeType: 'video/mp4' }),
      ],
      { loaded: 10, total: 10, percent: 100 },
    ),
  ],
};

export const WithRejected: Story = {
  decorators: [
    withTray(
      [
        tile({ fileId: '1' }),
        tile({
          fileId: '2',
          type: 'file',
          name: 'huge-archive.zip',
          mimeType: 'application/zip',
          thumbnailUrl: undefined,
          status: 'rejected',
          errorMessage: 'File exceeds the size limit',
        }),
      ],
      { loaded: 10, total: 10, percent: 100 },
    ),
  ],
};

/** Tiles for a mixed batch of every supported media type, all uploaded and ready to send. */
const MIXED_BATCH: AttachmentFile[] = [
  tile({ fileId: '1', type: 'image', name: 'sunset.jpg', mimeType: 'image/jpeg' }),
  tile({ fileId: '2', type: 'video', name: 'clip.mp4', mimeType: 'video/mp4' }),
  tile({ fileId: '3', type: 'audio', name: 'voice-memo.mp3', mimeType: 'audio/mpeg', thumbnailUrl: undefined }),
  tile({ fileId: '4', type: 'file', name: 'proposal.pdf', mimeType: 'application/pdf', thumbnailUrl: undefined }),
];

/**
 * The flagship multi-attachment scenario: image, video, audio, and file staged together.
 * On send, the composer groups these by type and delivers one message per type-group.
 */
export const MixedMediaBatch: Story = {
  decorators: [withTray(MIXED_BATCH, { loaded: 20, total: 20, percent: 100 })],
  parameters: {
    docs: {
      description: {
        story:
          'Several attachments of different types staged together — the flagship batch the multi-attachment composer sends as one message per type-group.',
      },
    },
  },
};

/**
 * The staging tray shown inside the message composer's chrome: staged tiles sit above the
 * input row until the user sends them. (The tray is the same component the composer embeds;
 * the surrounding frame here is illustrative context only.)
 */
export const InComposerContext: Story = {
  decorators: [
    withTray(MIXED_BATCH, { loaded: 20, total: 20, percent: 100 }),
    componentWrapperDecorator(
      story => `
        <div style="max-width:480px;border:1px solid var(--cometchat-border-color-default, #E8E8E8);
                    border-radius:12px;overflow:hidden;font-family:'Inter',system-ui,sans-serif;">
          ${story}
          <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;">
            <span style="font-size:20px;line-height:1;">😊</span>
            <span style="flex:1;color:var(--cometchat-text-color-tertiary, #A1A1A1);">Type a message...</span>
            <span style="font-size:20px;line-height:1;">📎</span>
            <span style="font-size:20px;line-height:1;">🎤</span>
          </div>
        </div>`,
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'The staging tray as it appears inside the message composer — staged tiles sit above the input row until they are sent as a batch. The input row shown here is illustrative framing.',
      },
    },
  },
};
