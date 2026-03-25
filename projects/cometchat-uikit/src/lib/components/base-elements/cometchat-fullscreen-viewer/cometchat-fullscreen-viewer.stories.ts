/**
 * CometChatFullScreenViewer Storybook Stories
 *
 * The fullscreen viewer uses position:fixed by default. Stories override
 * --cometchat-fullscreen-viewer-position to 'relative' so the component
 * renders inline within the Storybook docs page.
 *
 * @module components/cometchat-fullscreen-viewer
 */

import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CommonModule } from '@angular/common';
import { CometChatFullScreenViewerComponent } from './cometchat-fullscreen-viewer.component';
import { MediaAttachment } from '../../../modals/MediaAttachment';
import { TranslatePipe } from '../../../resources/CometChatLocalize/translate.pipe';
import { MOCK_AVATARS } from '../../../../../../../.storybook/utils/mock-data';

// ============================================
// Mock Data
// ============================================

const SAMPLE_IMAGES = {
  landscape1: 'https://placehold.co/1920x1080/6852D6/FFFFFF?text=Landscape+1',
  landscape2: 'https://placehold.co/1920x1080/0B7BEA/FFFFFF?text=Landscape+2',
  landscape3: 'https://placehold.co/1920x1080/09C26F/FFFFFF?text=Landscape+3',
  portrait1: 'https://placehold.co/1080x1920/6852D6/FFFFFF?text=Portrait+1',
  square1: 'https://placehold.co/1080x1080/09C26F/FFFFFF?text=Square+1',
};

const SAMPLE_VIDEOS = {
  video1: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  video2: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
};


/**
 * Wrapper style that overrides position:fixed to relative so the viewer
 * renders inline in Storybook docs. Also constrains height.
 */
const VIEWER_WRAPPER_STYLE = `
  --cometchat-fullscreen-viewer-position: relative;
  --cometchat-fullscreen-viewer-z-index: 1;
  --cometchat-fullscreen-viewer-width: 100%;
  --cometchat-fullscreen-viewer-height: 500px;
  width: 100%;
  height: 500px;
  overflow: hidden;
  border-radius: var(--cometchat-radius-3, 8px);
`;

// ============================================
// Meta Configuration
// ============================================

const meta: Meta<CometChatFullScreenViewerComponent> = {
  title: 'Components/Misc/FullScreen Viewer',
  component: CometChatFullScreenViewerComponent,
  tags: ['!autodocs', '!dev'],
  decorators: [
    moduleMetadata({
      imports: [CommonModule, TranslatePipe],
    }),
  ],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls viewer visibility',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    attachments: {
      control: false,
      description: 'Array of media attachments for gallery mode',
      table: { type: { summary: 'MediaAttachment[]' } },
    },
    startIndex: {
      control: 'number',
      description: 'Starting index for gallery mode',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    url: {
      control: 'text',
      description: 'Single media URL (backward compatible)',
      table: { type: { summary: 'string' } },
    },
    mediaType: {
      control: 'select',
      options: ['image', 'video', 'audio', 'file'],
      description: 'Media type for single mode',
      table: { type: { summary: "'image' | 'video' | 'audio' | 'file'" }, defaultValue: { summary: "'image'" } },
    },
    explicitSenderName: {
      control: 'text',
      description: 'Sender name displayed in header',
      table: { type: { summary: 'string' } },
    },
    explicitSenderAvatarUrl: {
      control: 'text',
      description: 'Sender avatar URL displayed in header',
      table: { type: { summary: 'string' } },
    },
    closeClick: {
      action: 'closeClick',
      description: 'Emitted when close button is clicked or Escape is pressed',
      table: { type: { summary: 'EventEmitter<void>' }, category: 'Events' },
    },
    downloadClick: {
      action: 'downloadClick',
      description: 'Emitted when download button is clicked',
      table: { type: { summary: 'EventEmitter<MediaAttachment | string>' }, category: 'Events' },
    },
    indexChange: {
      action: 'indexChange',
      description: 'Emitted when gallery index changes',
      table: { type: { summary: 'EventEmitter<number>' }, category: 'Events' },
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CometChatFullScreenViewer is a fullscreen overlay media viewer. Supports single media and gallery-style navigation with keyboard support (ArrowLeft, ArrowRight, Escape). Previews below are rendered inline with constrained height.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<CometChatFullScreenViewerComponent>;


// ============================================
// Stories
// ============================================

/** Default fullscreen viewer with a single image. */
export const Default: Story = {
  render: (args) => ({
    props: {
      ...args,
      noOp: () => {},
    },
    template: `
      <div style="${VIEWER_WRAPPER_STYLE}">
        <cometchat-fullscreen-viewer
          [isOpen]="true"
          [url]="url"
          [mediaType]="mediaType"
          [explicitSenderName]="explicitSenderName"
          [explicitSenderAvatarUrl]="explicitSenderAvatarUrl"
          (closeClick)="noOp()"
          (downloadClick)="noOp()"
        ></cometchat-fullscreen-viewer>
      </div>
    `,
  }),
  args: {
    url: SAMPLE_IMAGES.landscape1,
    mediaType: 'image',
    explicitSenderName: 'John Doe',
    explicitSenderAvatarUrl: MOCK_AVATARS.andrewJoseph,
  },
  parameters: {
    docs: {
      description: {
        story: 'Single image viewer with sender info. Rendered inline with constrained height.',
      },
    },
  },
};

/** Single image display using the backward-compatible url input. */
export const SingleImage: Story = {
  render: (args) => ({
    props: {
      ...args,
      noOp: () => {},
    },
    template: `
      <div style="${VIEWER_WRAPPER_STYLE}">
        <cometchat-fullscreen-viewer
          [isOpen]="true"
          [url]="url"
          [mediaType]="'image'"
          [explicitSenderName]="explicitSenderName"
          [explicitSenderAvatarUrl]="explicitSenderAvatarUrl"
          (closeClick)="noOp()"
          (downloadClick)="noOp()"
        ></cometchat-fullscreen-viewer>
      </div>
    `,
  }),
  args: {
    url: SAMPLE_IMAGES.portrait1,
    explicitSenderName: 'Jane Smith',
  },
  parameters: {
    docs: {
      description: {
        story: 'Single image display using the backward-compatible url input.',
      },
    },
  },
};

/** Image gallery with multiple images and keyboard navigation. */
export const ImageGallery: Story = {
  render: (args) => ({
    props: {
      ...args,
      noOp: () => {},
      galleryAttachments: [
        { url: SAMPLE_IMAGES.landscape1, type: 'image', name: 'landscape1.jpg' },
        { url: SAMPLE_IMAGES.landscape2, type: 'image', name: 'landscape2.jpg' },
        { url: SAMPLE_IMAGES.landscape3, type: 'image', name: 'landscape3.jpg' },
        { url: SAMPLE_IMAGES.portrait1, type: 'image', name: 'portrait1.jpg' },
        { url: SAMPLE_IMAGES.square1, type: 'image', name: 'square1.jpg' },
      ] as MediaAttachment[],
    },
    template: `
      <div style="${VIEWER_WRAPPER_STYLE}">
        <cometchat-fullscreen-viewer
          [isOpen]="true"
          [attachments]="galleryAttachments"
          [startIndex]="0"
          [explicitSenderName]="explicitSenderName"
          [explicitSenderAvatarUrl]="explicitSenderAvatarUrl"
          (closeClick)="noOp()"
          (downloadClick)="noOp()"
          (indexChange)="noOp()"
        ></cometchat-fullscreen-viewer>
      </div>
    `,
  }),
  args: {
    explicitSenderName: 'Sarah Wilson',
  },
  parameters: {
    docs: {
      description: {
        story: 'Image gallery with ArrowLeft/ArrowRight navigation across 5 images.',
      },
    },
  },
};

/** Single video display with HTML5 controls. */
export const SingleVideo: Story = {
  render: (args) => ({
    props: {
      ...args,
      noOp: () => {},
    },
    template: `
      <div style="${VIEWER_WRAPPER_STYLE}">
        <cometchat-fullscreen-viewer
          [isOpen]="true"
          [url]="url"
          [mediaType]="'video'"
          [explicitSenderName]="explicitSenderName"
          [explicitSenderAvatarUrl]="explicitSenderAvatarUrl"
          (closeClick)="noOp()"
          (downloadClick)="noOp()"
        ></cometchat-fullscreen-viewer>
      </div>
    `,
  }),
  args: {
    url: SAMPLE_VIDEOS.video1,
    explicitSenderName: 'Bob Johnson',
  },
  parameters: {
    docs: {
      description: {
        story: 'Single video display. Video plays with HTML5 controls.',
      },
    },
  },
};

/** Mixed gallery with images and videos. */
export const MixedGallery: Story = {
  render: (args) => ({
    props: {
      ...args,
      noOp: () => {},
      mixedAttachments: [
        { url: SAMPLE_IMAGES.landscape1, type: 'image', name: 'photo1.jpg' },
        { url: SAMPLE_VIDEOS.video1, type: 'video', name: 'video1.mp4' },
        { url: SAMPLE_IMAGES.landscape2, type: 'image', name: 'photo2.jpg' },
        { url: SAMPLE_VIDEOS.video2, type: 'video', name: 'video2.mp4' },
        { url: SAMPLE_IMAGES.portrait1, type: 'image', name: 'photo3.jpg' },
      ] as MediaAttachment[],
    },
    template: `
      <div style="${VIEWER_WRAPPER_STYLE}">
        <cometchat-fullscreen-viewer
          [isOpen]="true"
          [attachments]="mixedAttachments"
          [startIndex]="0"
          [explicitSenderName]="explicitSenderName"
          [explicitSenderAvatarUrl]="explicitSenderAvatarUrl"
          (closeClick)="noOp()"
          (downloadClick)="noOp()"
          (indexChange)="noOp()"
        ></cometchat-fullscreen-viewer>
      </div>
    `,
  }),
  args: {
    explicitSenderName: 'David Lee',
  },
  parameters: {
    docs: {
      description: {
        story: 'Mixed gallery with images and videos. Videos stop playing when navigating away.',
      },
    },
  },
};
