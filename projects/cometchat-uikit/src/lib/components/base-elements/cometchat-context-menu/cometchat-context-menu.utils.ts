/**
 * Utility functions for CometChatContextMenu component.
 */
import { Placement } from '../../../Enums/Enums';
import { isMobileDevice } from '../../../utils/util';

/**
 * Returns true when running inside a Storybook docs-mode iframe.
 */
export function isContextMenuDocsMode(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return false;
  }
}

/**
 * Finds the nearest [data-cometchat-container] ancestor, or falls back to
 * the topmost element with the 'cometchat' class.
 */
export function getContextMenuTopElement(startEl: HTMLElement | null): HTMLElement | null {
  let current: HTMLElement | null = startEl;

  while (current) {
    if (current.hasAttribute?.('data-cometchat-container')) return current;
    current = current.parentElement;
  }

  current = startEl;
  let topMostElement: HTMLElement | null = null;
  while (current) {
    if (current.classList?.contains('cometchat')) topMostElement = current;
    current = current.parentElement;
  }

  return topMostElement;
}

/**
 * Determines the available placement for the context menu based on available space.
 */
export function getContextMenuPlacement(
  rect: DOMRect,
  height: number,
  placement: Placement,
  useParentContainer: boolean,
  forceStaticPlacement: boolean,
  parentViewRef: HTMLElement | null
): Placement {
  if (forceStaticPlacement) return placement;

  const spaceAbove = rect.top;
  const parentViewRect = parentViewRef?.getBoundingClientRect();
  const spaceBelow = parentViewRect ? parentViewRect.bottom - rect.bottom : 0;

  if (!useParentContainer) {
    if (isMobileDevice()) {
      return spaceBelow >= height + 10 ? Placement.bottom : Placement.top;
    }
    return placement;
  }

  if (!parentViewRect) return placement;

  if (spaceBelow >= height + 10) return Placement.bottom;
  if (spaceAbove >= height + 10) return Placement.top;
  return placement;
}

/**
 * Calculates the position style for the context menu.
 */
export function calculateContextMenuPosition(
  rect: DOMRect,
  menuDimensions: { width: number; height: number },
  parentRect: DOMRect | null,
  availablePlacement: Placement,
  positioningStrategy: 'viewport' | 'parent' | 'centered',
  forceStaticPlacement: boolean,
  useParentHeight: boolean
): Record<string, string> {
  const { width, height } = menuDimensions;
  const positionStyle: Record<string, string> = {};
  const padding = 10;

  if (forceStaticPlacement) {
    return calculateStaticPosition(rect, width, height, availablePlacement, padding);
  }

  if (positioningStrategy === 'parent' && parentRect) {
    return calculateParentStrategyPosition(rect, width, height, parentRect, availablePlacement, padding, useParentHeight);
  }

  if (positioningStrategy === 'centered' && parentRect) {
    return calculateCenteredPosition(rect, width, height, parentRect, availablePlacement, padding);
  }

  return calculateViewportStrategyPosition(rect, width, height, availablePlacement, padding);
}

function calculateStaticPosition(
  rect: DOMRect, width: number, height: number, placement: Placement, padding: number
): Record<string, string> {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const positionStyle: Record<string, string> = {};

  let left = rect.left;
  let top = rect.top;

  switch (placement) {
    case Placement.top: top = rect.top - height - padding; left = rect.left; break;
    case Placement.bottom: top = rect.bottom + padding; left = rect.left; break;
    case Placement.left: top = rect.top; left = rect.left - width - padding; break;
    case Placement.right: top = rect.top; left = rect.right + padding; break;
    default: top = rect.top; left = rect.left - width - padding; break;
  }

  if (left < padding) left = padding;
  if (left + width > viewportWidth - padding) left = viewportWidth - width - padding;
  if (top < padding) top = padding;
  if (top + height > viewportHeight - padding) top = viewportHeight - height - padding;

  positionStyle['top'] = `${top}px`;
  positionStyle['left'] = `${left}px`;
  return positionStyle;
}

function calculateParentStrategyPosition(
  rect: DOMRect, width: number, height: number, parentRect: DOMRect,
  placement: Placement, padding: number, useParentHeight: boolean
): Record<string, string> {
  const positionStyle: Record<string, string> = {};

  if ([Placement.top, Placement.bottom].includes(placement)) {
    if (useParentHeight) {
      positionStyle['top'] = placement === Placement.bottom
        ? `${Math.min(parentRect.bottom - height, rect.bottom + padding)}px`
        : `${Math.max(parentRect.top, rect.top - height - padding)}px`;
    } else {
      positionStyle['top'] = placement === Placement.bottom
        ? `${rect.bottom + padding}px`
        : `${rect.top - height - padding}px`;
    }
    let adjustedLeft = Math.max(parentRect.left, rect.left);
    adjustedLeft = Math.min(adjustedLeft, parentRect.right - width - padding);
    positionStyle['left'] = `${adjustedLeft}px`;
  } else {
    positionStyle['left'] = placement === Placement.left
      ? `${Math.max(parentRect.left, rect.left - width - padding)}px`
      : `${Math.min(parentRect.right - width, rect.right + padding)}px`;

    if (useParentHeight) {
      let adjustedTop = Math.max(parentRect.top, rect.top);
      adjustedTop = Math.min(adjustedTop, parentRect.bottom - height - padding);
      positionStyle['top'] = `${adjustedTop}px`;
    } else {
      positionStyle['top'] = `${rect.top}px`;
    }
  }

  return positionStyle;
}

function calculateCenteredPosition(
  rect: DOMRect, width: number, height: number, parentRect: DOMRect,
  placement: Placement, padding: number
): Record<string, string> {
  const positionStyle: Record<string, string> = {};

  if (placement === Placement.top) {
    positionStyle['top'] = `${rect.top - height - padding}px`;
  } else if (placement === Placement.bottom) {
    positionStyle['top'] = `${rect.bottom + padding}px`;
  }

  const menuLeft = rect.left + rect.width / 2 - width / 2;
  if (menuLeft < parentRect.left) {
    positionStyle['left'] = `${parentRect.left + padding}px`;
  } else if (menuLeft + width > parentRect.right) {
    positionStyle['left'] = `${parentRect.right - width - padding}px`;
  } else {
    positionStyle['left'] = `${menuLeft}px`;
  }

  return positionStyle;
}

function calculateViewportStrategyPosition(
  rect: DOMRect, width: number, height: number, placement: Placement, padding: number
): Record<string, string> {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const positionStyle: Record<string, string> = {};

  if ([Placement.top, Placement.bottom].includes(placement)) {
    positionStyle['top'] = placement === Placement.bottom
      ? `${rect.bottom + height + padding > viewportHeight ? rect.top - height - padding : rect.bottom + padding}px`
      : `${rect.top - height - padding < 0 ? rect.bottom + padding : rect.top - height - padding}px`;
    positionStyle['left'] = rect.left + width - padding > viewportWidth
      ? `${viewportWidth - width - padding}px`
      : `${rect.left - padding}px`;
  } else {
    positionStyle['left'] = placement === Placement.left
      ? `${rect.left - width - padding < 0 ? rect.right + padding : rect.left - width - padding}px`
      : `${rect.right + width + padding > viewportWidth ? rect.left - width - padding : rect.right + padding}px`;
    positionStyle['top'] = rect.top + height - padding > viewportHeight
      ? `${viewportHeight - height - padding}px`
      : `${rect.top - padding}px`;
  }

  return positionStyle;
}
