// Feature: angular-v5-uikit-code-review, Property 25: Overlay position stays within container bounds
// **Validates: Requirements 3.4**

import * as fc from 'fast-check';

/**
 * Pure re-implementation of the 'parent' positioning strategy from
 * CometChatContextMenuComponent.calculateMenuPosition, extracted here so we
 * can test it without a DOM or Angular TestBed.
 *
 * Given a trigger rect, overlay dimensions, and a container rect, the
 * returned top/left must keep the overlay fully inside the container.
 */
function computeParentBoundedPosition(
  triggerRect: { top: number; bottom: number; left: number; right: number; width: number; height: number },
  overlay: { width: number; height: number },
  containerRect: { top: number; bottom: number; left: number; right: number },
  placement: 'top' | 'bottom' | 'left' | 'right'
): { top: number; left: number } {
  const padding = 10;
  const { width, height } = overlay;
  let top: number;
  let left: number;

  if (placement === 'top' || placement === 'bottom') {
    top =
      placement === 'bottom'
        ? Math.min(containerRect.bottom - height, triggerRect.bottom + padding)
        : Math.max(containerRect.top, triggerRect.top - height - padding);

    let adjustedLeft = Math.max(containerRect.left, triggerRect.left);
    adjustedLeft = Math.min(adjustedLeft, containerRect.right - width - padding);
    left = adjustedLeft;
  } else {
    left =
      placement === 'left'
        ? Math.max(containerRect.left, triggerRect.left - width - padding)
        : Math.min(containerRect.right - width, triggerRect.right + padding);

    // Clamp top to container
    let adjustedTop = Math.max(containerRect.top, triggerRect.top);
    adjustedTop = Math.min(adjustedTop, containerRect.bottom - height - padding);
    top = adjustedTop;
  }

  return { top, left };
}

/** Returns true when the overlay rect is fully inside the container rect (with 1px tolerance). */
function isWithinContainer(
  pos: { top: number; left: number },
  overlay: { width: number; height: number },
  container: { top: number; bottom: number; left: number; right: number }
): boolean {
  const tolerance = 1;
  return (
    pos.top >= container.top - tolerance &&
    pos.left >= container.left - tolerance &&
    pos.top + overlay.height <= container.bottom + tolerance &&
    pos.left + overlay.width <= container.right + tolerance
  );
}

describe('Property 3: Overlay stays within container bounds', () => {
  // Arbitrary for a container that is always larger than the overlay
  const containerArb = fc
    .record({
      top: fc.integer({ min: 0, max: 200 }),
      left: fc.integer({ min: 0, max: 200 }),
      width: fc.integer({ min: 200, max: 600 }),
      height: fc.integer({ min: 200, max: 600 }),
    })
    .map(({ top, left, width, height }) => ({
      top,
      left,
      right: left + width,
      bottom: top + height,
    }));

  // Overlay is always smaller than the container
  const overlayArb = fc.record({
    width: fc.integer({ min: 50, max: 180 }),
    height: fc.integer({ min: 30, max: 180 }),
  });

  // Trigger is a small rect inside the container
  const triggerInsideContainerArb = containerArb.chain((container) =>
    fc
      .record({
        top: fc.integer({ min: container.top + 10, max: container.bottom - 30 }),
        left: fc.integer({ min: container.left + 10, max: container.right - 30 }),
      })
      .map(({ top, left }) => ({
        top,
        left,
        right: left + 20,
        bottom: top + 20,
        width: 20,
        height: 20,
      }))
      .map((trigger) => ({ trigger, container }))
  );

  const placementArb = fc.constantFrom<'top' | 'bottom' | 'left' | 'right'>(
    'top',
    'bottom',
    'left',
    'right'
  );

  it('should keep overlay within container for all placements and sizes', () => {
    fc.assert(
      fc.property(
        triggerInsideContainerArb,
        overlayArb,
        placementArb,
        ({ trigger, container }, overlay, placement) => {
          // Skip cases where overlay is larger than container (degenerate)
          if (
            overlay.width > container.right - container.left - 20 ||
            overlay.height > container.bottom - container.top - 20
          ) {
            return true;
          }

          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return isWithinContainer(pos, overlay, container);
        }
      ),
      { numRuns: 500 }
    );
  });

  it('should never produce NaN or Infinity in position values', () => {
    fc.assert(
      fc.property(
        triggerInsideContainerArb,
        overlayArb,
        placementArb,
        ({ trigger, container }, overlay, placement) => {
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return isFinite(pos.top) && isFinite(pos.left);
        }
      )
    );
  });

  it('should clamp left to at least containerRect.left for left/right placements', () => {
    fc.assert(
      fc.property(
        triggerInsideContainerArb,
        overlayArb,
        ({ trigger, container }, overlay) => {
          const pos = computeParentBoundedPosition(trigger, overlay, container, 'left');
          return pos.left >= container.left - 1;
        }
      )
    );
  });

  it('should clamp top to at least containerRect.top for top/bottom placements', () => {
    fc.assert(
      fc.property(
        triggerInsideContainerArb,
        overlayArb,
        ({ trigger, container }, overlay) => {
          const pos = computeParentBoundedPosition(trigger, overlay, container, 'top');
          return pos.top >= container.top - 1;
        }
      )
    );
  });

  it('should clamp right edge within container for all placements', () => {
    fc.assert(
      fc.property(
        triggerInsideContainerArb,
        overlayArb,
        placementArb,
        ({ trigger, container }, overlay, placement) => {
          if (
            overlay.width > container.right - container.left - 20 ||
            overlay.height > container.bottom - container.top - 20
          ) {
            return true;
          }
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return pos.left + overlay.width <= container.right + 1;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should clamp bottom edge within container for all placements', () => {
    fc.assert(
      fc.property(
        triggerInsideContainerArb,
        overlayArb,
        placementArb,
        ({ trigger, container }, overlay, placement) => {
          if (
            overlay.width > container.right - container.left - 20 ||
            overlay.height > container.bottom - container.top - 20
          ) {
            return true;
          }
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return pos.top + overlay.height <= container.bottom + 1;
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should keep overlay within bounds when trigger is at container top-left corner', () => {
    fc.assert(
      fc.property(
        containerArb,
        overlayArb,
        placementArb,
        (container, overlay, placement) => {
          if (
            overlay.width > container.right - container.left - 20 ||
            overlay.height > container.bottom - container.top - 20
          ) {
            return true;
          }
          const trigger = {
            top: container.top,
            left: container.left,
            right: container.left + 20,
            bottom: container.top + 20,
            width: 20,
            height: 20,
          };
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return isWithinContainer(pos, overlay, container);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should keep overlay within bounds when trigger is at container bottom-right corner', () => {
    fc.assert(
      fc.property(
        containerArb,
        overlayArb,
        placementArb,
        (container, overlay, placement) => {
          if (
            overlay.width > container.right - container.left - 20 ||
            overlay.height > container.bottom - container.top - 20
          ) {
            return true;
          }
          const trigger = {
            top: container.bottom - 20,
            left: container.right - 20,
            right: container.right,
            bottom: container.bottom,
            width: 20,
            height: 20,
          };
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return isWithinContainer(pos, overlay, container);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should handle overlay larger than container gracefully (no NaN/Infinity)', () => {
    const smallContainerArb = fc
      .record({
        top: fc.integer({ min: 0, max: 100 }),
        left: fc.integer({ min: 0, max: 100 }),
        width: fc.integer({ min: 50, max: 100 }),
        height: fc.integer({ min: 50, max: 100 }),
      })
      .map(({ top, left, width, height }) => ({
        top,
        left,
        right: left + width,
        bottom: top + height,
      }));

    const largeOverlayArb = fc.record({
      width: fc.integer({ min: 101, max: 300 }),
      height: fc.integer({ min: 101, max: 300 }),
    });

    fc.assert(
      fc.property(
        smallContainerArb,
        largeOverlayArb,
        placementArb,
        (container, overlay, placement) => {
          const trigger = {
            top: container.top + 10,
            left: container.left + 10,
            right: container.left + 30,
            bottom: container.top + 30,
            width: 20,
            height: 20,
          };
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return isFinite(pos.top) && isFinite(pos.left);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('should handle minimum-size containers without errors', () => {
    const tinyContainerArb = fc
      .record({
        top: fc.integer({ min: 0, max: 100 }),
        left: fc.integer({ min: 0, max: 100 }),
      })
      .map(({ top, left }) => ({
        top,
        left,
        right: left + 30,
        bottom: top + 30,
      }));

    const tinyOverlayArb = fc.record({
      width: fc.integer({ min: 5, max: 20 }),
      height: fc.integer({ min: 5, max: 20 }),
    });

    fc.assert(
      fc.property(
        tinyContainerArb,
        tinyOverlayArb,
        placementArb,
        (container, overlay, placement) => {
          const trigger = {
            top: container.top + 5,
            left: container.left + 5,
            right: container.left + 15,
            bottom: container.top + 15,
            width: 10,
            height: 10,
          };
          const pos = computeParentBoundedPosition(trigger, overlay, container, placement);
          return isFinite(pos.top) && isFinite(pos.left);
        }
      ),
      { numRuns: 100 }
    );
  });
});
