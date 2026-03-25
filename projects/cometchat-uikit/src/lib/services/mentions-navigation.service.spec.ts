import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import {
  MentionsNavigationService,
  MentionSuggestion,
  MentionsNavigationCallbacks,
} from './mentions-navigation.service';
import { createKeyboardEvent } from '../testing/accessibility-test-utils';

describe('MentionsNavigationService', () => {
  let service: MentionsNavigationService;

  const mockSuggestions: MentionSuggestion[] = [
    { id: 'user1', name: 'Alice', avatar: 'alice.png' },
    { id: 'user2', name: 'Bob', avatar: 'bob.png' },
    { id: 'user3', name: 'Charlie' },
  ];

  let mockCallbacks: MentionsNavigationCallbacks;
  let onSelectSpy: ReturnType<typeof vi.fn<(suggestion: MentionSuggestion) => void>>;
  let onCloseSpy: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MentionsNavigationService);

    onSelectSpy = vi.fn<(suggestion: MentionSuggestion) => void>();
    onCloseSpy = vi.fn<() => void>();
    mockCallbacks = {
      onSelect: onSelectSpy,
      onClose: onCloseSpy,
    };

    // Reset service state before each test
    service.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleKeyDown', () => {
    describe('ArrowDown navigation', () => {
      it('should move to next suggestion when ArrowDown is pressed', () => {
        service.setHighlightedIndex(0);
        const event = createKeyboardEvent('ArrowDown');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(service.getHighlightedIndex()).toBe(1);
      });

      it('should wrap to first suggestion when at last and ArrowDown is pressed', () => {
        service.setHighlightedIndex(2);
        const event = createKeyboardEvent('ArrowDown');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(service.getHighlightedIndex()).toBe(0);
      });

      it('should move from -1 to 0 when ArrowDown is pressed with no selection', () => {
        service.setHighlightedIndex(-1);
        const event = createKeyboardEvent('ArrowDown');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(service.getHighlightedIndex()).toBe(0);
      });

      it('should prevent default on ArrowDown', () => {
        const event = createKeyboardEvent('ArrowDown');
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('ArrowUp navigation', () => {
      it('should move to previous suggestion when ArrowUp is pressed', () => {
        service.setHighlightedIndex(2);
        const event = createKeyboardEvent('ArrowUp');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(service.getHighlightedIndex()).toBe(1);
      });

      it('should wrap to last suggestion when at first and ArrowUp is pressed', () => {
        service.setHighlightedIndex(0);
        const event = createKeyboardEvent('ArrowUp');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(service.getHighlightedIndex()).toBe(2);
      });

      it('should wrap to last suggestion when at -1 and ArrowUp is pressed', () => {
        service.setHighlightedIndex(-1);
        const event = createKeyboardEvent('ArrowUp');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(service.getHighlightedIndex()).toBe(2);
      });

      it('should prevent default on ArrowUp', () => {
        service.setHighlightedIndex(1);
        const event = createKeyboardEvent('ArrowUp');
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('Enter selection', () => {
      it('should select highlighted suggestion when Enter is pressed', () => {
        service.setHighlightedIndex(1);
        const event = createKeyboardEvent('Enter');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(onSelectSpy).toHaveBeenCalledWith(mockSuggestions[1]);
        expect(service.getHighlightedIndex()).toBe(-1); // Reset after selection
      });

      it('should not select when no suggestion is highlighted', () => {
        service.setHighlightedIndex(-1);
        const event = createKeyboardEvent('Enter');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(false);
        expect(onSelectSpy).not.toHaveBeenCalled();
      });

      it('should prevent default when selecting', () => {
        service.setHighlightedIndex(0);
        const event = createKeyboardEvent('Enter');
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('Tab selection', () => {
      it('should select highlighted suggestion when Tab is pressed', () => {
        service.setHighlightedIndex(2);
        const event = createKeyboardEvent('Tab');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(onSelectSpy).toHaveBeenCalledWith(mockSuggestions[2]);
        expect(service.getHighlightedIndex()).toBe(-1); // Reset after selection
      });

      it('should not select when no suggestion is highlighted', () => {
        service.setHighlightedIndex(-1);
        const event = createKeyboardEvent('Tab');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(false);
        expect(onSelectSpy).not.toHaveBeenCalled();
      });
    });

    describe('Escape close', () => {
      it('should close panel when Escape is pressed', () => {
        service.setHighlightedIndex(1);
        const event = createKeyboardEvent('Escape');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(true);
        expect(onCloseSpy).toHaveBeenCalled();
        expect(service.getHighlightedIndex()).toBe(-1); // Reset after close
      });

      it('should prevent default on Escape', () => {
        const event = createKeyboardEvent('Escape');
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });
    });

    describe('empty suggestions', () => {
      it('should return false when suggestions array is empty', () => {
        const event = createKeyboardEvent('ArrowDown');

        const handled = service.handleKeyDown(event, [], mockCallbacks);

        expect(handled).toBe(false);
      });

      it('should not call callbacks when suggestions array is empty', () => {
        const event = createKeyboardEvent('Enter');

        service.handleKeyDown(event, [], mockCallbacks);

        expect(onSelectSpy).not.toHaveBeenCalled();
        expect(onCloseSpy).not.toHaveBeenCalled();
      });
    });

    describe('unhandled keys', () => {
      it('should return false for unhandled keys', () => {
        const event = createKeyboardEvent('a');

        const handled = service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(handled).toBe(false);
      });

      it('should not modify highlighted index for unhandled keys', () => {
        service.setHighlightedIndex(1);
        const event = createKeyboardEvent('Shift');

        service.handleKeyDown(event, mockSuggestions, mockCallbacks);

        expect(service.getHighlightedIndex()).toBe(1);
      });
    });
  });

  describe('getHighlightedIndex', () => {
    it('should return -1 initially', () => {
      expect(service.getHighlightedIndex()).toBe(-1);
    });

    it('should return the set index', () => {
      service.setHighlightedIndex(2);
      expect(service.getHighlightedIndex()).toBe(2);
    });
  });

  describe('setHighlightedIndex', () => {
    it('should set the highlighted index', () => {
      service.setHighlightedIndex(1);
      expect(service.getHighlightedIndex()).toBe(1);
    });

    it('should allow setting to -1', () => {
      service.setHighlightedIndex(2);
      service.setHighlightedIndex(-1);
      expect(service.getHighlightedIndex()).toBe(-1);
    });
  });

  describe('reset', () => {
    it('should reset highlighted index to -1', () => {
      service.setHighlightedIndex(2);
      service.reset();
      expect(service.getHighlightedIndex()).toBe(-1);
    });
  });

  describe('getActiveDescendantId', () => {
    it('should return null when no suggestion is highlighted', () => {
      service.setHighlightedIndex(-1);
      expect(service.getActiveDescendantId('mentions-list')).toBeNull();
    });

    it('should return correct ID when suggestion is highlighted', () => {
      service.setHighlightedIndex(0);
      expect(service.getActiveDescendantId('mentions-list')).toBe('mentions-list-option-0');
    });

    it('should return correct ID for different indices', () => {
      service.setHighlightedIndex(2);
      expect(service.getActiveDescendantId('my-panel')).toBe('my-panel-option-2');
    });

    it('should use the provided base ID', () => {
      service.setHighlightedIndex(1);
      expect(service.getActiveDescendantId('custom-id')).toBe('custom-id-option-1');
    });
  });

  describe('single suggestion', () => {
    const singleSuggestion: MentionSuggestion[] = [{ id: 'user1', name: 'Alice' }];

    it('should wrap ArrowDown to same item with single suggestion', () => {
      service.setHighlightedIndex(0);
      const event = createKeyboardEvent('ArrowDown');

      service.handleKeyDown(event, singleSuggestion, mockCallbacks);

      expect(service.getHighlightedIndex()).toBe(0);
    });

    it('should wrap ArrowUp to same item with single suggestion', () => {
      service.setHighlightedIndex(0);
      const event = createKeyboardEvent('ArrowUp');

      service.handleKeyDown(event, singleSuggestion, mockCallbacks);

      expect(service.getHighlightedIndex()).toBe(0);
    });
  });
});
