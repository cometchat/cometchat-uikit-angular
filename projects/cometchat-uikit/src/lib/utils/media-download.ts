/**
 * The single way the UI Kit saves a media attachment to disk.
 *
 * Every download affordance — the fullscreen viewer, the file bubble's download button, the
 * per-row button in the multi-audio bubble — must route through here. Hand-rolling an anchor at
 * the attachment URL looks like it works locally (same-origin dev media) and then silently
 * degrades to "opens a new tab" against the real CDN, which is the bug this module exists to
 * prevent.
 *
 * Downloads go straight to the browser's default download location; there is deliberately no
 * "Save As" prompt.
 */

import { CometChatLogger } from './CometChatLogger';

/**
 * How a download actually resolved.
 *
 * `opened-in-new-tab` is a degraded success, not a crash: the bytes could not be fetched, so the
 * user got the media in a tab to save manually. Callers that announce progress to assistive tech
 * must not report this as a completed save.
 */
export type MediaDownloadOutcome = 'saved' | 'opened-in-new-tab';

/**
 * Saves a media attachment to disk.
 *
 * The anchor `download` attribute is IGNORED for cross-origin URLs — a security rule so sites
 * can't force-download arbitrary third-party content. CometChat media lives on the CDN (a
 * different origin), so an anchor pointed straight at it degrades to a plain link and the browser
 * just opens the media in a new tab instead of saving it. To actually download, we fetch the
 * bytes into a same-origin `blob:` URL — for which `download` IS honored — and save that.
 *
 * If the fetch fails (CORS not allowed, network error, or an expired/403 link), we fall back to
 * the open-in-a-new-tab behavior so the user can still save the file manually.
 *
 * Never rejects — it resolves with the outcome so callers can report it accurately.
 */
export function triggerMediaDownload(url: string, filename: string): Promise<MediaDownloadOutcome> {
  return fetchMediaBlob(url)
    .then((blob): MediaDownloadOutcome => {
      const objectUrl = URL.createObjectURL(blob);
      saveWithAnchor(objectUrl, filename, false);
      // Release the blob after the click has had a chance to start the download.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      return 'saved';
    })
    .catch((error): MediaDownloadOutcome => {
      CometChatLogger.warn('MediaDownload', 'Blob download failed; opening media in a new tab', error);
      saveWithAnchor(url, filename, true);
      return 'opened-in-new-tab';
    });
}

/**
 * Fetches media bytes as a Blob, throwing on a non-OK response.
 *
 * The bare single-argument `fetch` is load-bearing, not an oversight. Media URLs are signed and
 * carry their auth in the query string, and the CDN answers a preflight `OPTIONS` with a 403 and
 * no CORS headers. Passing ANY custom header (an auth token, a tracing header) or
 * `credentials: 'include'` makes this a preflighted request, which the CDN then rejects — and a
 * wildcard `access-control-allow-origin: *` is refused outright once a request carries credentials.
 * Keep this a simple request. The same rule applies to any global `fetch` interceptor or service
 * worker added later: it must exclude media/CDN URLs.
 */
function fetchMediaBlob(url: string): Promise<Blob> {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  });
}

/**
 * Clicks a temporary anchor to save `href` as `filename`. When `openInNewTab` is true the anchor
 * navigates instead (used only for the cross-origin fallback, where `download` won't apply).
 */
export function saveWithAnchor(href: string, filename: string, openInNewTab: boolean): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.style.display = 'none';
  if (openInNewTab) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
  }
}
