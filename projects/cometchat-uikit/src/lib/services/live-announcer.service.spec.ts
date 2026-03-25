import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncerService, AriaLivePoliteness } from './live-announcer.service';

describe('LiveAnnouncerService', () => {
  let service: LiveAnnouncerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LiveAnnouncerService],
    });
    service = TestBed.inject(LiveAnnouncerService);
  });

  afterEach(() => {
    // Clean up any live elements created during tests
    service.ngOnDestroy();

    // Also clean up any orphaned elements
    const liveElements = document.querySelectorAll('.cometchat-sr-only');
    liveElements.forEach(el => el.remove());
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('announce', () => {
    it('should create a live region element when first called', async () => {
      expect(document.querySelector('.cometchat-sr-only')).toBeNull();

      service.announce('Test message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement).not.toBeNull();
      });
    });

    it('should set the message content after a short delay', async () => {
      service.announce('Test message');

      // Before the delay, content should be empty
      const liveElement = document.querySelector('.cometchat-sr-only');
      expect(liveElement?.textContent).toBe('');

      // After the delay, content should be set
      await vi.waitFor(() => {
        expect(liveElement?.textContent).toBe('Test message');
      });
    });

    it('should clear the message after the specified duration', async () => {
      service.announce('Test message', 'polite', 200);

      const liveElement = document.querySelector('.cometchat-sr-only');

      // Wait for message to appear
      await vi.waitFor(() => {
        expect(liveElement?.textContent).toBe('Test message');
      });

      // Wait for message to be cleared
      await vi.waitFor(
        () => {
          expect(liveElement?.textContent).toBe('');
        },
        { timeout: 500 }
      );
    });

    it('should use default duration of 1000ms', async () => {
      service.announce('Test message');

      const liveElement = document.querySelector('.cometchat-sr-only');

      // Wait for message to appear
      await vi.waitFor(() => {
        expect(liveElement?.textContent).toBe('Test message');
      });

      // Message should still be there after 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(liveElement?.textContent).toBe('Test message');

      // Message should be cleared after 1000ms total
      await vi.waitFor(
        () => {
          expect(liveElement?.textContent).toBe('');
        },
        { timeout: 700 }
      );
    });

    it('should set aria-live to polite by default', async () => {
      service.announce('Test message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('polite');
      });
    });

    it('should set aria-live to assertive when specified', async () => {
      service.announce('Test message', 'assertive');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('assertive');
      });
    });

    it('should not announce empty messages', async () => {
      service.announce('');

      // Wait a bit to ensure no element is created
      await new Promise(resolve => setTimeout(resolve, 150));

      // Element should not be created for empty messages
      const liveElement = document.querySelector('.cometchat-sr-only');
      expect(liveElement).toBeNull();
    });

    it('should not announce when politeness is off', async () => {
      service.announce('Test message', 'off');

      // Wait a bit to ensure no element is created
      await new Promise(resolve => setTimeout(resolve, 150));

      // Element should not be created when politeness is off
      const liveElement = document.querySelector('.cometchat-sr-only');
      expect(liveElement).toBeNull();
    });

    it('should reuse the same live element for multiple announcements', async () => {
      service.announce('First message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('First message');
      });

      const firstElement = document.querySelector('.cometchat-sr-only');

      service.announce('Second message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('Second message');
      });

      const secondElement = document.querySelector('.cometchat-sr-only');
      expect(secondElement).toBe(firstElement);
    });

    it('should cancel previous timeout when announcing new message', async () => {
      service.announce('First message', 'polite', 500);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('First message');
      });

      // Announce new message before first one clears
      service.announce('Second message', 'polite', 500);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('Second message');
      });

      // Second message should clear after its own duration
      await vi.waitFor(
        () => {
          const liveElement = document.querySelector('.cometchat-sr-only');
          expect(liveElement?.textContent).toBe('');
        },
        { timeout: 700 }
      );
    });

    it('should have correct ARIA attributes on live element', async () => {
      service.announce('Test message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement).not.toBeNull();
        expect(liveElement?.getAttribute('aria-atomic')).toBe('true');
        expect(liveElement?.getAttribute('role')).toBe('status');
      });
    });

    it('should have visually hidden styles', async () => {
      service.announce('Test message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only') as HTMLElement;
        expect(liveElement).not.toBeNull();
        expect(liveElement.style.position).toBe('absolute');
        expect(liveElement.style.width).toBe('1px');
        expect(liveElement.style.height).toBe('1px');
        expect(liveElement.style.overflow).toBe('hidden');
      });
    });
  });

  describe('announceError', () => {
    it('should announce with assertive politeness', async () => {
      service.announceError('Error message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('assertive');
        expect(liveElement?.textContent).toBe('Error message');
      });
    });
  });

  describe('announceStatus', () => {
    it('should announce with polite politeness', async () => {
      service.announceStatus('Status message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('polite');
        expect(liveElement?.textContent).toBe('Status message');
      });
    });
  });

  describe('clear', () => {
    it('should clear the current message', async () => {
      service.announce('Test message');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('Test message');
      });

      service.clear();

      const liveElement = document.querySelector('.cometchat-sr-only');
      expect(liveElement?.textContent).toBe('');
    });

    it('should cancel pending timeout', async () => {
      service.announce('Test message', 'polite', 1000);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('Test message');
      });

      service.clear();

      // No error should occur when the original timeout would have fired
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it('should handle being called when no announcement is active', () => {
      // Should not throw
      expect(() => service.clear()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should remove the live element from DOM', async () => {
      service.announce('Test message');

      await vi.waitFor(() => {
        expect(document.querySelector('.cometchat-sr-only')).not.toBeNull();
      });

      service.ngOnDestroy();

      expect(document.querySelector('.cometchat-sr-only')).toBeNull();
    });

    it('should clear pending timeouts', async () => {
      service.announce('Test message', 'polite', 1000);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('Test message');
      });

      service.ngOnDestroy();

      // No error should occur when the timeout would have fired
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    it('should handle being called multiple times', async () => {
      service.announce('Test message');

      await vi.waitFor(() => {
        expect(document.querySelector('.cometchat-sr-only')).not.toBeNull();
      });

      service.ngOnDestroy();
      // Should not throw when called again
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  describe('politeness levels', () => {
    const politenessLevels: AriaLivePoliteness[] = ['polite', 'assertive'];

    politenessLevels.forEach(politeness => {
      it(`should correctly set aria-live to ${politeness}`, async () => {
        service.announce('Test message', politeness);

        await vi.waitFor(() => {
          const liveElement = document.querySelector('.cometchat-sr-only');
          expect(liveElement?.getAttribute('aria-live')).toBe(politeness);
        });
      });
    });
  });

  // ============================================================
  // Null/Undefined Handling (Requirement 5.6, 12.5)
  // ============================================================
  describe('null/undefined message handling', () => {
    it('should not throw when message is null', () => {
      expect(() => service.announce(null as unknown as string)).not.toThrow();
    });

    it('should not create live element when message is null', async () => {
      service.announce(null as unknown as string);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(document.querySelector('.cometchat-sr-only')).toBeNull();
    });

    it('should not throw when message is undefined', () => {
      expect(() => service.announce(undefined as unknown as string)).not.toThrow();
    });

    it('should not create live element when message is undefined', async () => {
      service.announce(undefined as unknown as string);

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(document.querySelector('.cometchat-sr-only')).toBeNull();
    });

    it('should not throw when announceError receives null', () => {
      expect(() => service.announceError(null as unknown as string)).not.toThrow();
    });

    it('should not throw when announceStatus receives null', () => {
      expect(() => service.announceStatus(null as unknown as string)).not.toThrow();
    });
  });

  // ============================================================
  // Duration Boundary Values (Requirement 5.4)
  // ============================================================
  describe('duration boundary values', () => {
    it('should handle zero duration by clearing immediately', async () => {
      service.announce('Quick message', 'polite', 0);

      const liveElement = document.querySelector('.cometchat-sr-only');
      expect(liveElement).not.toBeNull();

      // With duration 0, the clear timeout fires almost immediately
      await vi.waitFor(
        () => {
          expect(liveElement?.textContent).toBe('');
        },
        { timeout: 300 }
      );
    });

    it('should handle short duration and clear after it elapses', async () => {
      // Use a duration longer than the internal 100ms content-setting delay
      // so the message appears before the clear timeout fires
      service.announce('Short-lived message', 'polite', 200);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe('Short-lived message');
      });

      await vi.waitFor(
        () => {
          const liveElement = document.querySelector('.cometchat-sr-only');
          expect(liveElement?.textContent).toBe('');
        },
        { timeout: 400 }
      );
    });
  });

  // ============================================================
  // Politeness Switching (Requirement 5.4, 12.5)
  // ============================================================
  describe('politeness switching between announcements', () => {
    it('should update aria-live when switching from polite to assertive', async () => {
      service.announce('Polite message', 'polite');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('polite');
      });

      service.announce('Assertive message', 'assertive');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('assertive');
        expect(liveElement?.textContent).toBe('Assertive message');
      });
    });

    it('should update aria-live when switching from assertive to polite', async () => {
      service.announce('Assertive message', 'assertive');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('assertive');
      });

      service.announce('Polite message', 'polite');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.getAttribute('aria-live')).toBe('polite');
        expect(liveElement?.textContent).toBe('Polite message');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive announcements', async () => {
      service.announce('Message 1');
      service.announce('Message 2');
      service.announce('Message 3');

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        // Only the last message should be present
        expect(liveElement?.textContent).toBe('Message 3');
      });
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(1000);
      service.announce(longMessage);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe(longMessage);
      });
    });

    it('should handle special characters in messages', async () => {
      const specialMessage = '<script>alert("xss")</script> & "quotes" \'apostrophes\'';
      service.announce(specialMessage);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        // textContent should preserve the text as-is (not interpret HTML)
        expect(liveElement?.textContent).toBe(specialMessage);
      });
    });

    it('should handle unicode characters', async () => {
      const unicodeMessage = '你好世界 🌍 مرحبا';
      service.announce(unicodeMessage);

      await vi.waitFor(() => {
        const liveElement = document.querySelector('.cometchat-sr-only');
        expect(liveElement?.textContent).toBe(unicodeMessage);
      });
    });
  });
});
