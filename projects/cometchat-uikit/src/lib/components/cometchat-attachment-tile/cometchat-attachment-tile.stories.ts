import type { Meta, StoryObj } from '@storybook/angular';
import { CometChatAttachmentTileComponent } from './cometchat-attachment-tile.component';
import type { AttachmentFile } from '../cometchat-message-composer/cometchat-message-composer.types';

const THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='72'%3E%3Crect width='72' height='72' fill='%236852D6'/%3E%3C/svg%3E";

function tile(over: Partial<AttachmentFile> = {}): AttachmentFile {
  return {
    id: '1',
    fileId: '1',
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

const meta: Meta<CometChatAttachmentTileComponent> = {
  title: 'Components/CometChatAttachmentTile',
  component: CometChatAttachmentTileComponent,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<CometChatAttachmentTileComponent>;

export const ImageUploaded: Story = { args: { tile: tile() } };

export const ImageUploading: Story = {
  args: { tile: tile({ status: 'uploading', uploadProgress: 60 }) },
};

export const VideoUploaded: Story = {
  args: { tile: tile({ type: 'video', name: 'clip.mp4', mimeType: 'video/mp4' }) },
};

export const FileUploaded: Story = {
  args: {
    tile: tile({
      type: 'file',
      name: 'Invoice 45821.pdf',
      mimeType: 'application/pdf',
      thumbnailUrl: undefined,
    }),
  },
};

export const FileRejected: Story = {
  args: {
    tile: tile({
      type: 'file',
      name: 'huge-archive.zip',
      mimeType: 'application/zip',
      status: 'rejected',
      errorMessage: 'File exceeds the size limit',
      thumbnailUrl: undefined,
    }),
  },
};

export const FileFailedRetry: Story = {
  args: {
    tile: tile({
      type: 'file',
      name: 'report.pdf',
      mimeType: 'application/pdf',
      status: 'failed',
      errorMessage: 'Upload failed',
      thumbnailUrl: undefined,
    }),
  },
};

export const AudioUploaded: Story = {
  args: {
    tile: tile({
      type: 'audio',
      name: 'ringtone.mp3',
      mimeType: 'audio/mpeg',
      thumbnailUrl: undefined,
    }),
  },
};

/** Ring around the play disc; the seek bar and time stay visible beneath it. */
export const AudioUploading: Story = {
  args: {
    tile: tile({
      type: 'audio',
      name: 'Watch by Billie.mp3',
      mimeType: 'audio/mpeg',
      thumbnailUrl: undefined,
      status: 'uploading',
      uploadProgress: 35,
    }),
  },
};

/** Retryable: red border, "Tap to retry" in place of the bar, retry badge in the corner. */
export const AudioFailedRetry: Story = {
  args: {
    tile: tile({
      type: 'audio',
      name: 'Watch by Billie.mp3',
      mimeType: 'audio/mpeg',
      thumbnailUrl: undefined,
      status: 'failed',
    }),
  },
};

/** Terminal: red border, "Upload failed", non-interactive error badge in the corner. */
export const AudioRejected: Story = {
  args: {
    tile: tile({
      type: 'audio',
      name: 'Watch by Billie.mp3',
      mimeType: 'audio/mpeg',
      thumbnailUrl: undefined,
      status: 'rejected',
    }),
  },
};
