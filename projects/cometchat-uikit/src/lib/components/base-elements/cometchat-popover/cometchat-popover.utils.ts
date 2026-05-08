/**
 * Utility functions for CometChatPopover component.
 */
import { Placement } from '../../../Enums/Enums';

/**
 * Returns true when running inside a Storybook docs-mode iframe.
 * In docs mode the URL contains 'viewMode=docs'.
 */
export function isDocsMode(): boolean {
  try {
    return window.location.search.includes('viewMode=docs');
  } catch {
    return false;
  }
}

/**
 * Finds the nearest [data-cometchat-container] ancestor, or falls back to
 * the topmost element with the 'cometchat' class.
 */
export function getTopMostCometChatElement(startEl: HTMLElement): HTMLElement | undefined {
  let current = startEl as HTMLElement;

  // Prefer the nearest [data-cometchat-container] ancestor
  while (current) {
    if (current.hasAttribute?.('data-cometchat-container')) return current;
    current = current.parentElement as HTMLElement;
  }

  // Fall back to topmost .cometchat element
  current = startEl;
  let topMostElement: HTMLElement | null = null;
  while (current) {
    if (current.classList?.contains('cometchat')) topMostElement = current;
    current = current.parentElement as HTMLElement;
  }

  return topMostElement || undefined;
}

/**
 * Determines the best placement for the popover based on available space.
 */
export function getAvailablePlacement(
  rect: DOMRect,
  height: number,
  placement: Placement,
  useParentContainer: boolean,
  parentViewRef: HTMLElement | undefined
): Placement {
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;

  const effectiveUseParent = useParentContainer || isDocsMode();

  if (effectiveUseParent && parentViewRef) {
    const parentRect = parentViewRef.getBoundingClientRect();
    const spaceAboveParent = rect.top - parentRect.top;
    const spaceBelowParent = parentRect.bottom - rect.bottom;
    const spaceLeftParent = rect.left - parentRect.left;
    const spaceRightParent = parentRect.right - rect.right;
    const offset = 10;

    if (placement === Placement.top && spaceAboveParent >= height + offset) return Placement.top;
    if (placement === Placement.bottom && spaceBelowParent >= height + offset) return Placement.bottom;
    if (placement === Placement.left && spaceLeftParent >= height + 10) return Placement.left;
    if (placement === Placement.right && spaceRightParent >= height + 10) return Placement.right;

    if (spaceAboveParent >= height + 10) return Placement.top;
    if (spaceBelowParent >= height + 10) return Placement.bottom;
    if (spaceLeftParent >= height + 10) return Placement.left;
    if (spaceRightParent >= height + 10) return Placement.right;
  }

  if (placement === Placement.top && spaceAbove >= height + 10) return Placement.top;
  if (placement === Placement.bottom && spaceBelow >= height + 10) return Placement.bottom;
  if (placement === Placement.left && spaceLeft >= height + 10) return Placement.left;
  if (placement === Placement.right && spaceRight >= height + 10) return Placement.right;

  if (spaceAbove >= height + 10) return Placement.top;
  if (spaceBelow >= height + 10) return Placement.bottom;
  if (spaceLeft >= height + 10) return Placement.left;
  if (spaceRight >= height + 10) return Placement.right;

  return placement;
}

/**
 * Calculates viewport-based popover position style.
 */
export function calculateViewportPosition(
  rect: DOMRect,
  height: number,
  width: number,
  availablePlacement: Placement,
  offset = 10
): Record<string, string> {
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const positionStyle: Record<string, string> = {};

  if (availablePlacement === Placement.top) {
    positionStyle['top'] = `${rect.top - height - offset}px`;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(10, Math.min(left, viewportWidth - width - 10));
    positionStyle['left'] = `${left}px`;
  } else if (availablePlacement === Placement.bottom) {
    positionStyle['top'] = `${rect.bottom + offset}px`;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(10, Math.min(left, viewportWidth - width - 10));
    positionStyle['left'] = `${left}px`;
  } else if (availablePlacement === Placement.left) {
    positionStyle['left'] = `${rect.left - width - offset}px`;
    let top = rect.top + rect.height / 2 - height / 2;
    top = Math.max(10, Math.min(top, viewportHeight - height - 10));
    positionStyle['top'] = `${top}px`;
  } else if (availablePlacement === Placement.right) {
    positionStyle['left'] = `${rect.right + offset}px`;
    let top = rect.top + rect.height / 2 - height / 2;
    top = Math.max(10, Math.min(top, viewportHeight - height - 10));
    positionStyle['top'] = `${top}px`;
  }

  return positionStyle;
}

/**
 * Calculates parent-container-based popover position style.
 */
export function calculateParentPosition(
  rect: DOMRect,
  height: number,
  width: number,
  parentRect: DOMRect,
  availablePlacement: Placement,
  inDocsMode: boolean,
  hostRect: DOMRect | null,
  showTooltip: boolean
): Record<string, string> {
  const positionStyle: Record<string, string> = {};
  const offset = !showTooltip ? 10 : 5;

  if (inDocsMode && hostRect) {
    positionStyle['position'] = 'absolute';
    if (availablePlacement === Placement.top) {
      positionStyle['top'] = `${rect.top - height - offset - hostRect.top}px`;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
      positionStyle['left'] = `${left - hostRect.left}px`;
    } else if (availablePlacement === Placement.bottom) {
      positionStyle['top'] = `${rect.bottom + offset - hostRect.top}px`;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
      positionStyle['left'] = `${left - hostRect.left}px`;
    } else if (availablePlacement === Placement.left) {
      positionStyle['left'] = `${rect.left - width - offset - hostRect.left}px`;
      let top = rect.top + rect.height / 2 - height / 2;
      top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
      positionStyle['top'] = `${top - hostRect.top}px`;
    } else if (availablePlacement === Placement.right) {
      positionStyle['left'] = `${rect.right + offset - hostRect.left}px`;
      let top = rect.top + rect.height / 2 - height / 2;
      top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
      positionStyle['top'] = `${top - hostRect.top}px`;
    }
  } else {
    if (availablePlacement === Placement.top) {
      positionStyle['top'] = `${Math.max(parentRect.top, rect.top - height - offset)}px`;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
      positionStyle['left'] = `${left}px`;
    } else if (availablePlacement === Placement.bottom) {
      positionStyle['top'] = `${Math.min(parentRect.bottom - height, rect.bottom + offset)}px`;
      let left = rect.left + rect.width / 2 - width / 2;
      left = Math.max(parentRect.left + 10, Math.min(left, parentRect.right - width - 10));
      positionStyle['left'] = `${left}px`;
    } else if (availablePlacement === Placement.left) {
      positionStyle['left'] = `${Math.max(parentRect.left, rect.left - width - offset)}px`;
      let top = rect.top + rect.height / 2 - height / 2;
      top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
      positionStyle['top'] = `${top}px`;
    } else if (availablePlacement === Placement.right) {
      positionStyle['left'] = `${Math.min(parentRect.right - width, rect.right + offset)}px`;
      let top = rect.top + rect.height / 2 - height / 2;
      top = Math.max(parentRect.top + 10, Math.min(top, parentRect.bottom - height - 10));
      positionStyle['top'] = `${top}px`;
    }
  }

  return positionStyle;
}

/**
 * Calculates popover position when not using parent height.
 */
export function calculateNoParentHeightPosition(
  rect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  parentRect: { left: number; right: number },
  placement: Placement
): Record<string, string> {
  const positionStyle: Record<string, string> = {};

  if (placement === Placement.top) {
    positionStyle['top'] = `${rect.top - popoverHeight - 10}px`;
  } else if (placement === Placement.bottom) {
    positionStyle['top'] = `${rect.bottom + 10}px`;
  }

  const popoverLeft = rect.left + rect.width / 2 - popoverWidth / 2;
  if (popoverLeft < parentRect.left) {
    positionStyle['left'] = `${parentRect.left + 10}px`;
  } else if (popoverLeft + popoverWidth > parentRect.right) {
    positionStyle['left'] = `${parentRect.right - popoverWidth - 10}px`;
  } else {
    positionStyle['left'] = `${popoverLeft}px`;
  }

  return positionStyle;
}

/**
 * Returns all focusable elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll(selectors.join(', '))) as HTMLElement[];
}
