/**
 * Utility functions for CometChatStickersKeyboard component.
 */
import { StickerSet } from './cometchat-stickers-keyboard.types';
import { CometChatLogger } from '../../utils/CometChatLogger';

/**
 * Parses the stickers response from the CometChat stickers extension API.
 *
 * The extension returns a response shaped like:
 * ```
 * { data: { defaultStickers: StickerObj[], customStickers: StickerObj[] } }
 * ```
 * where each StickerObj is a flat object:
 * ```
 * { stickerName, stickerSetName, stickerUrl, stickerOrder, stickerSetOrder }
 * ```
 * This function groups the flat sticker objects by `stickerSetName`.
 */
export function parseStickersResponse(response: unknown): StickerSet {
  const stickerSets: StickerSet = {};

  try {
    const raw = response as Record<string, unknown>;

    // Unwrap nested `data` envelope if present
    const data = (raw['data'] as Record<string, unknown>) ?? raw;

    const defaultStickers = data['defaultStickers'] as Record<string, unknown>[] | undefined;
    const customStickers = data['customStickers'] as Record<string, unknown>[] | undefined;

    // Helper: process a flat array of sticker objects and group by stickerSetName
    const processStickers = (stickers: Record<string, unknown>[], fallbackSet: string) => {
      for (const sticker of stickers) {
        const setName = (sticker['stickerSetName'] as string) || fallbackSet;
        const url = (sticker['stickerUrl'] as string) || '';
        if (!url) continue;

        if (!stickerSets[setName]) {
          stickerSets[setName] = [];
        }

        stickerSets[setName].push({
          stickerUrl: url,
          stickerSetName: setName,
          stickerOrder: Number(sticker['stickerOrder']) || 0,
        });
      }
    };

    if (Array.isArray(defaultStickers)) {
      processStickers(defaultStickers, 'Default');
    }

    if (Array.isArray(customStickers)) {
      processStickers(customStickers, 'Custom');
    }

    // Sort stickers within each set by order
    for (const setName of Object.keys(stickerSets)) {
      stickerSets[setName].sort((a, b) => (a.stickerOrder || 0) - (b.stickerOrder || 0));
    }
  } catch (error) {
    CometChatLogger.error('CometChatStickersKeyboard', 'Error parsing stickers response:', error);
  }

  return stickerSets;
}

/**
 * Calculates the new sticker grid index after arrow-key navigation.
 * Handles wrapping at grid boundaries and accounts for incomplete last rows.
 *
 * @param key - Arrow key pressed ('ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight')
 * @param currentIndex - Current flat index in the sticker grid
 * @param totalStickers - Total number of stickers in the current category
 * @param gridColumns - Number of columns in the grid
 * @returns New flat index after navigation
 */
export function navigateStickerGridIndex(
  key: string,
  currentIndex: number,
  totalStickers: number,
  gridColumns: number
): number {
  if (totalStickers === 0) return currentIndex;

  let newIndex = currentIndex;
  const currentRow = Math.floor(currentIndex / gridColumns);
  const currentCol = currentIndex % gridColumns;
  const totalRows = Math.ceil(totalStickers / gridColumns);
  const lastRowStartIndex = (totalRows - 1) * gridColumns;

  switch (key) {
    case 'ArrowLeft':
      if (currentCol === 0) {
        // At left edge - wrap to end of current row or last item in row
        const rowEndIndex = Math.min(
          currentRow * gridColumns + gridColumns - 1,
          totalStickers - 1
        );
        newIndex = rowEndIndex;
      } else {
        newIndex = currentIndex - 1;
      }
      break;

    case 'ArrowRight': {
      const isLastItemInRow = currentCol === gridColumns - 1;
      const isLastItem = currentIndex === totalStickers - 1;
      if (isLastItemInRow || isLastItem) {
        // At right edge or last item - wrap to start of current row
        newIndex = currentRow * gridColumns;
      } else {
        newIndex = currentIndex + 1;
      }
      break;
    }

    case 'ArrowUp':
      if (currentRow === 0) {
        // At top row - wrap to bottom row, same column if possible
        const targetIndex = lastRowStartIndex + currentCol;
        newIndex = targetIndex < totalStickers ? targetIndex : totalStickers - 1;
      } else {
        newIndex = currentIndex - gridColumns;
      }
      break;

    case 'ArrowDown':
      if (currentRow === totalRows - 1) {
        // At bottom row - wrap to top row, same column
        newIndex = currentCol;
      } else {
        const targetIndex = currentIndex + gridColumns;
        // Handle case where next row has fewer items
        newIndex = targetIndex < totalStickers ? targetIndex : totalStickers - 1;
      }
      break;
  }

  // Ensure newIndex is within bounds
  return Math.max(0, Math.min(newIndex, totalStickers - 1));
}

/**
 * Returns the focusable element selectors used for focus-trap in the stickers keyboard.
 */
export const STICKERS_FOCUSABLE_SELECTORS = [
  '.cometchat-stickers-keyboard__tab',
  '.cometchat-stickers-keyboard__sticker-item',
  '.cometchat-stickers-keyboard__retry-button',
];
