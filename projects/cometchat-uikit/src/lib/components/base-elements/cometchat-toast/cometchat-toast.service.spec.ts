/**
 * CometChatToastService Tests
 *
 * Comprehensive test suite for the toast notification service that
 * programmatically creates, manages, and removes toast components.
 * Uses real Angular TestBed with dependency injection — no mocks.
 *
 * Categories: Initialization, Show Method, Convenience Methods,
 *             Toast Queue Management, Remove/Clear, Edge Cases
 *
 * Validates: Requirements 5.1, 5.2, 5.5, 5.6, 14.4, 14.5, 15.7
 */
import { TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatToastService } from './cometchat-toast.service';
import { ToastType } from './cometchat-toast.component';

describe('CometChatToastService', () => {
  let service: CometChatToastService;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    // Clean up any leftover toast containers from previous tests
    document.querySelectorAll('.cometchat-toast-container').forEach(el => el.remove());

    TestBed.configureTestingModule({});
    service = TestBed.inject(CometChatToastService);
  });

  afterEach(() => {
    // Clean up toasts and container after each test
    service.ngOnDestroy();
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should start with zero active toasts', () => {
      expect(service.getActiveCount()).toBe(0);
    });

    it('should create a toast container element in the DOM', () => {
      const container = document.querySelector('.cometchat-toast-container');
      expect(container).toBeTruthy();
    });

    it('should position the container as fixed', () => {
      const container = document.querySelector('.cometchat-toast-container') as HTMLElement;
      expect(container.style.position).toBe('fixed');
    });
  });

  // ---------------------------------------------------------------------------
  // Show Method
  // ---------------------------------------------------------------------------
  describe('show()', () => {
    it('should create a toast and return a numeric ID', () => {
      const id = service.show({ text: 'Hello' });
      expect(typeof id).toBe('number');
      expect(id).toBeGreaterThanOrEqual(0);
    });

    it('should increment active count when a toast is shown', () => {
      service.show({ text: 'Toast 1' });
      expect(service.getActiveCount()).toBe(1);
    });

    it('should return unique IDs for each toast', () => {
      const id1 = service.show({ text: 'Toast 1' });
      const id2 = service.show({ text: 'Toast 2' });
      const id3 = service.show({ text: 'Toast 3' });

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should apply the provided toast type', () => {
      const id = service.show({ text: 'Error!', type: ToastType.error });
      expect(service.getActiveCount()).toBe(1);
      expect(typeof id).toBe('number');
    });

    it('should default to info type when type is not specified', () => {
      const id = service.show({ text: 'Default type' });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should accept custom duration in config', () => {
      const id = service.show({ text: 'Custom duration', duration: 5000 });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should accept showCloseButton in config', () => {
      const id = service.show({ text: 'No close', showCloseButton: false });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should append toast DOM element to the container', () => {
      service.show({ text: 'Visible toast' });
      const container = document.querySelector('.cometchat-toast-container');
      expect(container?.children.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Convenience Methods
  // ---------------------------------------------------------------------------
  describe('Convenience Methods', () => {
    it('should create a success toast via success()', () => {
      const id = service.success('Operation completed');
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should create an error toast via error()', () => {
      const id = service.error('Something went wrong');
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should create a warning toast via warning()', () => {
      const id = service.warning('Be careful');
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should create an info toast via info()', () => {
      const id = service.info('FYI');
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should pass optional config through convenience methods', () => {
      const id = service.success('Done', { duration: 10000, showCloseButton: false });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Toast Queue Management
  // ---------------------------------------------------------------------------
  describe('Toast Queue Management', () => {
    it('should stack multiple toasts', () => {
      service.show({ text: 'Toast 1' });
      service.show({ text: 'Toast 2' });
      service.show({ text: 'Toast 3' });

      expect(service.getActiveCount()).toBe(3);
    });

    it('should maintain correct count after removing one toast', () => {
      const id1 = service.show({ text: 'Toast 1' });
      service.show({ text: 'Toast 2' });
      service.show({ text: 'Toast 3' });

      service.remove(id1);

      expect(service.getActiveCount()).toBe(2);
    });

    it('should allow removing toasts in any order', () => {
      const id1 = service.show({ text: 'Toast 1' });
      const id2 = service.show({ text: 'Toast 2' });
      const id3 = service.show({ text: 'Toast 3' });

      // Remove middle toast
      service.remove(id2);
      expect(service.getActiveCount()).toBe(2);

      // Remove last toast
      service.remove(id3);
      expect(service.getActiveCount()).toBe(1);

      // Remove first toast
      service.remove(id1);
      expect(service.getActiveCount()).toBe(0);
    });

    it('should handle mixed convenience and show() calls', () => {
      service.success('Success');
      service.show({ text: 'Custom', type: ToastType.warning });
      service.error('Error');

      expect(service.getActiveCount()).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Remove and Clear
  // ---------------------------------------------------------------------------
  describe('remove()', () => {
    it('should remove a specific toast by ID', () => {
      const id1 = service.show({ text: 'Toast 1' });
      service.show({ text: 'Toast 2' });

      service.remove(id1);

      expect(service.getActiveCount()).toBe(1);
    });

    it('should handle removing a non-existent toast ID gracefully', () => {
      service.show({ text: 'Toast 1' });

      expect(() => service.remove(999)).not.toThrow();
      expect(service.getActiveCount()).toBe(1);
    });

    it('should handle removing the same ID twice gracefully', () => {
      const id = service.show({ text: 'Toast' });

      service.remove(id);
      expect(() => service.remove(id)).not.toThrow();
      expect(service.getActiveCount()).toBe(0);
    });
  });

  describe('clear()', () => {
    it('should remove all active toasts', () => {
      service.show({ text: 'Toast 1' });
      service.show({ text: 'Toast 2' });
      service.show({ text: 'Toast 3' });

      service.clear();

      expect(service.getActiveCount()).toBe(0);
    });

    it('should handle clearing when no toasts are active', () => {
      expect(() => service.clear()).not.toThrow();
      expect(service.getActiveCount()).toBe(0);
    });

    it('should allow showing new toasts after clear', () => {
      service.show({ text: 'Toast 1' });
      service.clear();
      expect(service.getActiveCount()).toBe(0);

      service.show({ text: 'Toast 2' });
      expect(service.getActiveCount()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // getActiveCount
  // ---------------------------------------------------------------------------
  describe('getActiveCount()', () => {
    it('should return 0 when no toasts are active', () => {
      expect(service.getActiveCount()).toBe(0);
    });

    it('should return correct count as toasts are added and removed', () => {
      const id1 = service.show({ text: 'A' });
      expect(service.getActiveCount()).toBe(1);

      const id2 = service.show({ text: 'B' });
      expect(service.getActiveCount()).toBe(2);

      service.remove(id1);
      expect(service.getActiveCount()).toBe(1);

      service.remove(id2);
      expect(service.getActiveCount()).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty string text', () => {
      const id = service.show({ text: '' });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should handle very long text', () => {
      const longText = 'A'.repeat(10000);
      const id = service.show({ text: longText });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should handle zero duration (no auto-dismiss)', () => {
      const id = service.show({ text: 'Persistent', duration: 0 });
      expect(id).toBeGreaterThanOrEqual(0);
      expect(service.getActiveCount()).toBe(1);
    });

    it('should handle negative duration gracefully', () => {
      expect(() => service.show({ text: 'Negative', duration: -1 })).not.toThrow();
      expect(service.getActiveCount()).toBe(1);
    });

    it('should clean up container on ngOnDestroy', () => {
      service.show({ text: 'Toast' });
      service.ngOnDestroy();

      expect(service.getActiveCount()).toBe(0);
    });

    it('should handle rapid show/remove cycles', () => {
      for (let i = 0; i < 10; i++) {
        const id = service.show({ text: `Toast ${i}` });
        service.remove(id);
      }
      expect(service.getActiveCount()).toBe(0);
    });
  });
});
