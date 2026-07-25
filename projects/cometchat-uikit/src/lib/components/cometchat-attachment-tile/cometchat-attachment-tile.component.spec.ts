import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CometChatAttachmentTileComponent } from './cometchat-attachment-tile.component';
import type { AttachmentFile } from '../cometchat-message-composer/cometchat-message-composer.types';

function mkTile(over: Partial<AttachmentFile> = {}): AttachmentFile {
  return {
    id: 'id1',
    fileId: 'f1',
    file: new File([new Uint8Array(1)], over.name ?? 'a.png', {
      type: over.mimeType ?? 'image/png',
    }),
    type: 'image',
    name: 'a.png',
    size: 100,
    mimeType: 'image/png',
    uploadProgress: 0,
    status: 'uploading',
    ...over,
  } as AttachmentFile;
}

describe('CometChatAttachmentTileComponent', () => {
  let fixture: ComponentFixture<CometChatAttachmentTileComponent>;
  let comp: CometChatAttachmentTileComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatAttachmentTileComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CometChatAttachmentTileComponent);
    comp = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  /**
   * Assign via `setInput` rather than `comp.tile = …`: the component is OnPush, and a plain
   * property write leaves the view clean, so a SECOND detectChanges() would not re-render.
   */
  function render(tile: AttachmentFile): void {
    fixture.componentRef.setInput('tile', tile);
    fixture.detectChanges();
  }

  it('renders a media square for images', () => {
    render(mkTile({ type: 'image', status: 'uploaded' }));
    expect(el.querySelector('.cometchat-attachment-tile__media')).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__card')).toBeNull();
  });

  it('renders a card with an "EXT · size" meta line for files', () => {
    render(
      mkTile({
        type: 'file',
        name: 'Invoice.pdf',
        mimeType: 'application/pdf',
        size: 2516582, // 2.4 MB
        status: 'uploaded',
      }),
    );
    expect(el.querySelector('.cometchat-attachment-tile__card')).toBeTruthy();
    expect(
      el.querySelector('.cometchat-attachment-tile__sub')?.textContent?.trim(),
    ).toBe('PDF · 2.4 MB');
  });

  it('falls back to the bare extension when the size is unknown', () => {
    render(mkTile({ type: 'file', name: 'Invoice.pdf', mimeType: 'application/pdf', size: 0, status: 'uploaded' }));
    expect(el.querySelector('.cometchat-attachment-tile__sub')?.textContent?.trim()).toBe('PDF');
  });

  it('the file icon sits directly on the card — no white plate behind it', () => {
    render(mkTile({ type: 'file', name: 'a.pdf', mimeType: 'application/pdf', status: 'uploaded' }));
    const leading = el.querySelector('.cometchat-attachment-tile__leading') as HTMLElement;
    expect(leading).toBeTruthy();
    // The glyph is a real <img>, not a masked div, and is the leading slot's only child.
    const img = leading.querySelector('img.cometchat-attachment-tile__type-image');
    expect(img).toBeTruthy();
  });

  it('shows a centered progress ring (determinate) over a scrim and a cancel control while uploading', () => {
    render(mkTile({ type: 'image', status: 'uploading', uploadProgress: 40 }));
    // Loading renders as a centered ring inside the status overlay, not a top-right badge.
    expect(el.querySelector('.cometchat-attachment-tile__badge--loading')).toBeFalsy();
    expect(el.querySelector('.cometchat-attachment-tile__overlay')).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__progress')).toBeTruthy();
    // Determinate: the fill arc's dash offset reflects the upload percent (40% → offset = C * 0.6).
    const fill = el.querySelector('.cometchat-attachment-tile__loader-fill') as SVGCircleElement;
    expect(fill).toBeTruthy();
    const offset = Number(fill.getAttribute('stroke-dashoffset'));
    expect(offset).toBeCloseTo(comp.ringCircumference * 0.6, 1);
    const close = el.querySelector(
      '[data-testid="attachment-tile-cancel"]',
    ) as HTMLButtonElement;
    expect(close).toBeTruthy();
    let emitted: unknown = null;
    comp.cancelClick.subscribe((t) => (emitted = t));
    close.click();
    expect(emitted).toBe(comp.tile);
  });

  describe('indeterminate ring (upload queued but not started)', () => {
    const ring = () =>
      el.querySelector('.cometchat-attachment-tile__loader-ring') as SVGElement | null;
    const isSpinning = () =>
      !!ring()?.classList.contains('cometchat-attachment-tile__loader-ring--indeterminate');
    const fill = () =>
      el.querySelector('.cometchat-attachment-tile__loader-fill') as SVGCircleElement;

    it('spins continuously while the upload has reported no progress yet', () => {
      render(mkTile({ type: 'image', status: 'uploading', uploadProgress: 0 }));
      expect(isSpinning()).toBe(true);
      // A short arc + a full-circumference gap leaves exactly one arc to sweep around, pinned at 0.
      const arc = comp.ringCircumference * 0.25;
      expect(fill().getAttribute('stroke-dasharray')).toBe(`${arc} ${comp.ringCircumference}`);
      expect(Number(fill().getAttribute('stroke-dashoffset'))).toBe(0);
    });

    it('spins for a pending tile too', () => {
      render(mkTile({ type: 'image', status: 'pending', uploadProgress: 0 }));
      expect(isSpinning()).toBe(true);
    });

    it('switches to the determinate arc as soon as progress arrives', () => {
      render(mkTile({ type: 'image', status: 'uploading', uploadProgress: 0 }));
      expect(isSpinning()).toBe(true);

      render(mkTile({ type: 'image', status: 'uploading', uploadProgress: 40 }));
      expect(isSpinning()).toBe(false);
      expect(fill().getAttribute('stroke-dasharray')).toBe(`${comp.ringCircumference}`);
      expect(Number(fill().getAttribute('stroke-dashoffset'))).toBeCloseTo(
        comp.ringCircumference * 0.6,
        1,
      );
    });

    it('applies to every attachment type', () => {
      for (const type of ['image', 'video', 'audio', 'file'] as const) {
        render(mkTile({ type, status: 'uploading', uploadProgress: 0 }));
        expect(isSpinning(), type).toBe(true);
      }
    });

    it('does not spin once the tile has settled (no ring at all)', () => {
      for (const status of ['uploaded', 'failed', 'rejected'] as const) {
        render(mkTile({ type: 'image', status, uploadProgress: 0 }));
        expect(ring(), status).toBeNull();
      }
    });
  });

  it('uploaded tiles render no status overlay (no scrim)', () => {
    render(mkTile({ type: 'image', status: 'uploaded' }));
    expect(el.querySelector('.cometchat-attachment-tile__overlay')).toBeNull();
  });

  it('file failure: red border, "Tap to retry" text, centred retry badge AND a removable ✕', () => {
    render(mkTile({ type: 'file', status: 'failed', name: 'a.pdf' }));
    expect(el.querySelector('.cometchat-attachment-tile__card--error')).toBeTruthy();
    // The meta line gives way to the inline status message.
    expect(el.querySelector('[data-testid="attachment-tile-status"]')?.textContent?.trim()).toBe(
      'Tap to retry',
    );
    expect(el.querySelector('.cometchat-attachment-tile__sub')).toBeNull();
    // The centred slot carries retry — a real <img>, since the SVG has its own red disc.
    const icon = el.querySelector('.cometchat-attachment-tile__badge-icon') as HTMLImageElement;
    expect(icon.tagName).toBe('IMG');
    expect(icon.getAttribute('src')).toBe('assets/retry-icon.svg');

    const retry = el.querySelector('[data-testid="attachment-tile-retry"]') as HTMLButtonElement;
    let retried = false;
    comp.retryClick.subscribe(() => (retried = true));
    retry.click();
    expect(retried).toBe(true);

    // A failed tile now ALSO keeps the corner ✕ so the attachment can be dismissed without retrying.
    const close = el.querySelector('[data-testid="attachment-tile-remove"]') as HTMLButtonElement;
    expect(close).toBeTruthy();
    let removed = false;
    comp.removeClick.subscribe(() => (removed = true));
    close.click();
    expect(removed).toBe(true);
  });

  it('rejected file: red border, "Upload failed" text, corner error badge, no retry', () => {
    render(mkTile({ type: 'file', status: 'rejected', name: 'a.pdf' }));
    expect(el.querySelector('.cometchat-attachment-tile__card--error')).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-status"]')?.textContent?.trim()).toBe(
      'Upload failed',
    );
    const err = el.querySelector('[data-testid="attachment-tile-error"]') as HTMLElement;
    expect(err.getAttribute('role')).toBe('img');
    const icon = el.querySelector('.cometchat-attachment-tile__badge-icon') as HTMLImageElement;
    expect(icon.getAttribute('src')).toBe('assets/error-icon.svg');
    expect(el.querySelector('[data-testid="attachment-tile-retry"]')).toBeNull();
  });

  it('no failure tooltip until hovered, then shows the API error message', () => {
    render(mkTile({ type: 'file', status: 'rejected', name: 'a.pdf', errorMessage: 'ATTACHMENT_ERROR: file blocked' }));
    const root = el.querySelector('.cometchat-attachment-tile') as HTMLElement;
    // Hidden by default — only hover/focus opens it.
    expect(el.querySelector('[data-testid="attachment-tile-tooltip"]')).toBeNull();
    root.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    const tip = el.querySelector('[data-testid="attachment-tile-tooltip"]') as HTMLElement;
    expect(tip).toBeTruthy();
    expect(tip.getAttribute('role')).toBe('tooltip');
    expect(tip.textContent?.trim()).toBe('ATTACHMENT_ERROR: file blocked');
    root.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="attachment-tile-tooltip"]')).toBeNull();
  });

  it('failure tooltip falls back to the generic message when the error has no text', () => {
    render(mkTile({ type: 'image', status: 'rejected', errorMessage: '' }));
    (el.querySelector('.cometchat-attachment-tile') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="attachment-tile-tooltip"]')?.textContent?.trim()).toBe('Upload failed');
  });

  it('a retryable (failed) tile shows NO tooltip on hover — only rejected tiles do', () => {
    render(mkTile({ type: 'file', status: 'failed', name: 'a.pdf', errorMessage: 'network blip' }));
    (el.querySelector('.cometchat-attachment-tile') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="attachment-tile-tooltip"]')).toBeNull();
  });

  it('a healthy tile shows no tooltip on hover', () => {
    render(mkTile({ type: 'image', status: 'uploaded', errorMessage: 'stale error should be ignored' }));
    (el.querySelector('.cometchat-attachment-tile') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(el.querySelector('[data-testid="attachment-tile-tooltip"]')).toBeNull();
  });

  it('a rejected tile can still be removed: the ✕ shares the badge slot and emits removeClick', () => {
    render(mkTile({ type: 'file', status: 'rejected', name: 'a.pdf' }));
    // A rejected upload is never retryable, so the ✕ is the only way to unblock Send.
    const close = el.querySelector('[data-testid="attachment-tile-remove"]') as HTMLButtonElement;
    expect(close).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-error"]')).toBeTruthy();
    let emitted: unknown = null;
    comp.removeClick.subscribe((t) => (emitted = t));
    close.click();
    expect(emitted).toBe(comp.tile);
  });

  it('rejected MEDIA gets the red border, the centred error badge and a scrim behind it', () => {
    render(mkTile({ type: 'image', status: 'rejected' }));
    expect(el.querySelector('.cometchat-attachment-tile__media--error')).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-error"]')).toBeTruthy();
    // A scrim dims the thumbnail behind the badge so the red circle always reads on a dark backdrop,
    // and it carries NO progress ring (that is upload-only).
    expect(el.querySelector('.cometchat-attachment-tile__overlay')).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__progress')).toBeNull();
  });

  it('an uploading tile keeps the ✕ (cancel) in the corner, not a badge', () => {
    render(mkTile({ type: 'file', status: 'uploading', uploadProgress: 40 }));
    expect(el.querySelector('[data-testid="attachment-tile-cancel"]')).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__badge')).toBeNull();
    expect(el.querySelector('.cometchat-attachment-tile__card--error')).toBeNull();
  });

  it('emits removeClick from the close button when uploaded', () => {
    render(mkTile({ type: 'image', status: 'uploaded' }));
    const close = el.querySelector(
      '[data-testid="attachment-tile-remove"]',
    ) as HTMLButtonElement;
    let emitted: unknown = null;
    comp.removeClick.subscribe((t) => (emitted = t));
    close.click();
    expect(emitted).toBeTruthy();
  });

  it('opens fullscreen (tileClick) only for uploaded media', () => {
    render(mkTile({ type: 'image', status: 'uploaded' }));
    let opened = 0;
    comp.tileClick.subscribe(() => opened++);
    (el.querySelector('[data-testid="attachment-tile-open"]') as HTMLElement).click();
    expect(opened).toBe(1);

    render(mkTile({ type: 'image', status: 'uploading' }));
    let openedWhileUploading = 0;
    comp.tileClick.subscribe(() => openedWhileUploading++);
    (el.querySelector('[data-testid="attachment-tile-open"]') as HTMLElement).click();
    expect(openedWhileUploading).toBe(0);
  });

  it('shows a play affordance for video', () => {
    render(
      mkTile({
        type: 'video',
        mimeType: 'video/mp4',
        name: 'v.mp4',
        status: 'uploaded',
      }),
    );
    expect(el.querySelector('.cometchat-attachment-tile__play')).toBeTruthy();
  });

  it('renders a mm:ss duration badge for video once the duration is known', () => {
    const video = { type: 'video' as const, mimeType: 'video/mp4', name: 'v.mp4', status: 'uploaded' as const };
    render(mkTile({ ...video, durationSec: 67 }));
    expect(el.querySelector('.cometchat-attachment-tile__duration')?.textContent?.trim()).toBe('01:07');

    // No duration yet (poster extraction still in flight) → no badge.
    render(mkTile({ ...video, durationSec: undefined }));
    expect(el.querySelector('.cometchat-attachment-tile__duration')).toBeNull();
  });

  it('shows no duration badge on images', () => {
    render(mkTile({ type: 'image', status: 'uploaded', durationSec: 30 }));
    expect(el.querySelector('.cometchat-attachment-tile__duration')).toBeNull();
  });

  // ── Audio player tile ──────────────────────────────────────────────────
  const audioTile = (over: Partial<AttachmentFile> = {}) =>
    mkTile({ type: 'audio', mimeType: 'audio/mpeg', name: 'song.mp3', ...over });

  it('uploaded audio renders a play button, seekable bar and time (no status overlay)', () => {
    render(audioTile({ status: 'uploaded' }));
    expect(el.querySelector('.cometchat-attachment-tile__card--audio')).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__audio-button')).toBeTruthy();
    const bar = el.querySelector('.cometchat-attachment-tile__audio-bar') as HTMLInputElement;
    expect(bar).toBeTruthy();
    expect(bar.disabled).toBe(false);
    expect(el.querySelector('.cometchat-attachment-tile__audio-status')?.textContent).toContain('/');
    expect(el.querySelector('.cometchat-attachment-tile__overlay')).toBeNull();
  });

  it('uploading audio overlays the progress ring on the (disabled) play button and disables the bar', () => {
    render(audioTile({ status: 'uploading', uploadProgress: 30 }));
    const overlay = el.querySelector(
      '.cometchat-attachment-tile__audio-control .cometchat-attachment-tile__overlay',
    );
    expect(overlay).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__progress')).toBeTruthy();
    // Play button stays visible (dimmed under the scrim) but is not clickable while uploading.
    const btn = el.querySelector('.cometchat-attachment-tile__audio-button') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
    const bar = el.querySelector('.cometchat-attachment-tile__audio-bar') as HTMLInputElement;
    expect(bar.disabled).toBe(true);
  });

  it('the uploading ring is a SIBLING of the play button, never nested inside it', () => {
    render(audioTile({ status: 'uploading', uploadProgress: 30 }));
    // A ring nested inside the <button> would swallow its clicks.
    const btn = el.querySelector('.cometchat-attachment-tile__audio-button') as HTMLButtonElement;
    expect(btn.querySelector('.cometchat-attachment-tile__overlay')).toBeNull();
    const control = el.querySelector('.cometchat-attachment-tile__audio-control') as HTMLElement;
    expect(control.querySelector(':scope > .cometchat-attachment-tile__overlay')).toBeTruthy();
  });

  it('failed audio: red border, "Tap to retry" replaces the bar+time, corner retry badge', () => {
    render(audioTile({ status: 'failed' }));
    expect(el.querySelector('.cometchat-attachment-tile__card--error')).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-status"]')?.textContent?.trim()).toBe(
      'Tap to retry',
    );
    // The seek bar and time are hidden in the error state.
    expect(el.querySelector('.cometchat-attachment-tile__audio-bar')).toBeNull();
    expect(el.querySelector('.cometchat-attachment-tile__audio-status')).toBeNull();
    // Playback is enabled only once the upload succeeded.
    expect((el.querySelector('.cometchat-attachment-tile__audio-button') as HTMLButtonElement).disabled).toBe(true);

    const retry = el.querySelector('[data-testid="attachment-tile-retry"]') as HTMLButtonElement;
    let emitted: unknown = null;
    comp.retryClick.subscribe((t) => (emitted = t));
    retry.click();
    expect(emitted).toBe(comp.tile);
  });

  it('rejected audio: "Upload failed", a corner error badge and a removable ✕', () => {
    render(audioTile({ status: 'rejected' }));
    expect(el.querySelector('[data-testid="attachment-tile-status"]')?.textContent?.trim()).toBe(
      'Upload failed',
    );
    expect(el.querySelector('[data-testid="attachment-tile-error"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-remove"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-retry"]')).toBeNull();
  });

  it('uploading audio keeps the seek bar and time visible under the ring', () => {
    render(audioTile({ status: 'uploading', uploadProgress: 30 }));
    expect(el.querySelector('.cometchat-attachment-tile__audio-bar')).toBeTruthy();
    expect(el.querySelector('.cometchat-attachment-tile__audio-status')).toBeTruthy();
    expect(el.querySelector('[data-testid="attachment-tile-status"]')).toBeNull();
  });

  it('the seek bar has no inline gradient — the track is uniform, the knob shows position', () => {
    render(audioTile({ status: 'uploaded' }));
    const bar = el.querySelector('.cometchat-attachment-tile__audio-bar') as HTMLInputElement;
    expect(bar.style.background).toBe('');
  });

  it('formatTime zero-pads minutes', () => {
    render(audioTile({ status: 'uploaded' }));
    expect(comp.formatTime(0)).toBe('00:00');
    expect(comp.formatTime(65)).toBe('01:05');
    expect(comp.formatTime(NaN)).toBe('00:00');
    expect(comp.formatTime(-5)).toBe('00:00');
  });
});
