import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatAttachmentTileComponent } from '../cometchat-attachment-tile';
import {
  CometChatFullScreenViewerComponent,
  FullscreenViewerMediaType,
} from '../base-elements/cometchat-fullscreen-viewer';
import { MediaUploadTrayService } from '../../services/media-upload-tray.service';
import type { AttachmentFile } from '../cometchat-message-composer/cometchat-message-composer.types';

interface ViewerState {
  open: boolean;
  url: string;
  mediaType: FullscreenViewerMediaType;
  fileName: string;
}

/**
 * CometChatAttachmentTray
 *
 * Composer staging strip. Renders the staged tiles from `MediaUploadTrayService`,
 * shows the byte-weighted aggregate bar, maps tile actions to the service, and
 * opens a successful media tile in the fullscreen viewer. Visible only when the
 * tray has ≥1 tile. Internal — not exported from `public-api.ts`.
 */
@Component({
  selector: 'cometchat-attachment-tray',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TranslatePipe,
    CometChatAttachmentTileComponent,
    CometChatFullScreenViewerComponent,
  ],
  templateUrl: './cometchat-attachment-tray.component.html',
  styleUrls: ['./cometchat-attachment-tray.component.css'],
})
export class CometChatAttachmentTrayComponent implements OnDestroy {
  /** Same composer-scoped instance the composer provides (U5). */
  readonly tray = inject(MediaUploadTrayService);

  @Output() error = new EventEmitter<CometChat.CometChatException>();

  private readonly _viewer = signal<ViewerState>({
    open: false,
    url: '',
    mediaType: 'image',
    fileName: '',
  });
  readonly viewer = this._viewer.asReadonly();

  /** A fresh object URL created for the viewer (video playback) — revoked on close. */
  private viewerObjectUrl: string | null = null;

  /** Open a successful media tile in the fullscreen viewer (single item). */
  openViewer(tile: AttachmentFile): void {
    this.revokeViewerObjectUrl();

    let url: string;
    if (tile.type === 'video' && tile.file && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      // The tile thumbnail for a video is a still-frame POSTER image — not playable. The viewer
      // needs the actual video, so create a fresh (playable) object URL from the local file.
      url = URL.createObjectURL(tile.file);
      this.viewerObjectUrl = url;
    } else {
      // Images use their shared local thumbnail (do NOT revoke it — the tile still displays it).
      url = tile.thumbnailUrl || (tile.attachment ? tile.attachment.getUrl() : '');
    }
    if (!url) {
      return;
    }
    this._viewer.set({
      open: true,
      url,
      mediaType: tile.type,
      fileName: tile.name,
    });
  }

  closeViewer(): void {
    this._viewer.set({ ...this._viewer(), open: false });
    this.revokeViewerObjectUrl();
  }

  /** The viewer may still be open when the composer tears down (e.g. conversation switch). */
  ngOnDestroy(): void {
    this.revokeViewerObjectUrl();
  }

  private revokeViewerObjectUrl(): void {
    if (this.viewerObjectUrl && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(this.viewerObjectUrl);
      } catch {
        /* ignore */
      }
    }
    this.viewerObjectUrl = null;
  }
}
