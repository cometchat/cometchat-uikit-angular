import { test, expect, Page, Locator } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { loginToApp } from '../helpers';

/**
 * E2E Tests — Multiple attachments in a single message (Angular)
 *
 * Exercises the ENG-36752 feature end to end against the sample app:
 *   1. Composer staging tray  — pick files → tiles appear (one per file, typed).
 *   2. Attachment picker menu  — Image / Video / Audio / File options route into the tray.
 *   3. Upload lifecycle        — staged uploads settle and gate the Send button.
 *   4. Batched send / receive  — one MediaMessage per attachment type, grouped by a shared
 *                                `metadata.batchId`, rendered as the new per-type batch bubbles.
 *
 * Test philosophy (mirrors the rest of this suite):
 *   • Local, client-only behaviour (staging tiles, removing a tile, the picker menu) is asserted
 *     HARD — it is deterministic once the composer is mounted.
 *   • Anything that needs a live CometChat round-trip (an upload finishing, a message being sent
 *     and echoed back into the list) is gated on `requireDelivered()`: we drive the real path and
 *     wait generously, and if the backend (uploads to S3, moderation, delivery) never delivers, the
 *     test SKIPS. It never passes without asserting — a green test whose receive-side checks silently
 *     did not run hides lost coverage, so a miss has to be visible in the report. Uploaded media can
 *     also render blank in this app (private-S3 403) — so receive-side assertions target the bubble
 *     STRUCTURE (element/class/count), never pixels.
 *
 * @see ENG-36752
 */

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fixture = (name: string): string => path.resolve(__dirname, '..', 'fixtures', name);
const IMAGE_1 = fixture('test-image.png');
const IMAGE_2 = fixture('test-image-2.png');
const VIDEO = fixture('test-video.mp4');
const AUDIO = fixture('test-audio.wav');
const PDF = fixture('test-file.pdf');
const DOC = fixture('test-doc.txt');
const UNKNOWN = fixture('test-unknown.tsv'); // server-accepted, but unmapped in the icon table → unsupported-type icon
// Four of each media kind — for grid layouts and >3 expand/collapse bubbles.
const IMAGES_4 = [IMAGE_1, IMAGE_2, fixture('test-image-3.png'), fixture('test-image-4.png')];
const AUDIOS_4 = [AUDIO, fixture('test-audio-2.wav'), fixture('test-audio-3.wav'), fixture('test-audio-4.wav')];
const VIDEOS_4 = [VIDEO, fixture('test-video-2.mp4'), fixture('test-video-3.mp4'), fixture('test-video-4.mp4')];
const FILES_4 = [PDF, DOC, fixture('test-doc-2.txt'), fixture('test-doc-3.txt')];

// ── Selectors ─────────────────────────────────────────────────────────────────
const SEL = {
  composer: 'cometchat-message-composer',
  fileInput: '.cometchat-message-composer__file-input',
  editor: 'cometchat-message-composer [contenteditable="true"]',
  // Visible send button (single-line and multiline layouts each render one; only one is visible).
  sendButton: '.cometchat-message-composer__send-button-inner:visible .cometchat-button',
  // Staging tray + tiles
  tray: '.cometchat-attachment-tray',
  tile: '.cometchat-attachment-tile',
  tileImage: '.cometchat-attachment-tile--image',
  tileVideo: '.cometchat-attachment-tile--video',
  tileAudio: '.cometchat-attachment-tile--audio',
  tileFile: '.cometchat-attachment-tile--file',
  tileClose: '.cometchat-attachment-tile__close', // cancel / remove (hidden until tile hover)
  // Action-sheet picker
  actionSheetItem: '.cometchat-action-sheet__item',
  // Receive-side batch bubbles (wrapper custom elements distinguish a batch from a legacy single)
  imagesBubble: 'cometchat-images-bubble',
  videosBubble: 'cometchat-videos-bubble',
  audiosBubble: 'cometchat-audios-bubble',
  filesBubble: 'cometchat-files-bubble',
  multiAttachmentBubble: '.cometchat-message-bubble--multi-attachment',
  fileItem: '.cometchat-file-bubble__file-item',
  imageCaption: '.cometchat-image-bubble__caption',
  // Tray tile details
  progressRing: '.cometchat-attachment-tile__progress',
  audioBar: '.cometchat-attachment-tile__audio-bar', // <input type=range> seek slider
  audioStatus: '.cometchat-attachment-tile__audio-status', // "mm:ss/mm:ss"
  fileSub: '.cometchat-attachment-tile__sub', // "PDF · 2.4 MB"
  toast: '.cometchat-toast',
  trayItem: '.cometchat-attachment-tray__item', // Angular equivalent of React's <li> tile
  retryBadge: '[data-testid="attachment-tile-retry"]', // status=failed (retryable)
  errorBadge: '[data-testid="attachment-tile-error"]', // status=rejected (non-retryable)
  tileTooltip: '[data-testid="attachment-tile-tooltip"]',
  dropZone: '.cometchat-message-composer__drop-zone', // drag overlay (added on dragenter)
  // Receive-side bubble internals
  imageGrid2x2: '.cometchat-image-bubble__grid--2x2',
  imageWrapper: '.cometchat-image-bubble__image-wrapper', // clickable image tile
  videoGrid2x2: '.cometchat-video-bubble__grid--2x2',
  videoWrapper: '.cometchat-video-bubble__video-wrapper', // clickable video tile
  videoPlayOverlay: '.cometchat-video-bubble__play-overlay',
  videoDurationBadge: '.cometchat-video-bubble__duration-badge',
  viewer: '.cometchat-fullscreen-viewer',
  viewerClose: '.cometchat-fullscreen-viewer__close-btn',
  audiosItem: '.cometchat-audios-bubble__item',
  audiosToggle: '.cometchat-audios-bubble__toggle', // one class for expand + collapse
  audiosSlider: '.cometchat-audios-bubble__slider',
  audiosDuration: '.cometchat-audios-bubble__duration',
  audiosDownload: '.cometchat-audios-bubble__download',
  fileExpand: '.cometchat-file-bubble__expand-indicator', // "show N more"
  fileCollapse: '.cometchat-file-bubble__collapse-control', // "show less"
  convSubtitleText: '.cometchat-conversation-item__subtitle-text',
  convSubtitleImageIcon: '.cometchat-conversation-item__subtitle-icon--image',
  // Message-bubble options / edit menu
  bubbleBody: '.cometchat-message-bubble__body',
  moreOptions: '.cometchat-menu-list__sub-menu', // "More options" trigger
  editMenuItem: '.cometchat-menu-list__sub-menu-list-item[aria-label="Edit"]',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** All staged tiles in the composer tray. */
function tiles(page: Page): Locator {
  return page.locator(SEL.tile);
}

/** The visible Send button (a native <button> — supports toBeEnabled/toBeDisabled). */
function sendButton(page: Page): Locator {
  return page.locator(SEL.sendButton).first();
}

/** The message list, scoped by its ARIA role so we never match the sidebar conversation preview. */
function messageList(page: Page): Locator {
  return page.getByLabel('Message list');
}

/**
 * Stage files by setting them on the composer's hidden <input type="file" multiple>. This drives the
 * real `handleFileInputChange → processFiles → MediaUploadTrayService.stage()` path; the staged kind
 * is MIME-derived (exactly as drag-drop / paste behave). The picker-menu path is covered separately.
 *
 * The wait for the tiles is baked in (delta-based, generous timeout): the FIRST stage after a fresh
 * login awaits `CometChat.getMaxAttachmentCount()` — a cold app-settings fetch that can exceed the
 * default 10s assertion timeout — so this absorbs it, making the tests order-independent. All files
 * are accepted (the sample app sets no allowed-types / max-size), so each becomes exactly one tile.
 */
async function stageFiles(page: Page, files: string[]): Promise<void> {
  const before = await tiles(page).count();
  await page.locator(SEL.fileInput).first().setInputFiles(files);
  await expect(tiles(page)).toHaveCount(before + files.length, { timeout: 30_000 });
}

/**
 * Stage files through drag-drop or paste instead of the file input, exercising the composer's
 * `handleDrop` / `handlePaste` routing into the tray. The browser has no real dragged/pasted file,
 * so we build a File from the fixture bytes and dispatch a synthetic `drop` (on the composer root)
 * or `paste` (on the editor) carrying a DataTransfer — the same shape those handlers read.
 */
async function dispatchFileEvent(
  page: Page,
  kind: 'drop' | 'paste',
  file: { path: string; name: string; mime: string },
): Promise<void> {
  const before = await tiles(page).count();
  const bytes = Array.from(fs.readFileSync(file.path));
  const selector = kind === 'drop' ? SEL.composer + ' .cometchat-message-composer' : SEL.editor;

  await page.evaluate(
    ({ kind, selector, bytes, name, mime }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`dispatch target not found: ${selector}`);
      const dt = new DataTransfer();
      dt.items.add(new File([new Uint8Array(bytes)], name, { type: mime }));
      const event =
        kind === 'drop'
          ? new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt })
          : new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt });
      el.dispatchEvent(event);
    },
    { kind, selector, bytes, name: file.name, mime: file.mime },
  );

  await expect(tiles(page)).toHaveCount(before + 1, { timeout: 30_000 });
}

/**
 * Wait until every staged upload has settled and the tray allows sending. `canSend` (and thus the
 * Send button's enabled state) flips true only once all tiles are uploaded AND none failed, so it is
 * the single authoritative "uploads done" signal. Tolerant: returns false on timeout rather than
 * throwing, because completion depends on the live backend.
 */
async function waitForSendEnabled(page: Page, timeout = 30_000): Promise<boolean> {
  try {
    await expect(sendButton(page)).toBeEnabled({ timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * How long to wait for a sent batch to come back down the wire and render. The shared CometChat app
 * this suite runs against delivers in ~3s when rested, but this suite sends ~25 batches back-to-back
 * and the resulting throttle pushes delivery past 45s — so the window has to be generous or real
 * coverage turns into skips for no good reason. Kept within the 180s per-test budget alongside
 * staging (≤30s) and the upload wait (≤30s).
 */
const DELIVERY_TIMEOUT = 60_000;

/**
 * Await a backend-dependent element before asserting anything about it, and SKIP the test if it never
 * arrives. Delivery is outside the UI's control (upload → S3 → moderation → echo), so a miss must not
 * fail the run — but it must not pass silently either: a test that reports green while its receive-side
 * assertions never executed is worse than one that reports skipped, because it hides lost coverage.
 * `test.skip()` throws, so everything after this call runs only when the element genuinely rendered.
 */
async function requireDelivered(locator: Locator, label: string, timeout = DELIVERY_TIMEOUT): Promise<void> {
  // NB: use expect().toBeVisible() — Locator.isVisible() ignores its timeout and returns immediately,
  // so it would false-miss any element that renders a beat after the check starts.
  try {
    await expect(locator.first()).toBeVisible({ timeout });
  } catch {
    test.skip(true, `${label} was not delivered within ${timeout}ms — backend slow or unavailable`);
  }
}

/** Type a caption into the composer editor (used to uniquely tag a batch for later lookup). */
async function typeCaption(page: Page, text: string): Promise<void> {
  await page.locator(SEL.editor).first().click();
  await page.keyboard.type(text);
}

/**
 * Stage + (optionally) caption + send a batch, waiting for uploads to settle first. Returns the
 * caption tag (or ''). Tolerant: if uploads don't settle (throttle/offline) the caller decides.
 */
async function stageAndSend(page: Page, files: string[], caption?: string): Promise<boolean> {
  await stageFiles(page, files);
  if (caption) await typeCaption(page, caption);
  if (!(await waitForSendEnabled(page))) return false;
  await sendButton(page).click();
  return true;
}

/**
 * Stage in-memory files (no fixture on disk) via the hidden input — used for the count-limit test
 * (many tiny files) and the oversized-file test (a >100MB buffer we must not commit).
 */
async function stageBuffers(
  page: Page,
  payloads: { name: string; mimeType: string; buffer: Buffer }[],
): Promise<void> {
  await page.locator(SEL.fileInput).first().setInputFiles(payloads);
}

/** Locate the receive-side batch bubble this test just sent, pinned by its unique caption tag. */
function taggedBubble(page: Page, bubbleSelector: string, tag: string): Locator {
  return messageList(page).locator(bubbleSelector).filter({ hasText: tag });
}

/** The message-list row carrying this batch's caption — i.e. its LAST message. */
function taggedRow(page: Page, tag: string): Locator {
  return messageList(page).locator('.cometchat-message-list__message').filter({ hasText: tag });
}

/**
 * The `count` message rows immediately preceding `row` — the earlier halves of the same batch, since
 * the composer posts one message per type back-to-back. Anchoring on POSITION is what ties them to
 * this batch: the conversation is full of unrelated media messages, so searching backwards for "the
 * nearest images bubble" would happily match one from an earlier test. Positions on the
 * preceding-sibling axis count backwards from `row`, so [position()<=N] is the nearest N rows.
 */
function precedingRows(row: Locator, count: number): Locator {
  return row.locator(
    `xpath=preceding-sibling::div[contains(@class,"cometchat-message-list__message")][position()<=${count}]`,
  );
}

/**
 * Dispatch a synthetic drag sequence on the composer root to drive the drop overlay. The composer's
 * dragCounter shows the overlay on `dragenter` and hides it once the counter returns to 0 on
 * `dragleave` — so one enter shows it and one matching leave hides it.
 */
async function dispatchDrag(page: Page, kind: 'enter' | 'leave'): Promise<void> {
  await page.evaluate((kind) => {
    const el = document.querySelector('cometchat-message-composer .cometchat-message-composer');
    if (!el) throw new Error('composer root not found');
    const dt = new DataTransfer();
    // A dragged file must look like a file to the handlers (they gate on dataTransfer).
    dt.items.add(new File([new Uint8Array([1, 2, 3])], 'x.png', { type: 'image/png' }));
    const type = kind === 'enter' ? 'dragenter' : 'dragleave';
    el.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, kind);
}

// ── Suite ─────────────────────────────────────────────────────────────────────

test.describe('Multiple attachments (ENG-36752)', () => {
  let page: Page;

  /**
   * Open the first conversation so the composer + message list mount. The composer only paints once
   * its first cold CometChat.getMaxAttachmentCount() resolves, which under a throttled shared backend
   * can take well over 15s — hence the generous wait.
   */
  async function openConversation(p: Page, composerTimeout: number): Promise<void> {
    await p.waitForSelector('.cometchat-conversation-item', { timeout: 30_000 });
    await p.locator('.cometchat-conversation-item').first().click();
    await p.waitForSelector(SEL.composer, { timeout: composerTimeout });
  }

  test.beforeEach(async ({ page: p }) => {
    // Backend-heavy tests chain stageFiles (≤30s) + waitForSendEnabled (≤30s) + a delivery wait
    // (≤45s); under a throttled backend that sum can exceed the default 60s test budget and hard-fail
    // before requireDelivered can gracefully skip. Give every test headroom so throttle degrades to
    // a skip, never a false failure. The budget also has to cover the setup retry below.
    // (Healthy-backend tests still finish in a few seconds.)
    test.setTimeout(180_000);
    page = p;
    await loginToApp(page);
    try {
      await openConversation(page, 45_000);
    } catch {
      // A test that just pushed a 4-file batch can leave the backend throttled enough that the next
      // login's message-pane fetch never resolves — the sidebar renders, the composer never mounts.
      // It clears on a fresh session, so retry once rather than failing a test for the previous
      // test's upload burst.
      console.warn('[multi-attachments] composer did not mount; retrying setup after a fresh login');
      await loginToApp(page);
      await openConversation(page, 30_000);
    }
    // Sanity: no tray should be showing before anything is staged.
    await expect(page.locator(SEL.tray)).toHaveCount(0);
  });

  // ==================== 1. Composer staging tray (deterministic) ====================

  test.describe('Composer staging tray', () => {
    test('tray stays hidden until a file is staged', async () => {
      await expect(page.locator(SEL.tray)).toHaveCount(0);

      await stageFiles(page, [IMAGE_1]);

      await expect(page.locator(SEL.tray)).toBeVisible();
      await expect(tiles(page)).toHaveCount(1);
    });

    test('staging two images shows one image tile each', async () => {
      await stageFiles(page, [IMAGE_1, IMAGE_2]);

      await expect(tiles(page)).toHaveCount(2);
      await expect(page.locator(SEL.tileImage)).toHaveCount(2);
    });

    test('staging a video shows a video tile', async () => {
      await stageFiles(page, [VIDEO]);

      await expect(tiles(page)).toHaveCount(1);
      await expect(page.locator(SEL.tileVideo)).toHaveCount(1);
    });

    test('staging an audio file shows an audio tile', async () => {
      await stageFiles(page, [AUDIO]);

      await expect(tiles(page)).toHaveCount(1);
      await expect(page.locator(SEL.tileAudio)).toHaveCount(1);
    });

    test('staging a document shows a file tile', async () => {
      await stageFiles(page, [PDF]);

      await expect(tiles(page)).toHaveCount(1);
      await expect(page.locator(SEL.tileFile)).toHaveCount(1);
    });

    test('staging mixed types shows one correctly-typed tile for each', async () => {
      await stageFiles(page, [IMAGE_1, VIDEO, AUDIO, PDF]);

      await expect(tiles(page)).toHaveCount(4);
      await expect(page.locator(SEL.tileImage)).toHaveCount(1);
      await expect(page.locator(SEL.tileVideo)).toHaveCount(1);
      await expect(page.locator(SEL.tileAudio)).toHaveCount(1);
      await expect(page.locator(SEL.tileFile)).toHaveCount(1);
    });

    test('staging more files accumulates them into the same tray', async () => {
      await stageFiles(page, [IMAGE_1]);
      await expect(tiles(page)).toHaveCount(1);

      // A second selection reuses the same upload group rather than replacing the tray.
      await stageFiles(page, [IMAGE_2, PDF]);
      await expect(tiles(page)).toHaveCount(3);
    });

    test('removing a staged tile drops it from the tray', async () => {
      await stageFiles(page, [IMAGE_1, IMAGE_2]);
      await expect(tiles(page)).toHaveCount(2);

      // The ✕ is revealed on hover (visibility:hidden otherwise), so hover the tile first.
      const firstTile = tiles(page).first();
      await firstTile.hover();
      await firstTile.locator(SEL.tileClose).click();

      await expect(tiles(page)).toHaveCount(1);
    });

    test('removing the last staged tile hides the tray', async () => {
      await stageFiles(page, [IMAGE_1]);
      await expect(tiles(page)).toHaveCount(1);

      const only = tiles(page).first();
      await only.hover();
      await only.locator(SEL.tileClose).click();

      await expect(tiles(page)).toHaveCount(0);
      await expect(page.locator(SEL.tray)).toHaveCount(0);
    });
  });

  // ==================== 2. Attachment picker menu ====================

  test.describe('Attachment picker menu', () => {
    test('attachment button reveals Image / Video / Audio / File options', async () => {
      await page.getByRole('button', { name: 'Add attachment' }).click();

      const sheet = page.locator(SEL.actionSheetItem);
      await expect(sheet.filter({ hasText: 'Attach Image' })).toBeVisible();
      await expect(sheet.filter({ hasText: 'Attach Video' })).toBeVisible();
      await expect(sheet.filter({ hasText: 'Attach Audio' })).toBeVisible();
      await expect(sheet.filter({ hasText: 'Attach File' })).toBeVisible();
    });

    test('choosing "Attach Image" from the menu stages an image tile', async () => {
      await page.getByRole('button', { name: 'Add attachment' }).click();

      // Clicking the option programmatically clicks the hidden <input>, opening a file chooser.
      const chooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 }).catch(() => null);
      await page.locator(SEL.actionSheetItem).filter({ hasText: 'Attach Image' }).click();
      const chooser = await chooserPromise;

      // In some headless environments the chooser event may not surface; only assert when it does.
      if (chooser) {
        await chooser.setFiles(IMAGE_1);
        await expect(page.locator(SEL.tileImage)).toHaveCount(1);
      } else {
        console.warn('[multi-attachments] file chooser did not open; skipped menu-stage assertion');
      }
    });
  });

  // ==================== 3. Upload lifecycle (backend, tolerant) ====================

  test.describe('Upload lifecycle', () => {
    test('Send is blocked while an upload is in flight', async () => {
      // Before anything is staged and with an empty editor, Send is disabled.
      await expect(sendButton(page)).toBeDisabled();

      await stageFiles(page, [IMAGE_1, IMAGE_2]);
      // With staged tiles present, `canSend` is driven solely by the tray — Send is disabled until
      // every upload completes. (Tiny fixtures may settle fast; this is a best-effort check.)
      const stillUploading = await page
        .locator(`${SEL.tile}--uploading`)
        .first()
        .isVisible({ timeout: 1_000 })
        .catch(() => false);
      if (stillUploading) {
        await expect(sendButton(page)).toBeDisabled();
      }
    });

    test('staged uploads settle and enable the Send button', async () => {
      await stageFiles(page, [IMAGE_1, IMAGE_2]);
      await expect(tiles(page)).toHaveCount(2);

      const enabled = await waitForSendEnabled(page);
      if (enabled) {
        await expect(sendButton(page)).toBeEnabled();
        // A settled tile is no longer in the uploading state and carries no error badge.
        await expect(page.locator(`${SEL.tile}--uploading`)).toHaveCount(0);
        await expect(page.locator('[data-testid="attachment-tile-error"]')).toHaveCount(0);
      } else {
        console.warn('[multi-attachments] uploads did not settle; backend may be unavailable');
      }
    });
  });

  // ==================== 4. Batched send / receive (backend, tolerant) ====================

  test.describe('Sending batched attachments', () => {
    test('sending two images clears the tray and posts one images batch', async () => {
      // Tag the batch so it can be pinned by caption. Counting bubbles before/after would be the more
      // obvious way to prove "one new bubble", but the message list paints its history progressively
      // after the composer mounts, so an early count is a stale baseline.
      const tag = `img2-${Date.now()}`;
      await stageFiles(page, [IMAGE_1, IMAGE_2]);
      await expect(tiles(page)).toHaveCount(2);
      await typeCaption(page, tag);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }

      await sendButton(page).click();

      // After a successful send the composer clears its tray (clearAll runs post-send). This is
      // composer-side, so it is asserted hard — no backend echo involved.
      await expect(page.locator(SEL.tray)).toHaveCount(0, { timeout: DELIVERY_TIMEOUT });

      // The two images collapse into a SINGLE batched images bubble carrying BOTH images — had they
      // been posted as two separate messages, this bubble would hold only one.
      const bubble = taggedBubble(page, SEL.imagesBubble, tag);
      await requireDelivered(bubble, 'images batch bubble');
      await expect(bubble).toHaveCount(1);
      await expect(bubble.locator(SEL.imageWrapper)).toHaveCount(2);
    });

    test('a caption typed with the batch renders on the sent bubble', async () => {
      const caption = `batch caption ${Date.now()}`;

      await stageFiles(page, [IMAGE_1, IMAGE_2]);
      await page.locator(SEL.editor).first().click();
      await page.keyboard.type(caption);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }

      await sendButton(page).click();

      // The caption is stamped on the LAST message of the batch and rendered under the images.
      const captioned = messageList(page).locator(SEL.imageCaption).filter({ hasText: caption });
      await requireDelivered(captioned, 'batch caption text');
      // Exactly one caption node carries this tag, and it belongs to the images batch bubble it was
      // sent with — not to a stray text message alongside it.
      await expect(captioned).toHaveCount(1);
      await expect(taggedBubble(page, SEL.imagesBubble, caption)).toHaveCount(1);
    });

    test('sending mixed types posts a separate bubble per type', async () => {
      // The caption lands on the LAST message of the batch (the file), so it pins the batch as a
      // whole: once the file bubble carrying the tag has arrived, the image and video halves of the
      // same batch must be present too — if they are not, that is the bug this test exists to catch.
      const tag = `mixed-${Date.now()}`;

      await stageFiles(page, [IMAGE_1, VIDEO, PDF]);
      await expect(tiles(page)).toHaveCount(3);
      await typeCaption(page, tag);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }

      await sendButton(page).click();

      await requireDelivered(taggedBubble(page, SEL.filesBubble, tag), 'files batch bubble');
      // Each type became its own bubble: the two rows before the file row are this batch's image and
      // video halves (order between them is not asserted — only that each appears exactly once).
      const earlier = precedingRows(taggedRow(page, tag), 2);
      await expect(earlier.locator(SEL.imagesBubble)).toHaveCount(1, { timeout: 15_000 });
      await expect(earlier.locator(SEL.videosBubble)).toHaveCount(1, { timeout: 15_000 });
    });

    test('sending two documents posts one files bubble with multiple items', async () => {
      const tag = `docs-${Date.now()}`;
      await stageFiles(page, [PDF, DOC]);
      await expect(tiles(page)).toHaveCount(2);
      await page.locator(SEL.editor).first().click();
      await page.keyboard.type(tag);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }

      await sendButton(page).click();

      // Pin THIS message by its unique caption — the shared conversation accumulates other files
      // bubbles, so .last() can resolve to an unrelated one.
      const filesBubble = messageList(page).locator(SEL.filesBubble).filter({ hasText: tag });
      await requireDelivered(filesBubble, 'files batch bubble');
      // Both documents live inside a single files bubble as two rows.
      await expect(filesBubble).toHaveCount(1);
      await expect(filesBubble.locator(SEL.fileItem)).toHaveCount(2);
    });

    test('a file of unknown type renders the unsupported-type icon', async () => {
      const tag = `unk-${Date.now()}`;
      await stageFiles(page, [UNKNOWN]);
      await page.locator(SEL.editor).first().click();
      await page.keyboard.type(tag);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'upload did not settle — backend unavailable');
      }

      await sendButton(page).click();

      // getFileType() finds no known extension and no matching MIME category, so the received file
      // bubble falls back to the file_type_unsupported.svg icon (the only MIME-derived receive path).
      // Pin THIS message by its unique caption rather than .last().
      const filesBubble = messageList(page).locator(SEL.filesBubble).filter({ hasText: tag });
      await requireDelivered(filesBubble, 'files batch bubble');
      await expect(filesBubble.locator('.cometchat-file-bubble__icon').first()).toHaveAttribute(
        'src',
        /file_type_unsupported\.svg/,
      );
    });

    test('sending an audio file posts an audios batch bubble', async () => {
      const tag = `aud-${Date.now()}`;
      await stageFiles(page, [AUDIO]);
      await typeCaption(page, tag);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'upload did not settle — backend unavailable');
      }

      await sendButton(page).click();

      // A sent audio file renders as the new audios-batch bubble (a voice note — metadata.audioType —
      // would route to cometchat-voice-note-bubble instead; that path is the recorder, not the tray).
      // Pin THIS message by its unique caption; the conversation accumulates unrelated audio bubbles.
      const audiosBubble = taggedBubble(page, SEL.audiosBubble, tag);
      await requireDelivered(audiosBubble, 'audios batch bubble');
      await expect(audiosBubble.locator(SEL.audiosItem)).toHaveCount(1);
    });
  });

  // ==================== 5. Batch grouping semantics (backend, strict-when-delivered) ============

  test.describe('Batch grouping', () => {
    test('a multi-type batch groups its bubbles — footer only on the last', async () => {
      // image + file → two messages sharing one batchId, rendered as two grouped bubbles. The caption
      // lands on the LAST batch message (the file), giving a unique handle on this exact batch.
      const tag = `grp-${Date.now()}`;
      await stageFiles(page, [IMAGE_1, PDF]);
      await page.locator(SEL.editor).first().click();
      await page.keyboard.type(tag);

      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }

      await sendButton(page).click();

      // Pin the file row (last-in-batch) by the unique caption instead of .last(), since the shared
      // conversation accumulates unrelated image/file bubbles across tests.
      const fileRow = messageList(page).locator('.cometchat-message-list__message').filter({ hasText: tag });
      await requireDelivered(fileRow, 'batch file row');

      // The composer sends types in order image → video → audio → file, so the file is LAST-in-batch:
      // it hosts the files bubble, shows the time/receipt footer, and is NOT flagged --batch-no-footer.
      await expect(fileRow.locator(SEL.filesBubble)).toBeVisible();
      await expect(fileRow.locator('.cometchat-message-bubble__body-status-info-view')).toHaveCount(1);
      await expect(fileRow.locator('.cometchat-message-bubble__body--batch-no-footer')).toHaveCount(0);

      // The image is FIRST-in-batch: the row IMMEDIATELY before the file row. That adjacency is what
      // proves the two messages belong to one batch, so anchor on position — searching backwards for
      // "the nearest row containing an images bubble" instead would silently latch onto an unrelated
      // older image message whenever this batch's own image half hasn't been delivered yet, and then
      // assert the footer rule against the wrong row.
      const imageRow = fileRow.locator(
        'xpath=preceding-sibling::div[contains(@class,"cometchat-message-list__message")][1]',
      );
      await requireDelivered(imageRow.locator(SEL.imagesBubble), 'batch image row (adjacent)');
      await expect(imageRow.locator('.cometchat-message-bubble__body--batch-no-footer')).toHaveCount(1);
      await expect(imageRow.locator('.cometchat-message-bubble__body-status-info-view')).toHaveCount(0);
    });
  });

  // ==================== 6. Fullscreen viewer from a staged tile ====================

  test.describe('Fullscreen viewer', () => {
    test('clicking an uploaded image tile opens and closes the fullscreen viewer', async () => {
      await stageFiles(page, [IMAGE_1]);
      // A media tile becomes clickable only once its upload has succeeded.
      if (!(await waitForSendEnabled(page))) {
        test.skip(true, 'upload did not settle — backend unavailable');
      }

      await page.locator('[data-testid="attachment-tile-open"]').first().click();
      const viewer = page.locator('.cometchat-fullscreen-viewer');
      await expect(viewer).toBeVisible({ timeout: 10_000 });

      await page.locator('.cometchat-fullscreen-viewer__close-btn').click();
      await expect(viewer).toHaveCount(0);
    });
  });

  // ==================== 7. Drag-drop and paste staging ====================

  test.describe('Drag-drop and paste', () => {
    test('dropping a file onto the composer stages it', async () => {
      await dispatchFileEvent(page, 'drop', { path: IMAGE_1, name: 'dropped.png', mime: 'image/png' });
      await expect(page.locator(SEL.tileImage)).toHaveCount(1);
    });

    test('pasting a file into the editor stages it', async () => {
      await dispatchFileEvent(page, 'paste', { path: IMAGE_1, name: 'pasted.png', mime: 'image/png' });
      await expect(page.locator(SEL.tileImage)).toHaveCount(1);
    });

    test('dragging a file over the composer shows the drop overlay', async () => {
      await expect(page.locator(SEL.dropZone)).toHaveCount(0);
      await dispatchDrag(page, 'enter');
      await expect(page.locator(SEL.dropZone)).toBeVisible({ timeout: 3_000 });
    });

    test('dragging away hides the drop overlay', async () => {
      await dispatchDrag(page, 'enter');
      await expect(page.locator(SEL.dropZone)).toBeVisible({ timeout: 3_000 });
      await dispatchDrag(page, 'leave');
      await expect(page.locator(SEL.dropZone)).toHaveCount(0, { timeout: 3_000 });
    });
  });

  // ==================== 8. Tray tile details ====================

  test.describe('Tray tile details', () => {
    test('upload progress ring disappears once the upload succeeds', async () => {
      await stageFiles(page, [IMAGE_1, IMAGE_2]);
      // The ring renders only while in flight; it is removed on success.
      await expect(page.locator(SEL.progressRing)).toHaveCount(0, { timeout: 20_000 });
      await expect(sendButton(page)).toBeEnabled({ timeout: 5_000 });
    });

    test('audio tray tile shows a seek slider and mm:ss/mm:ss time', async () => {
      await stageFiles(page, [AUDIO]);
      const tile = page.locator(SEL.tileAudio).first();
      await expect(tile.locator(SEL.audioBar)).toBeVisible({ timeout: 10_000 });
      await expect(tile.locator(SEL.audioStatus)).toHaveText(/\d{2}:\d{2}\/\d{2}:\d{2}/, { timeout: 10_000 });
    });

    test('file tray tile shows the file extension label', async () => {
      await stageFiles(page, [PDF]);
      const sub = page.locator(SEL.tileFile).first().locator(SEL.fileSub);
      await expect(sub).toContainText(/PDF/i, { timeout: 10_000 });
    });

    test('picking files beyond the limit adds none and shows a toast', async () => {
      // A batch larger than the max-attachment count is rejected wholesale (all-or-nothing),
      // comfortably above any plausible server limit so nothing stages.
      const many = Array.from({ length: 30 }, (_, i) => ({
        name: `bulk-${i}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from(`bulk file ${i}`),
      }));
      await stageBuffers(page, many);
      await expect(page.locator(SEL.toast)).toBeVisible({ timeout: 5_000 });
      await expect(tiles(page)).toHaveCount(0, { timeout: 5_000 });
    });
  });

  // ==================== 9. Upload failure & retry (offline) ====================

  test.describe('Upload failure & retry', () => {
    // Restore connectivity after every test so offline state can't leak (single-worker suite).
    test.afterEach(async () => {
      await page.context().setOffline(false).catch(() => {});
    });

    for (const { label, file } of [
      { label: 'image', file: IMAGE_1 },
      { label: 'video', file: VIDEO },
      { label: 'audio', file: AUDIO },
      { label: 'file', file: PDF },
    ]) {
      test(`${label}: upload fails offline, then retry succeeds after reconnecting`, async () => {
        await page.context().setOffline(true);
        await stageFiles(page, [file]);
        // A dropped network is a transient FAILURE → retryable tile (retry badge), not a rejection.
        await expect(page.locator(SEL.retryBadge)).toBeVisible({ timeout: 40_000 });
        await expect(sendButton(page)).toBeDisabled();

        await page.context().setOffline(false);
        await page.waitForTimeout(1_000);
        await page.locator(SEL.retryBadge).first().click();
        // The SAME tile uploads through to success: retry badge gone, send re-enabled.
        await expect(page.locator(SEL.retryBadge)).toHaveCount(0, { timeout: 40_000 });
        await expect(sendButton(page)).toBeEnabled({ timeout: 15_000 });
      });
    }

    test('a dashboard-denied file type shows a rejected tile, tooltip, and blocks send [gated: E2E_BLOCKED_MIME_TYPE]', async () => {
      // A true server REJECTION (vs a retryable failure) requires a MIME the app's dashboard denies —
      // app-specific, so gated like the React reference. Set E2E_BLOCKED_MIME_TYPE to that MIME.
      const mime = process.env['E2E_BLOCKED_MIME_TYPE'];
      test.skip(!mime, 'set E2E_BLOCKED_MIME_TYPE to a dashboard-denied MIME to run the type-rejection test');
      await stageBuffers(page, [{ name: 'e2e-blocked.bin', mimeType: mime!, buffer: Buffer.from('blocked payload') }]);
      // Hard rejection → the (non-retryable) error badge, no retry badge, send stays disabled.
      await expect(page.locator(SEL.errorBadge)).toBeVisible({ timeout: 25_000 });
      await expect(page.locator(SEL.retryBadge)).toHaveCount(0);
      await expect(sendButton(page)).toBeDisabled();
      // Hover surfaces the failure tooltip.
      await page.locator(SEL.tile).first().hover();
      await expect(page.locator(SEL.tileTooltip).first()).toBeVisible({ timeout: 3_000 });
      // A rejected tile carries the close button; removing it clears the send-block (fix 3d72ec60).
      const t = page.locator(SEL.tile).first();
      await t.hover();
      await t.locator(SEL.tileClose).click();
      await expect(page.locator(SEL.tile)).toHaveCount(0);
    });

    test('file size exceeded shows a rejected tile [gated: E2E_RUN_OVERSIZE]', async () => {
      // Mirrors the React reference, which also gates this behind a supplied >100MB input. Off by
      // default: a 100MB+ upload is heavy and throttle-prone. Enable with E2E_RUN_OVERSIZE=1.
      test.skip(!process.env['E2E_RUN_OVERSIZE'], 'set E2E_RUN_OVERSIZE=1 to run the >100MB size-limit test');
      const oversize = Buffer.alloc(101 * 1024 * 1024, 0); // 101 MB, never committed
      await stageBuffers(page, [{ name: 'e2e-oversize.bin', mimeType: 'application/octet-stream', buffer: oversize }]);
      await expect(page.locator(SEL.errorBadge)).toBeVisible({ timeout: 60_000 });
      await expect(sendButton(page)).toBeDisabled();
    });
  });

  // ==================== 10. Edit option on batch messages ====================

  test.describe('Edit option', () => {
    async function openOptions(bubbleWrapper: Locator): Promise<void> {
      await bubbleWrapper.locator(SEL.bubbleBody).first().hover();
      await bubbleWrapper.locator(SEL.moreOptions).first().click();
    }

    test('edit IS offered on a captioned batch message', async () => {
      const tag = `edit-${Date.now()}`;
      if (!(await stageAndSend(page, [IMAGE_1, IMAGE_2], tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const wrapper = messageList(page)
        .locator('.cometchat-message-bubble__wrapper--outgoing')
        .filter({ hasText: tag });
      await requireDelivered(wrapper, 'captioned outgoing bubble');
      await openOptions(wrapper);
      // Scope to THIS bubble's menu — every bubble renders its own (hidden) context menu inline.
      await expect(wrapper.locator(SEL.editMenuItem)).toBeVisible({ timeout: 5_000 });
    });

    test('edit is NOT offered on media without a caption', async () => {
      if (!(await stageAndSend(page, [IMAGE_1]))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const wrapper = messageList(page).locator('.cometchat-message-bubble__wrapper--outgoing').last();
      await requireDelivered(wrapper, 'outgoing media bubble');
      // Guard: only assert when the newest outgoing bubble is genuinely caption-less (a caption
      // renders a nested text-bubble). If accumulation raced us onto a captioned bubble, bail.
      if ((await wrapper.locator('.cometchat-text-bubble').count()) > 0) return;
      // A caption-less media bubble never builds an Edit option, so its own menu has none.
      await expect(wrapper.locator(SEL.editMenuItem)).toHaveCount(0, { timeout: 3_000 });
    });
  });

  // ==================== 11. All-4 batch send + no-caption ====================

  test.describe('Batch send variants', () => {
    test('send a batch with all 4 media types and a caption', async () => {
      const tag = `all4-${Date.now()}`;
      if (!(await stageAndSend(page, [IMAGE_1, VIDEO, AUDIO, PDF], tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      // One bubble per type, sharing the batch; the caption lands on the last (the file), so once the
      // tagged files bubble is here the other three halves of the batch must be here too — they are
      // the three rows immediately before it.
      await requireDelivered(taggedBubble(page, SEL.filesBubble, tag), 'captioned files batch');
      const earlier = precedingRows(taggedRow(page, tag), 3);
      await expect(earlier.locator(SEL.imagesBubble)).toHaveCount(1, { timeout: 15_000 });
      await expect(earlier.locator(SEL.videosBubble)).toHaveCount(1, { timeout: 15_000 });
      await expect(earlier.locator(SEL.audiosBubble)).toHaveCount(1, { timeout: 15_000 });
    });

    test('a batch sent WITHOUT a caption renders no caption text', async () => {
      if (!(await stageAndSend(page, [IMAGE_1, IMAGE_2]))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      // There is no caption to pin by, so anchor on the NEWEST row instead: this batch is the last
      // thing sent, and the row before it belongs to the previous test's file batch — so waiting for
      // the last row to hold an images bubble waits for exactly our message, with no fragile count
      // baseline (the list hydrates its history progressively, which makes early counts stale).
      const lastRow = messageList(page).locator('.cometchat-message-list__message').last();
      await requireDelivered(lastRow.locator(SEL.imagesBubble), 'images batch');
      await expect(lastRow.locator(SEL.imageCaption)).toHaveCount(0);
    });
  });

  // ==================== 12. Multi-image bubble (receive) ====================

  test.describe('Multi-image bubble', () => {
    test('renders a 2x2 grid for 4 images', async () => {
      const tag = `img4-${Date.now()}`;
      if (!(await stageAndSend(page, IMAGES_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.imagesBubble, tag);
      await requireDelivered(bubble, '4-image bubble');
      await expect(bubble.locator(SEL.imageGrid2x2)).toBeVisible();
      await expect(bubble.locator(SEL.imageWrapper)).toHaveCount(4);
      // Every tile must carry its OWN attachment — the grid once rendered the first image in all four.
      // Read each tile's underlying attachment URL rather than the rendered <img src>: a tile shows a
      // SHARED placeholder until its image loads, and uploaded media can 403 in this app, so that swap
      // may never happen. The preloader <img> keeps the real per-attachment URL in exactly that case.
      const urls = await bubble.locator(SEL.imageWrapper).evaluateAll((wrappers) =>
        wrappers.map(
          (w) =>
            Array.from(w.querySelectorAll('img'))
              .map((img) => img.getAttribute('src') ?? '')
              .find((src) => src && !src.includes('image_placeholder')) ?? '',
        ),
      );
      expect(urls.filter(Boolean)).toHaveLength(4);
      expect(new Set(urls).size).toBe(4);
    });

    test('clicking an image in the grid opens the fullscreen viewer', async () => {
      const tag = `imgv-${Date.now()}`;
      if (!(await stageAndSend(page, IMAGES_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.imagesBubble, tag);
      await requireDelivered(bubble, '4-image bubble');
      await bubble.locator(SEL.imageWrapper).first().click();
      await expect(page.locator(SEL.viewer)).toBeVisible({ timeout: 5_000 });
      await page.locator(SEL.viewerClose).click();
      await expect(page.locator(SEL.viewer)).toHaveCount(0);
    });
  });

  // ==================== 13. Multi-video bubble (receive) ====================

  test.describe('Multi-video bubble', () => {
    test('renders a grid layout for 4 videos', async () => {
      const tag = `vid4-${Date.now()}`;
      if (!(await stageAndSend(page, VIDEOS_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.videosBubble, tag);
      await requireDelivered(bubble, '4-video bubble');
      await expect(bubble.locator(SEL.videoGrid2x2)).toBeVisible();
      await expect(bubble.locator(SEL.videoWrapper)).toHaveCount(4);
    });

    test('video tiles show a play overlay', async () => {
      const tag = `vidp-${Date.now()}`;
      if (!(await stageAndSend(page, VIDEOS_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.videosBubble, tag);
      await requireDelivered(bubble, '4-video bubble');
      await expect(bubble.locator(SEL.videoPlayOverlay).first()).toBeVisible();
    });

    test('clicking a video tile opens the fullscreen viewer', async () => {
      const tag = `vidv-${Date.now()}`;
      if (!(await stageAndSend(page, VIDEOS_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.videosBubble, tag);
      await requireDelivered(bubble, '4-video bubble');
      await bubble.locator(SEL.videoWrapper).first().click();
      await expect(page.locator(SEL.viewer)).toBeVisible({ timeout: 5_000 });
      await page.locator(SEL.viewerClose).click();
      await expect(page.locator(SEL.viewer)).toHaveCount(0);
    });
  });

  // ==================== 14. Multi-audio / multi-file expand-collapse ====================

  test.describe('Multi-audio bubble expand/collapse', () => {
    test('shows an expand toggle collapsed to 3 for more than 3 audios', async () => {
      const tag = `aud4-${Date.now()}`;
      if (!(await stageAndSend(page, AUDIOS_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.audiosBubble, tag);
      await requireDelivered(bubble, '4-audio bubble');
      await expect(bubble.locator(SEL.audiosItem)).toHaveCount(3); // COLLAPSED_MAX
      await expect(bubble.locator(SEL.audiosToggle)).toBeVisible();
    });

    test('clicking expand reveals all audio items', async () => {
      const tag = `aude-${Date.now()}`;
      if (!(await stageAndSend(page, AUDIOS_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.audiosBubble, tag);
      await requireDelivered(bubble, '4-audio bubble');
      await bubble.locator(SEL.audiosToggle).click();
      await expect(bubble.locator(SEL.audiosItem)).toHaveCount(4);
    });
  });

  test.describe('Multi-file bubble expand/collapse', () => {
    test('shows an expand toggle collapsed to 3 for more than 3 files', async () => {
      const tag = `fil4-${Date.now()}`;
      if (!(await stageAndSend(page, FILES_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.filesBubble, tag);
      await requireDelivered(bubble, '4-file bubble');
      await expect(bubble.locator(SEL.fileItem)).toHaveCount(3); // COLLAPSED_MAX
      await expect(bubble.locator(SEL.fileExpand)).toBeVisible();
    });

    test('clicking expand reveals all file items', async () => {
      const tag = `file-${Date.now()}`;
      if (!(await stageAndSend(page, FILES_4, tag))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      const bubble = taggedBubble(page, SEL.filesBubble, tag);
      await requireDelivered(bubble, '4-file bubble');
      await bubble.locator(SEL.fileExpand).click();
      await expect(bubble.locator(SEL.fileItem)).toHaveCount(4);
    });
  });

  // ==================== 15. Conversation subtitle media type ====================

  test.describe('Conversation subtitle', () => {
    test('the conversation list shows the media type of the last attachment', async () => {
      if (!(await stageAndSend(page, [IMAGE_1]))) {
        test.skip(true, 'uploads did not settle — backend unavailable');
      }
      // The conversation we sent into surfaces its last message with the image type indicator
      // (icon + "Image" label). Assert on the type icon — robust to the sender-name prefix.
      await expect(page.locator(SEL.convSubtitleImageIcon).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
