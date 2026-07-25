import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  Injectable,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../resources/CometChatLocalize/translate.pipe';
import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { getFileType, getFileIcon, formatFileSize, resolveFileExtension } from '../cometchat-file-bubble/cometchat-file-bubble.types';
import type { FileAttachment } from '../../modals/FileAttachment';
import type {
  AttachmentFile,
  AttachmentTileStatus,
} from '../cometchat-message-composer/cometchat-message-composer.types';

/**
 * Ensures at most one tray audio tile plays at a time. Pausing the previously-active element fires
 * its native `pause` event, which keeps that tile's play/pause icon in sync (OnPush-safe).
 */
@Injectable({ providedIn: 'root' })
export class TrayAudioCoordinatorService {
  private active: HTMLAudioElement | null = null;

  play(el: HTMLAudioElement): void {
    if (this.active && this.active !== el) {
      this.active.pause();
    }
    this.active = el;
  }

  release(el: HTMLAudioElement): void {
    if (this.active === el) {
      this.active = null;
    }
  }
}

/** What the centre of a tile shows for a given upload status. */
export type TileAffordance = 'progress' | 'retry' | 'error' | 'none';

/**
 * Pure mapping status -> centre affordance. Exported for property tests (NFR-2).
 * - progress : in flight (uploading/pending)
 * - retry    : failed (retryable)
 * - error    : rejected (not retryable)
 * - none     : uploaded / cancelled (nothing in the centre)
 */
export function affordanceFor(status: AttachmentTileStatus): TileAffordance {
  switch (status) {
    case 'uploading':
    case 'pending':
      return 'progress';
    case 'failed':
      return 'retry';
    case 'rejected':
    case 'error':
      return 'error';
    case 'uploaded':
    case 'cancelled':
    default:
      return 'none';
  }
}

/** Precomputed, template-friendly view of a tile (no function calls in the template). */
interface TileView {
  isImage: boolean;
  isVideo: boolean;
  isFile: boolean;
  isAudio: boolean;
  isMediaSquare: boolean;
  affordance: TileAffordance;
  isUploading: boolean;
  /** Failed and retryable — the top-right badge becomes a retry control. */
  canRetry: boolean;
  /** Rejected — terminal, not retryable; the top-right badge becomes an error indicator. */
  isRejected: boolean;
  /** Either error state: draws the red border and swaps the card's meta line for status text. */
  hasError: boolean;
  /**
   * Whether the centre progress ring is present. Only while the upload is in flight — error states
   * are shown by the border, the centred retry/error badge and the inline text instead.
   */
  hasOverlay: boolean;
  /**
   * Whether the ring spins as a continuous (indeterminate) arc instead of filling by percentage.
   * An upload that hasn't reported any progress yet has nothing to fill, so a determinate ring would
   * sit at 0% and read as frozen; it flips to the real progressive arc on the first progress event.
   */
  isIndeterminate: boolean;
  /**
   * Whether the centre scrim (dark tint over the icon) is present — behind the progress ring while
   * uploading, and behind the retry/error badge in an error state, so the centred affordance always
   * reads on a dimmed backdrop rather than floating over the raw icon/text.
   */
  hasScrim: boolean;
  /** Localization key for the inline status line, or '' when the normal meta line shows. */
  statusTextKey: string;
  /**
   * The upload error surfaced on hover, only for a REJECTED (terminal) tile — the SDK/API message
   * when present, else a generic localized fallback. '' for every other tile (including retryable
   * ones, which show "Tap to retry" inline instead), which also gates the hover handlers so those
   * tiles never open a tooltip.
   */
  errorTooltip: string;
  clickable: boolean;
  /** Audio playback (play/pause + seek) is enabled only once the upload has succeeded. */
  clickableAudio: boolean;
  /** Card meta line, e.g. "PDF · 2.4 MB". */
  metaText: string;
  /** Dedicated colored file-type icon (PDF/Word/Excel/…) for file tiles; '' for non-files. */
  fileTypeIconUrl: string;
  /** `mm:ss` badge for video tiles once the duration is known; '' otherwise. */
  durationLabel: string;
}

/**
 * CometChatAttachmentTile
 *
 * Presentational tile for one staged attachment in the composer tray. Renders by
 * type (image/video square, file/audio card) with a status affordance
 * (progress ring / retry / error) and a top-right cancel/remove control.
 *
 * Internal component — not exported from `public-api.ts`.
 */
@Component({
  selector: 'cometchat-attachment-tile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './cometchat-attachment-tile.component.html',
  styleUrls: ['./cometchat-attachment-tile.component.css'],
})
export class CometChatAttachmentTileComponent implements OnDestroy {
  private _tile!: AttachmentFile;
  /** Precomputed view — rebuilt whenever the tile input changes. */
  view!: TileView;

  private readonly audioCoordinator = inject(TrayAudioCoordinatorService);
  private readonly cdr = inject(ChangeDetectorRef);
  @ViewChild('audioEl') private audioElRef?: ElementRef<HTMLAudioElement>;

  @Input({ required: true })
  set tile(value: AttachmentFile) {
    this._tile = value;
    this.view = this.buildView(value);
    // Audio tiles are playable in the tray — create a local (playable) object URL once per file.
    if (
      value.type === 'audio' &&
      !this.audioSrc &&
      value.file &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        this.audioSrc = URL.createObjectURL(value.file);
      } catch {
        /* ignore — no local playback */
      }
    }
  }
  get tile(): AttachmentFile {
    return this._tile;
  }

  ngOnDestroy(): void {
    this.cancelTooltipFrame();
    if (this.audioElRef?.nativeElement) {
      this.audioCoordinator.release(this.audioElRef.nativeElement);
    }
    if (this.audioSrc && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(this.audioSrc);
      } catch {
        /* ignore */
      }
    }
  }

  @Output() cancelClick = new EventEmitter<AttachmentFile>();
  @Output() removeClick = new EventEmitter<AttachmentFile>();
  @Output() retryClick = new EventEmitter<AttachmentFile>();
  @Output() tileClick = new EventEmitter<AttachmentFile>();

  // Monochrome icons rendered via mask-image (see svg-icons standard).
  readonly closeIconUrl = 'assets/close.svg';
  readonly playIconUrl = 'assets/play_arrow.svg';
  readonly pauseIconUrl = 'assets/pause.svg';

  // Status badges rendered as real <img> — NOT mask-image. Both SVGs bake in their own red circle
  // and white glyph; a mask would keep only the alpha channel and flatten them to a silhouette.
  readonly retryIconUrl = 'assets/retry-icon.svg';
  readonly errorIconUrl = 'assets/error-icon.svg';

  // Determinate upload-progress ring: one 32x32 geometry used over the media square, the file
  // icon box and the audio play button alike.
  readonly ringStroke = 3;
  readonly ringSize = 32;
  readonly ringRadius = 14;
  readonly ringCircumference = 2 * Math.PI * this.ringRadius;

  // ── Error tooltip state ──────────────────────────────────────────────────
  // Shown on hover/focus of a failed tile. Rendered `position: fixed` and anchored to the tile's
  // viewport rect, so it escapes the tray row's `overflow: hidden` clip and always sits ON TOP of
  // the tile instead of being cut off inside the scroll strip. The bubble is then clamped INSIDE
  // the composer's width (see positionTooltip) so a tile near either edge never pushes it past the
  // composer; the arrow slides along the bottom to stay under the tile — this is what produces the
  // bottom-left / bottom-center / bottom-right states.
  protected tooltipVisible = false;
  /** Flipped true one frame after mount, once the bubble is measured and clamped — drives the
   *  opacity fade so the jump from the raw anchor to the clamped spot is never seen. */
  protected tooltipPlaced = false;
  protected tooltipLeft = 0; // fixed-coord LEFT edge of the bubble
  protected tooltipTop = 0; // fixed-coord anchor (tile top); the bubble sits above via translateY(-100%)
  protected tooltipArrowLeft = 0; // arrow centre, px from the bubble's left edge

  @ViewChild('tooltipEl') private tooltipRef?: ElementRef<HTMLElement>;
  /** The hovered tile, remembered so the deferred placement frame can re-measure it. */
  private tooltipAnchor: HTMLElement | null = null;
  /** Pending measure-and-place frame; cancelled if the pointer leaves first. */
  private tooltipRaf = 0;
  /** Keep the bubble (and the arrow) off the composer's inner edges. */
  private static readonly TOOLTIP_EDGE_GAP = 8;
  /** Keep the arrow tucked under the rounded body rather than at the very corner. */
  private static readonly TOOLTIP_ARROW_INSET = 12;

  /** Open the tooltip above `hostEl`, but only for a failed tile that has a message to show. */
  showErrorTooltip(hostEl: HTMLElement): void {
    if (!this.view.errorTooltip) {
      return;
    }
    this.tooltipAnchor = hostEl;
    this.tooltipPlaced = false;
    this.tooltipVisible = true;
    // Render the bubble now (also resolves the #tooltipEl ViewChild) so it can be measured, then
    // clamp it on the next frame once the browser has laid it out.
    this.cdr.detectChanges();
    if (typeof requestAnimationFrame === 'function') {
      this.cancelTooltipFrame();
      this.tooltipRaf = requestAnimationFrame(() => {
        this.tooltipRaf = 0;
        this.positionTooltip();
      });
    } else {
      this.positionTooltip(); // no rAF (SSR/tests) — place synchronously
    }
  }

  hideErrorTooltip(): void {
    this.cancelTooltipFrame();
    this.tooltipVisible = false;
    this.tooltipPlaced = false;
    this.tooltipAnchor = null;
  }

  /**
   * Measure the mounted bubble and clamp it inside the composer's width. The bubble is centred over
   * the tile, then pulled fully inside `[min, max]` so it never overflows the composer; the arrow
   * then tracks the tile centre (kept under the rounded body) — giving the left / centre / right
   * arrow states purely from geometry.
   */
  private positionTooltip(): void {
    const host = this.tooltipAnchor;
    const bubble = this.tooltipRef?.nativeElement;
    if (!this.tooltipVisible || !host || !bubble) {
      return;
    }
    const tile = host.getBoundingClientRect();
    const width = bubble.offsetWidth;
    const centerX = tile.left + tile.width / 2;

    // Horizontal clamp bounds: the composer's inner width, else the viewport as a fallback.
    const gap = CometChatAttachmentTileComponent.TOOLTIP_EDGE_GAP;
    const composer = host.closest('.cometchat-message-composer') as HTMLElement | null;
    const bounds = composer?.getBoundingClientRect();
    const min = (bounds ? bounds.left : 0) + gap;
    const viewportRight =
      typeof window !== 'undefined' ? window.innerWidth : centerX + width;
    const max = (bounds ? bounds.right : viewportRight) - gap;

    // Centre over the tile, then pull fully inside [min, max]. If the bubble is wider than the
    // available width (very narrow composer), pin to the left edge — best effort.
    let left = centerX - width / 2;
    const maxLeft = max - width;
    left = maxLeft >= min ? Math.min(Math.max(left, min), maxLeft) : min;

    // Arrow follows the tile centre but stays under the rounded body.
    const inset = CometChatAttachmentTileComponent.TOOLTIP_ARROW_INSET;
    const arrow = Math.min(Math.max(centerX - left, inset), Math.max(inset, width - inset));

    this.tooltipTop = tile.top;
    this.tooltipLeft = left;
    this.tooltipArrowLeft = arrow;
    this.tooltipPlaced = true;
    this.cdr.detectChanges();
  }

  private cancelTooltipFrame(): void {
    if (this.tooltipRaf && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.tooltipRaf);
    }
    this.tooltipRaf = 0;
  }

  // ── Audio playback state (audio tiles are playable in the tray after upload) ──
  protected audioSrc = '';
  protected audioPlaying = false;
  protected audioCurrentTime = 0;
  protected audioDuration = 0;

  /** Dash offset for the given upload percent (0 → empty ring, 100 → full circle). */
  ringDashoffset(progress: number | undefined): number {
    const p = Math.max(0, Math.min(100, progress ?? 0));
    return this.ringCircumference * (1 - p / 100);
  }

  /** Fraction of the circle drawn by the indeterminate arc as it spins. */
  private static readonly INDETERMINATE_ARC = 0.25;

  /**
   * Dash pattern for the ring's fill: the whole circumference when determinate (so `ringDashoffset`
   * controls how much shows), or a short arc + a full-circumference gap when indeterminate, leaving
   * a single arc for the CSS spin animation to sweep around.
   */
  get ringDasharray(): string {
    if (!this.view.isIndeterminate) {
      return `${this.ringCircumference}`;
    }
    const arc = this.ringCircumference * CometChatAttachmentTileComponent.INDETERMINATE_ARC;
    return `${arc} ${this.ringCircumference}`;
  }

  /**
   * Play/pause. `audioPlaying` is driven by the element's native (play)/(pause) events (see template),
   * NOT set optimistically — so the icon stays correct if play() is blocked/rejected or the element
   * is auto-paused (e.g. another tile starts, or a system interruption).
   */
  toggleAudio(el: HTMLAudioElement): void {
    if (el.paused) {
      this.audioCoordinator.play(el); // pauses any other playing tray audio
      void el.play().catch(() => {
        /* playback blocked/failed — the (pause) listener keeps audioPlaying in sync */
      });
    } else {
      el.pause();
      this.audioCoordinator.release(el);
    }
  }

  onAudioLoaded(el: HTMLAudioElement): void {
    if (Number.isFinite(el.duration)) {
      this.audioDuration = el.duration;
    }
  }

  onAudioTime(el: HTMLAudioElement): void {
    this.audioCurrentTime = el.currentTime;
  }

  onAudioEnded(): void {
    this.audioPlaying = false;
    this.audioCurrentTime = 0;
    if (this.audioElRef?.nativeElement) {
      this.audioCoordinator.release(this.audioElRef.nativeElement);
    }
  }

  onAudioSeek(el: HTMLAudioElement, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    el.currentTime = value;
    this.audioCurrentTime = value;
  }

  /** `mm:ss` with zero-padded minutes (e.g. "00:07"). */
  formatTime(seconds: number): string {
    const total = !seconds || seconds < 0 || !Number.isFinite(seconds) ? 0 : Math.floor(seconds);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /** ✕ (top-right): cancel while uploading, otherwise remove. */
  onTopRightAction(): void {
    if (this.view.isUploading) {
      this.cancelClick.emit(this._tile);
    } else {
      this.removeClick.emit(this._tile);
    }
  }

  onRetry(event: Event): void {
    event.stopPropagation();
    this.retryClick.emit(this._tile);
  }

  onOpen(): void {
    if (this.view.clickable) {
      this.tileClick.emit(this._tile);
    }
  }

  onOpenKeydown(event: Event): void {
    event.preventDefault();
    this.onOpen();
  }

  private buildView(t: AttachmentFile): TileView {
    const isImage = t.type === 'image';
    const isVideo = t.type === 'video';
    const isFile = t.type === 'file';
    const isAudio = t.type === 'audio';
    const affordance = affordanceFor(t.status);
    const isUploaded = t.status === 'uploaded';
    return {
      isImage,
      isVideo,
      isFile,
      isAudio,
      isMediaSquare: isImage || isVideo,
      affordance,
      isUploading: affordance === 'progress',
      canRetry: affordance === 'retry',
      isRejected: affordance === 'error',
      hasError: affordance === 'retry' || affordance === 'error',
      hasOverlay: affordance === 'progress',
      isIndeterminate: affordance === 'progress' && !((t.uploadProgress ?? 0) > 0),
      hasScrim: affordance === 'progress' || affordance === 'retry' || affordance === 'error',
      statusTextKey:
        affordance === 'retry'
          ? 'attachment_tile_tap_to_retry'
          : affordance === 'error'
            ? 'attachment_tile_upload_failed'
            : '',
      // Only a rejected (terminal) tile gets a hover tooltip. A retryable tile already says
      // "Tap to retry" inline and offers the retry badge, so it shows no tooltip.
      errorTooltip:
        affordance === 'error'
          ? t.errorMessage?.trim() ||
            CometChatLocalize.getLocalizedString('attachment_tile_upload_failed')
          : '',
      // Only image/video open a local fullscreen preview. Audio has no preview in the tray
      // (it would only have the private/unsigned S3 URL to play, which 403s).
      clickable: isUploaded && (isImage || isVideo),
      clickableAudio: isUploaded && isAudio,
      metaText: this.deriveMeta(t),
      fileTypeIconUrl: isFile ? this.resolveFileIcon(t) : '',
      durationLabel: isVideo && t.durationSec ? this.formatTime(t.durationSec) : '',
    };
  }

  /** Dedicated file-type icon (PDF/Word/Excel/…), reusing the file-bubble's mapping. */
  private resolveFileIcon(t: AttachmentFile): string {
    const extension = resolveFileExtension(t.name, undefined);
    return getFileIcon(
      getFileType({ extension, mimeType: t.mimeType ?? '' } as unknown as FileAttachment),
    );
  }

  private deriveType(t: AttachmentFile): string {
    const fromName = t.name?.includes('.')
      ? t.name.split('.').pop()
      : undefined;
    if (fromName) {
      return fromName.toUpperCase();
    }
    const sub = (t.mimeType ?? '').split('/').pop();
    return (sub ?? 'FILE').toUpperCase();
  }

  /**
   * The card's meta line: `PDF · 2.4 MB`. The size is dropped when unknown (a staged file always
   * has one, but a rehydrated tile may not) rather than showing a bare "Size unknown".
   */
  private deriveMeta(t: AttachmentFile): string {
    const type = this.deriveType(t);
    return t.size && t.size > 0 ? `${type} · ${formatFileSize(t.size)}` : type;
  }
}
