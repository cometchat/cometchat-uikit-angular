/**
 * DialogFocusManager Service Tests
 *
 * Tests focus capture on dialog open, focus restore on dialog close,
 * nested dialog support, Escape key handling, ARIA attribute management,
 * focusFirstOrClose behavior, and null element handling.
 *
 * @testCategories Service Creation, Focus Capture, Focus Restore,
 *                 Escape Key Handling, Nested Dialogs, Null Handling,
 *                 focusFirstOrClose, isDialogActive
 * @validates Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 10.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DialogFocusManager } from './dialog-focus-manager.service';
import { FocusTrapService } from './focus-trap.service';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

describe('DialogFocusManager', () => {
  let service: DialogFocusManager;
  let focusTrapService: FocusTrapService;
  let container: HTMLElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let button3: HTMLButtonElement;
  let outsideButton: HTMLButtonElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DialogFocusManager, FocusTrapService],
    });
    service = TestBed.inject(DialogFocusManager);
    focusTrapService = TestBed.inject(FocusTrapService);

    // Create test DOM structure
    container = document.createElement('div');
    container.setAttribute('tabindex', '-1');

    button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    button1.id = 'btn1';

    button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    button2.id = 'btn2';

    button3 = document.createElement('button');
    button3.textContent = 'Button 3';
    button3.id = 'btn3';

    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);

    outsideButton = document.createElement('button');
    outsideButton.textContent = 'Outside';
    outsideButton.id = 'outside';

    document.body.appendChild(outsideButton);
    document.body.appendChild(container);
  });

  afterEach(() => {
    service.closeDialog(container);
    if (container.parentNode) container.parentNode.removeChild(container);
    if (outsideButton.parentNode) outsideButton.parentNode.removeChild(outsideButton);
    vi.restoreAllMocks();
  });

  // ============================================================
  // Service Creation (Requirement 5.1)
  // ============================================================
  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // ============================================================
  // Focus Capture on Dialog Open (Requirement 5.1, 5.4, 12.3)
  // ============================================================
  describe('openDialog - Focus Capture', () => {
    it('should activate focus trap on the container', async () => {
      const activateSpy = vi.spyOn(focusTrapService, 'activate');
      service.openDialog({ container });

      expect(activateSpy).toHaveBeenCalledWith(expect.objectContaining({ container }));
    });

    it('should set aria-modal attribute on container', () => {
      service.openDialog({ container });
      expect(container.getAttribute('aria-modal')).toBe('true');
    });

    it('should set aria-labelledby when labelledById is provided', () => {
      service.openDialog({ container, labelledById: 'dialog-title' });
      expect(container.getAttribute('aria-labelledby')).toBe('dialog-title');
    });

    it('should set aria-describedby when describedById is provided', () => {
      service.openDialog({ container, describedById: 'dialog-desc' });
      expect(container.getAttribute('aria-describedby')).toBe('dialog-desc');
    });

    it('should not set aria-labelledby when not provided', () => {
      service.openDialog({ container });
      expect(container.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('should not set aria-describedby when not provided', () => {
      service.openDialog({ container });
      expect(container.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should mark dialog as active', () => {
      service.openDialog({ container });
      expect(service.isDialogActive(container)).toBe(true);
    });

    it('should not open the same dialog twice', () => {
      const activateSpy = vi.spyOn(focusTrapService, 'activate');
      service.openDialog({ container });
      service.openDialog({ container });

      expect(activateSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass initialFocus through to focus trap', () => {
      const activateSpy = vi.spyOn(focusTrapService, 'activate');
      service.openDialog({ container, initialFocus: button2 });

      expect(activateSpy).toHaveBeenCalledWith(expect.objectContaining({ initialFocus: button2 }));
    });
  });

  // ============================================================
  // Focus Restore on Dialog Close (Requirement 5.1, 5.4, 12.3)
  // ============================================================
  describe('closeDialog - Focus Restore', () => {
    it('should deactivate focus trap on close', () => {
      const deactivateSpy = vi.spyOn(focusTrapService, 'deactivate');
      service.openDialog({ container });
      service.closeDialog(container);

      expect(deactivateSpy).toHaveBeenCalledWith(container);
    });

    it('should remove aria-modal attribute on close', () => {
      service.openDialog({ container });
      service.closeDialog(container);

      expect(container.hasAttribute('aria-modal')).toBe(false);
    });

    it('should remove aria-labelledby attribute on close', () => {
      service.openDialog({ container, labelledById: 'title' });
      service.closeDialog(container);

      expect(container.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('should remove aria-describedby attribute on close', () => {
      service.openDialog({ container, describedById: 'desc' });
      service.closeDialog(container);

      expect(container.hasAttribute('aria-describedby')).toBe(false);
    });

    it('should mark dialog as inactive after close', () => {
      service.openDialog({ container });
      service.closeDialog(container);

      expect(service.isDialogActive(container)).toBe(false);
    });

    it('should do nothing when closing a dialog that was never opened', () => {
      const deactivateSpy = vi.spyOn(focusTrapService, 'deactivate');
      service.closeDialog(container);

      expect(deactivateSpy).not.toHaveBeenCalled();
    });

    it('should restore focus to previously focused element via FocusTrapService', async () => {
      outsideButton.focus();
      expect(document.activeElement).toBe(outsideButton);

      service.openDialog({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      service.closeDialog(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });
  });

  // ============================================================
  // Escape Key Handling (Requirement 5.4)
  // ============================================================
  describe('Escape Key Handling', () => {
    it('should call onEscape callback when Escape is pressed', () => {
      const onEscape = vi.fn();
      service.openDialog({ container, onEscape, closeOnEscape: true });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('should preventDefault and stopPropagation on Escape', () => {
      const onEscape = vi.fn();
      service.openDialog({ container, onEscape, closeOnEscape: true });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      container.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();
    });

    it('should not call onEscape when closeOnEscape is false', () => {
      const onEscape = vi.fn();
      service.openDialog({ container, onEscape, closeOnEscape: false });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('should default closeOnEscape to true', () => {
      const onEscape = vi.fn();
      service.openDialog({ container, onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onEscape is not provided', () => {
      service.openDialog({ container, closeOnEscape: true });

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });

      expect(() => container.dispatchEvent(event)).not.toThrow();
    });

    it('should remove escape handler on close', () => {
      const onEscape = vi.fn();
      service.openDialog({ container, onEscape });
      service.closeDialog(container);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('should ignore non-Escape keys', () => {
      const onEscape = vi.fn();
      service.openDialog({ container, onEscape });

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(event);

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Nested Dialog Support (Requirement 5.4, 12.3)
  // ============================================================
  describe('Nested Dialog Support', () => {
    let innerContainer: HTMLElement;
    let innerButton: HTMLButtonElement;

    beforeEach(() => {
      innerContainer = document.createElement('div');
      innerContainer.setAttribute('tabindex', '-1');
      innerButton = document.createElement('button');
      innerButton.textContent = 'Inner Button';
      innerContainer.appendChild(innerButton);
      document.body.appendChild(innerContainer);
    });

    afterEach(() => {
      service.closeDialog(innerContainer);
      if (innerContainer.parentNode) innerContainer.parentNode.removeChild(innerContainer);
    });

    it('should support opening multiple dialogs simultaneously', () => {
      service.openDialog({ container });
      service.openDialog({ container: innerContainer });

      expect(service.isDialogActive(container)).toBe(true);
      expect(service.isDialogActive(innerContainer)).toBe(true);
    });

    it('should close inner dialog independently of outer', () => {
      service.openDialog({ container });
      service.openDialog({ container: innerContainer });

      service.closeDialog(innerContainer);

      expect(service.isDialogActive(container)).toBe(true);
      expect(service.isDialogActive(innerContainer)).toBe(false);
    });

    it('should close outer dialog independently of inner', () => {
      service.openDialog({ container });
      service.openDialog({ container: innerContainer });

      service.closeDialog(container);

      expect(service.isDialogActive(container)).toBe(false);
      expect(service.isDialogActive(innerContainer)).toBe(true);
    });

    it('should set ARIA attributes independently on each dialog', () => {
      service.openDialog({ container, labelledById: 'outer-title' });
      service.openDialog({ container: innerContainer, labelledById: 'inner-title' });

      expect(container.getAttribute('aria-labelledby')).toBe('outer-title');
      expect(innerContainer.getAttribute('aria-labelledby')).toBe('inner-title');
    });

    it('should handle separate escape handlers for nested dialogs', () => {
      const outerEscape = vi.fn();
      const innerEscape = vi.fn();

      service.openDialog({ container, onEscape: outerEscape });
      service.openDialog({ container: innerContainer, onEscape: innerEscape });

      // Escape on inner dialog
      innerContainer.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      );
      expect(innerEscape).toHaveBeenCalledTimes(1);
      expect(outerEscape).not.toHaveBeenCalled();
    });

    it('should clean up ARIA attributes only for the closed dialog', () => {
      service.openDialog({ container, labelledById: 'outer' });
      service.openDialog({ container: innerContainer, labelledById: 'inner' });

      service.closeDialog(innerContainer);

      expect(container.getAttribute('aria-modal')).toBe('true');
      expect(container.getAttribute('aria-labelledby')).toBe('outer');
      expect(innerContainer.hasAttribute('aria-modal')).toBe(false);
      expect(innerContainer.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  // ============================================================
  // Null Element Handling (Requirement 5.6)
  // ============================================================
  describe('Null Element Handling', () => {
    it('should not throw when openDialog receives null container', () => {
      expect(() => {
        service.openDialog({ container: null as any });
      }).not.toThrow();
    });

    it('should not activate focus trap for null container', () => {
      const activateSpy = vi.spyOn(focusTrapService, 'activate');
      service.openDialog({ container: null as any });

      expect(activateSpy).not.toHaveBeenCalled();
    });

    it('should not mark null container as active', () => {
      service.openDialog({ container: null as any });
      expect(service.isDialogActive(null as any)).toBe(false);
    });

    it('should not throw when closeDialog receives a container that was never opened', () => {
      const unknownContainer = document.createElement('div');
      expect(() => service.closeDialog(unknownContainer)).not.toThrow();
    });

    it('should return false for isDialogActive with unknown container', () => {
      const unknownContainer = document.createElement('div');
      expect(service.isDialogActive(unknownContainer)).toBe(false);
    });
  });

  // ============================================================
  // focusFirstOrClose (Requirement 5.4)
  // ============================================================
  describe('focusFirstOrClose', () => {
    it('should focus element with data-dialog-close attribute first', () => {
      const closeBtn = document.createElement('button');
      closeBtn.setAttribute('data-dialog-close', '');
      closeBtn.textContent = 'Close';
      container.insertBefore(closeBtn, button1);

      service.focusFirstOrClose(container);
      expect(document.activeElement).toBe(closeBtn);
    });

    it('should focus first focusable element when no data-dialog-close exists', () => {
      service.focusFirstOrClose(container);
      expect(document.activeElement).toBe(button1);
    });

    it('should not throw when container has no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);

      expect(() => service.focusFirstOrClose(emptyContainer)).not.toThrow();

      emptyContainer.parentNode?.removeChild(emptyContainer);
    });
  });

  // ============================================================
  // isDialogActive (Requirement 5.4)
  // ============================================================
  describe('isDialogActive', () => {
    it('should return false before any dialog is opened', () => {
      expect(service.isDialogActive(container)).toBe(false);
    });

    it('should return true after dialog is opened', () => {
      service.openDialog({ container });
      expect(service.isDialogActive(container)).toBe(true);
    });

    it('should return false after dialog is closed', () => {
      service.openDialog({ container });
      service.closeDialog(container);
      expect(service.isDialogActive(container)).toBe(false);
    });
  });
});
