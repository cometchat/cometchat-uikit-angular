/**
 * TypeAheadService Tests
 *
 * Categories: Initialization, Character Matching, Buffer Accumulation,
 *             Wrap-Around Search, Buffer Timeout, Edge Cases, Cleanup
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8, 14.4, 14.5, 15.7
 *
 * @module services/type-ahead
 */
import { TestBed } from '@angular/core/testing';
import { TypeAheadService, TypeAheadConfig } from './type-ahead.service';
import { vi, beforeAll, afterAll, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

interface TestItem {
  name: string;
  id: number;
}

describe('TypeAheadService', () => {
  let service: TypeAheadService;

  const testItems: TestItem[] = [
    { name: 'Alice', id: 1 },
    { name: 'Bob', id: 2 },
    { name: 'Charlie', id: 3 },
    { name: 'David', id: 4 },
    { name: 'Diana', id: 5 },
  ];

  const config: TypeAheadConfig<TestItem> = {
    getSearchText: item => item.name,
  };

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeAheadService);
  });

  afterEach(() => {
    service.clearBuffer();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should be provided in root', () => {
      expect(service).toBeTruthy();
    });

    it('should be injectable via TestBed', () => {
      const injected = TestBed.inject(TypeAheadService);
      expect(injected).toBeInstanceOf(TypeAheadService);
    });
  });

  describe('handleCharacter — basic matching', () => {
    it('should find item starting with typed character', () => {
      const result = service.handleCharacter('b', testItems, -1, config);
      expect(result).toBe(1); // Bob
    });

    it('should be case-insensitive', () => {
      const result = service.handleCharacter('B', testItems, -1, config);
      expect(result).toBe(1); // Bob
    });

    it('should return -1 when no match found', () => {
      const result = service.handleCharacter('z', testItems, -1, config);
      expect(result).toBe(-1);
    });

    it('should return -1 for space character', () => {
      const result = service.handleCharacter(' ', testItems, -1, config);
      expect(result).toBe(-1);
    });

    it('should return -1 for multi-character strings', () => {
      const result = service.handleCharacter('ab', testItems, -1, config);
      expect(result).toBe(-1);
    });

    it('should return -1 for empty string', () => {
      const result = service.handleCharacter('', testItems, -1, config);
      expect(result).toBe(-1);
    });
  });

  describe('handleCharacter — buffer accumulation', () => {
    it('should accumulate characters for multi-character search', () => {
      let result = service.handleCharacter('d', testItems, -1, config);
      expect(result).toBe(3); // David

      result = service.handleCharacter('i', testItems, 3, config);
      expect(result).toBe(4); // Diana
    });

    it('should match longer prefixes', () => {
      service.handleCharacter('c', testItems, -1, config);
      service.handleCharacter('h', testItems, 2, config);
      const result = service.handleCharacter('a', testItems, 2, config);
      expect(result).toBe(2); // Charlie
    });
  });

  describe('handleCharacter — wrap-around search', () => {
    it('should search from current position + 1 to end first', () => {
      const result = service.handleCharacter('d', testItems, 0, config);
      expect(result).toBe(3); // David
    });

    it('should wrap around to find items before current position', () => {
      const result = service.handleCharacter('a', testItems, 4, config);
      expect(result).toBe(0); // Alice
    });

    it('should find next matching item after current when multiple matches exist', () => {
      const result = service.handleCharacter('d', testItems, 3, config);
      expect(result).toBe(4); // Diana
    });

    it('should wrap to first match when at last matching item', () => {
      const result = service.handleCharacter('d', testItems, 4, config);
      expect(result).toBe(3); // David
    });
  });

  describe('handleCharacter — buffer timeout', () => {
    it('should reset buffer after default timeout (500ms)', () => {
      service.handleCharacter('d', testItems, -1, config);
      vi.advanceTimersByTime(500);

      const result = service.handleCharacter('i', testItems, 3, config);
      expect(result).toBe(-1); // No item starts with 'i'
    });

    it('should use custom timeout when provided', () => {
      const customConfig: TypeAheadConfig<TestItem> = {
        getSearchText: item => item.name,
        timeout: 200,
      };

      service.handleCharacter('d', testItems, -1, customConfig);
      vi.advanceTimersByTime(100);

      let result = service.handleCharacter('i', testItems, 3, customConfig);
      expect(result).toBe(4); // Diana — buffer still has 'd'

      service.clearBuffer();

      service.handleCharacter('d', testItems, -1, customConfig);
      vi.advanceTimersByTime(200);

      result = service.handleCharacter('i', testItems, 3, customConfig);
      expect(result).toBe(-1); // buffer reset
    });

    it('should reset timeout on each character', () => {
      service.handleCharacter('d', testItems, -1, config);
      vi.advanceTimersByTime(300);

      service.handleCharacter('i', testItems, 3, config);
      vi.advanceTimersByTime(300);

      const result = service.handleCharacter('a', testItems, 4, config);
      expect(result).toBe(4); // Diana matches 'dia'
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const result = service.handleCharacter('a', [], 0, config);
      expect(result).toBe(-1);
    });

    it('should handle single item array', () => {
      const singleItem = [{ name: 'Alice', id: 1 }];
      const result = service.handleCharacter('a', singleItem, -1, config);
      expect(result).toBe(0);
    });

    it('should handle currentIndex at -1 (no current selection)', () => {
      const result = service.handleCharacter('c', testItems, -1, config);
      expect(result).toBe(2); // Charlie
    });

    it('should handle currentIndex beyond array bounds', () => {
      const result = service.handleCharacter('a', testItems, 10, config);
      expect(result).toBe(0); // Alice (wraps around)
    });

    it('should handle special characters in search', () => {
      const itemsWithSpecial = [
        { name: '@admin', id: 1 },
        { name: '#channel', id: 2 },
      ];
      const result = service.handleCharacter('@', itemsWithSpecial, -1, config);
      expect(result).toBe(0);
    });

    it('should handle numeric characters', () => {
      const itemsWithNumbers = [
        { name: '123 Group', id: 1 },
        { name: 'Alpha', id: 2 },
      ];
      const result = service.handleCharacter('1', itemsWithNumbers, -1, config);
      expect(result).toBe(0);
    });
  });

  describe('clearBuffer', () => {
    it('should clear the buffer so next search starts fresh', () => {
      service.handleCharacter('d', testItems, -1, config);
      service.handleCharacter('i', testItems, 3, config);
      service.clearBuffer();

      const result = service.handleCharacter('a', testItems, -1, config);
      expect(result).toBe(0); // Alice
    });

    it('should cancel pending timeout', () => {
      service.handleCharacter('d', testItems, -1, config);
      service.clearBuffer();
      vi.advanceTimersByTime(600);

      const result = service.handleCharacter('b', testItems, -1, config);
      expect(result).toBe(1); // Bob
    });

    it('should be safe to call multiple times', () => {
      service.clearBuffer();
      service.clearBuffer();
      service.clearBuffer();

      const result = service.handleCharacter('a', testItems, -1, config);
      expect(result).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should clear buffer on destroy without errors', () => {
      service.handleCharacter('d', testItems, -1, config);
      service.ngOnDestroy();
      vi.advanceTimersByTime(600);
      // No errors thrown — cleanup was successful
    });
  });
});
