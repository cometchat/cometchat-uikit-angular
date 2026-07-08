/**
 * Shared helpers for the render-only card path.
 *
 * A raw card payload from the SDK — a developer card's `getCard()`, an agent-card
 * element's `value.card`, or a streamed `card` event — is serialized verbatim and
 * handed to the `CometChatCardView` renderer. These utilities centralize the
 * "is it empty" and "stringify" rules so every card surface treats payloads
 * identically (developer bubble, AI-assistant bubble, streaming bubble).
 */

/** True when the raw card payload has nothing drawable (null, blank string, or empty object). */
export function isEmptyCardPayload(card: unknown): boolean {
  if (card == null) return true;
  if (typeof card === 'string') return card.trim().length === 0;
  if (typeof card === 'object') return Object.keys(card as object).length === 0;
  return false;
}

/** Serializes a raw card payload to the renderer's `cardJson` string, or `''` when empty. */
export function cardPayloadToJson(card: unknown): string {
  if (isEmptyCardPayload(card)) return '';
  return typeof card === 'string' ? card : JSON.stringify(card);
}

/** Runs an SDK string getter, coercing a thrown error or null/undefined to `''`. */
export function safeString(fn: () => string | undefined | null): string {
  try {
    return fn() ?? '';
  } catch {
    return '';
  }
}
