/**
 * FocusTrapService Tests
 *
 * Categories: Service Creation, Activation, Deactivation, isActive,
 *             Tab Cycling, Multiple Containers, Edge Cases,
 *             Focusable Element Detection, Focus Restoration
 *
 * Validates: Requirements 5.1, 5.2, 5.4, 5.6, 5.8, 10.6, 14.4, 14.5, 15.7
 *
 * @module services/focus-trap
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../test-setup';
import { FocusTrapService } from './focus-trap.service';

describe('FocusTrapService', () => {
  let service: FocusTrapService;
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
      providers: [FocusTrapService],
    });
    service = TestBed.inject(FocusTrapService);

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
    outsideButton.textContent = 'Outside Button';
    outsideButton.id = 'outside';

    document.body.appendChild(outsideButton);
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up DOM
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    if (outsideButton.parentNode) {
      outsideButton.parentNode.removeChild(outsideButton);
    }

    // Deactivate any active traps
    service.deactivate(container);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('activate', () => {
    it('should activate focus trap for a container', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });
    });

    it('should not activate if container is null', () => {
      service.activate({ container: null as any });
      expect(service.isActive(null as any)).toBe(false);
    });

    it('should not activate twice for the same container', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      service.activate({ container });
      expect(service.isActive(container)).toBe(true);
    });

    it('should focus first focusable element by default', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });
    });

    it('should focus specified element when initialFocus is an HTMLElement', async () => {
      service.activate({ container, initialFocus: button2 });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button2);
      });
    });

    it('should focus container when initialFocus is "container"', async () => {
      container.setAttribute('tabindex', '0');
      service.activate({ container, initialFocus: 'container' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(container);
      });
    });

    it('should focus container when no focusable elements and initialFocus is "first"', async () => {
      // Remove all buttons
      container.innerHTML = '';
      container.setAttribute('tabindex', '0');

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(container);
      });
    });

    it('should store previous focus element', async () => {
      outsideButton.focus();
      expect(document.activeElement).toBe(outsideButton);

      service.activate({ container, returnFocusOnDeactivate: true });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      // Deactivate and check focus is restored
      service.deactivate(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });

    it('should not store previous focus when returnFocusOnDeactivate is false', async () => {
      outsideButton.focus();
      expect(document.activeElement).toBe(outsideButton);

      service.activate({ container, returnFocusOnDeactivate: false });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      // Deactivate - focus should not be restored
      service.deactivate(container);
      // Wait a bit to ensure no focus restoration happens
      await new Promise(resolve => setTimeout(resolve, 50));

      // Focus should remain on the last focused element in container or body
      expect(document.activeElement).not.toBe(outsideButton);
    });
  });

  describe('deactivate', () => {
    it('should deactivate focus trap for a container', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      service.deactivate(container);
      expect(service.isActive(container)).toBe(false);
    });

    it('should do nothing if container has no active trap', () => {
      expect(service.isActive(container)).toBe(false);

      // Should not throw
      service.deactivate(container);

      expect(service.isActive(container)).toBe(false);
    });

    it('should restore focus to previous element', async () => {
      outsideButton.focus();
      expect(document.activeElement).toBe(outsideButton);

      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      service.deactivate(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });

    it('should not restore focus if previous element is removed from DOM', async () => {
      outsideButton.focus();

      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      // Remove the outside button from DOM
      outsideButton.parentNode?.removeChild(outsideButton);

      service.deactivate(container);
      // Wait a bit to ensure no errors occur
      await new Promise(resolve => setTimeout(resolve, 50));

      // Focus should not throw, element is gone
      expect(document.activeElement).not.toBe(outsideButton);
    });

    it('should remove keydown listener', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Focus last element
      button3.focus();

      // Deactivate
      service.deactivate(container);

      // Tab should now work normally (not cycle)
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      container.dispatchEvent(tabEvent);

      // preventDefault should not be called since trap is deactivated
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('isActive', () => {
    it('should return false for container without active trap', () => {
      expect(service.isActive(container)).toBe(false);
    });

    it('should return true for container with active trap', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });
    });

    it('should return false after deactivation', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      service.deactivate(container);
      expect(service.isActive(container)).toBe(false);
    });
  });

  describe('Tab Cycling', () => {
    it('should cycle focus from last to first element on Tab', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Focus last element
      button3.focus();
      expect(document.activeElement).toBe(button3);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(button1);
    });

    it('should cycle focus from first to last element on Shift+Tab', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Focus first element
      button1.focus();
      expect(document.activeElement).toBe(button1);

      // Simulate Shift+Tab key
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(shiftTabEvent);

      expect(document.activeElement).toBe(button3);
    });

    it('should not cycle when focus is on middle element', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Focus middle element
      button2.focus();
      expect(document.activeElement).toBe(button2);

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      container.dispatchEvent(tabEvent);

      // Should not prevent default for middle element
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should prevent Tab when no focusable elements', async () => {
      // Remove all buttons
      container.innerHTML = '';
      container.setAttribute('tabindex', '0');

      service.activate({ container, initialFocus: 'container' });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      container.dispatchEvent(tabEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should ignore non-Tab keys', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      button1.focus();

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');
      container.dispatchEvent(enterEvent);

      // Should not prevent default for non-Tab keys
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Containers', () => {
    let container2: HTMLElement;
    let container2Button: HTMLButtonElement;

    beforeEach(() => {
      container2 = document.createElement('div');
      container2.setAttribute('tabindex', '-1');

      container2Button = document.createElement('button');
      container2Button.textContent = 'Container 2 Button';

      container2.appendChild(container2Button);
      document.body.appendChild(container2);
    });

    afterEach(() => {
      if (container2.parentNode) {
        container2.parentNode.removeChild(container2);
      }
      service.deactivate(container2);
    });

    it('should support multiple active traps', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      service.activate({ container: container2 });
      await vi.waitFor(() => {
        expect(service.isActive(container2)).toBe(true);
      });

      expect(service.isActive(container)).toBe(true);
      expect(service.isActive(container2)).toBe(true);
    });

    it('should deactivate traps independently', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      service.activate({ container: container2 });
      await vi.waitFor(() => {
        expect(service.isActive(container2)).toBe(true);
      });

      service.deactivate(container);

      expect(service.isActive(container)).toBe(false);
      expect(service.isActive(container2)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle disabled buttons correctly', async () => {
      // Disable middle button
      button2.disabled = true;

      service.activate({ container });
      await vi.waitFor(() => {
        // Focus should be on first enabled button
        expect(document.activeElement).toBe(button1);
      });
    });

    it('should handle dynamically added focusable elements', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Add new button
      const newButton = document.createElement('button');
      newButton.textContent = 'New Button';
      container.appendChild(newButton);

      // Focus last original button
      button3.focus();

      // Tab should now go to new button (not cycle to first)
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
      container.dispatchEvent(tabEvent);

      // Should not prevent default since button3 is no longer last
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should handle container with only one focusable element', async () => {
      // Remove extra buttons
      container.removeChild(button2);
      container.removeChild(button3);

      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      // Tab should cycle back to same element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(button1);
    });
  });

  // ============================================================
  // Focusable Element Detection (Requirement 5.1, 5.4, 12.3)
  // ============================================================
  describe('Focusable Element Detection', () => {
    it('should detect input elements as focusable', async () => {
      container.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      container.appendChild(input);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });

    it('should detect anchor elements with href as focusable', async () => {
      container.innerHTML = '';
      const link = document.createElement('a');
      link.href = 'https://example.com';
      link.textContent = 'Link';
      container.appendChild(link);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(link);
      });
    });

    it('should detect select elements as focusable', async () => {
      container.innerHTML = '';
      const select = document.createElement('select');
      const option = document.createElement('option');
      option.textContent = 'Option 1';
      select.appendChild(option);
      container.appendChild(select);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(select);
      });
    });

    it('should detect textarea elements as focusable', async () => {
      container.innerHTML = '';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(textarea);
      });
    });

    it('should detect elements with tabindex="0" as focusable', async () => {
      container.innerHTML = '';
      const div = document.createElement('div');
      div.setAttribute('tabindex', '0');
      div.textContent = 'Focusable div';
      container.appendChild(div);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(div);
      });
    });

    it('should skip disabled input elements', async () => {
      container.innerHTML = '';
      const disabledInput = document.createElement('input');
      disabledInput.disabled = true;
      const enabledInput = document.createElement('input');
      container.appendChild(disabledInput);
      container.appendChild(enabledInput);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(enabledInput);
      });
    });

    it('should skip elements with tabindex="-1"', async () => {
      container.innerHTML = '';
      const hidden = document.createElement('div');
      hidden.setAttribute('tabindex', '-1');
      hidden.textContent = 'Hidden from tab';
      const visible = document.createElement('button');
      visible.textContent = 'Visible';
      container.appendChild(hidden);
      container.appendChild(visible);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(visible);
      });
    });

    it('should detect mixed focusable element types for Tab cycling', async () => {
      container.innerHTML = '';
      const input = document.createElement('input');
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Link';
      const btn = document.createElement('button');
      btn.textContent = 'Btn';
      container.appendChild(input);
      container.appendChild(link);
      container.appendChild(btn);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(input);
      });

      // Focus last element and Tab should cycle to first
      btn.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(input);
    });
  });

  // ============================================================
  // Tab/Shift+Tab Cycling - Extended (Requirement 12.3)
  // ============================================================
  describe('Tab/Shift+Tab Cycling - Extended', () => {
    it('should cycle Shift+Tab from last element to second-to-last (no cycle)', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      // Focus last element
      button3.focus();
      expect(document.activeElement).toBe(button3);

      // Shift+Tab on last element should NOT cycle (it's not the first)
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(shiftTabEvent, 'preventDefault');
      container.dispatchEvent(shiftTabEvent);

      // Should not prevent default since button3 is not the first element
      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('should cycle Tab on last element to first element (forward wrap)', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      button3.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(tabEvent);

      expect(document.activeElement).toBe(button1);
    });

    it('should cycle Shift+Tab on first element to last element (backward wrap)', async () => {
      service.activate({ container });
      await vi.waitFor(() => {
        expect(service.isActive(container)).toBe(true);
      });

      button1.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(shiftTabEvent);

      expect(document.activeElement).toBe(button3);
    });

    it('should handle Tab cycling with single focusable element (self-cycle)', async () => {
      container.innerHTML = '';
      const singleBtn = document.createElement('button');
      singleBtn.textContent = 'Only';
      container.appendChild(singleBtn);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(singleBtn);
      });

      // Tab should cycle back to same element
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(singleBtn);

      // Shift+Tab should also cycle back to same element
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(shiftTabEvent);
      expect(document.activeElement).toBe(singleBtn);
    });

    it('should handle Tab cycling with two focusable elements', async () => {
      container.removeChild(button3);

      service.activate({ container, initialFocus: 'first' });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      // Focus last (button2), Tab should go to first (button1)
      button2.focus();
      const tabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(tabEvent);
      expect(document.activeElement).toBe(button1);

      // Shift+Tab on first should go to last (button2)
      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(shiftTabEvent);
      expect(document.activeElement).toBe(button2);
    });
  });

  // ============================================================
  // Focus Restoration on Deactivation - Extended (Requirement 12.3)
  // ============================================================
  describe('Focus Restoration on Deactivation - Extended', () => {
    it('should restore focus by default (returnFocusOnDeactivate defaults to true)', async () => {
      outsideButton.focus();
      expect(document.activeElement).toBe(outsideButton);

      // Activate without specifying returnFocusOnDeactivate (defaults to true)
      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      service.deactivate(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });

    it('should restore focus when returnFocusOnDeactivate is explicitly true', async () => {
      outsideButton.focus();

      service.activate({ container, returnFocusOnDeactivate: true });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      service.deactivate(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });

    it('should not restore focus when returnFocusOnDeactivate is false', async () => {
      outsideButton.focus();

      service.activate({ container, returnFocusOnDeactivate: false });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      service.deactivate(container);
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(document.activeElement).not.toBe(outsideButton);
    });

    it('should handle deactivation when previous focus element no longer in DOM', async () => {
      const tempButton = document.createElement('button');
      tempButton.textContent = 'Temp';
      document.body.appendChild(tempButton);
      tempButton.focus();

      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });

      // Remove the temp button before deactivation
      tempButton.parentNode?.removeChild(tempButton);

      // Should not throw
      expect(() => service.deactivate(container)).not.toThrow();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Focus should not be on the removed element
      expect(document.activeElement).not.toBe(tempButton);
    });

    it('should handle sequential activate/deactivate cycles correctly', async () => {
      outsideButton.focus();

      // First cycle
      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });
      service.deactivate(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });

      // Second cycle - should work the same
      service.activate({ container });
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(button1);
      });
      service.deactivate(container);
      await vi.waitFor(() => {
        expect(document.activeElement).toBe(outsideButton);
      });
    });
  });
});
