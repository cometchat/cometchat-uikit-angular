/**
 * Toolbar formatting utilities for CometChatMessageComposer component.
 *
 * Extracted from cometchat-message-composer.component.ts to isolate
 * rich-text toolbar action helpers and formatting state logic.
 */

import { RichTextFormatState } from '../../services/rich-text-editor.interfaces';

// ==================== Format Toggle Helpers ====================

/**
 * Returns the ARIA pressed state for a toolbar button based on format state.
 *
 * @param formatState - Current editor format state
 * @param format - The format key to check
 */
export function isFormatActive(
  formatState: RichTextFormatState | null,
  format: keyof RichTextFormatState
): boolean {
  if (!formatState) return false;
  return !!formatState[format];
}

/**
 * Returns the CSS modifier class for an active toolbar button.
 *
 * @param isActive - Whether the format is currently active
 */
export function getToolbarButtonClass(isActive: boolean): string {
  return isActive
    ? 'cometchat-message-composer__toolbar-btn cometchat-message-composer__toolbar-btn--active'
    : 'cometchat-message-composer__toolbar-btn';
}

// ==================== Keyboard Shortcut Detection ====================

/**
 * Checks whether a keyboard event matches a formatting shortcut.
 *
 * Supported shortcuts (Ctrl/Cmd + key):
 * - B → bold
 * - I → italic
 * - U → underline
 * - S → strikethrough (Shift+S)
 * - E → inline code
 * - K → link
 * - Shift+7 → ordered list
 * - Shift+8 → bullet list
 */
export type FormattingShortcut =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'inlineCode'
  | 'link'
  | 'orderedList'
  | 'bulletList'
  | null;

export function detectFormattingShortcut(event: KeyboardEvent): FormattingShortcut {
  const isMod = event.ctrlKey || event.metaKey;
  if (!isMod) return null;

  switch (event.key.toLowerCase()) {
    case 'b': return 'bold';
    case 'i': return 'italic';
    case 'u': return 'underline';
    case 's': return event.shiftKey ? 'strikethrough' : null;
    case 'e': return 'inlineCode';
    case 'k': return 'link';
    case '7': return event.shiftKey ? 'orderedList' : null;
    case '8': return event.shiftKey ? 'bulletList' : null;
    default: return null;
  }
}

// ==================== Link Dialog Position ====================

/**
 * Computes the left position for the link dialog, clamped to viewport.
 *
 * @param viewportX - The X coordinate of the trigger (e.g. cursor position)
 * @param dialogWidth - Estimated dialog width in px
 * @param viewportWidth - Current viewport width
 */
export function computeLinkDialogLeft(
  viewportX: number,
  dialogWidth = 320,
  viewportWidth = window.innerWidth
): number {
  const margin = 8;
  const maxLeft = viewportWidth - dialogWidth - margin;
  return Math.max(margin, Math.min(viewportX, maxLeft));
}

// ==================== Popover Mutual Exclusivity ====================

/**
 * Returns the set of popovers that should be closed when a given popover opens.
 * All other popovers are mutually exclusive.
 */
export type PopoverName = 'emoji' | 'attachment' | 'voice' | 'stickers' | 'ai';

export function getPopoversToClose(opening: PopoverName): PopoverName[] {
  const all: PopoverName[] = ['emoji', 'attachment', 'voice', 'stickers', 'ai'];
  return all.filter(p => p !== opening);
}
