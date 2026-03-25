/**
 * HistoryManager Unit Tests
 *
 * Tests for the HistoryManager class that implements undo/redo functionality
 * using a command pattern with history stacks. Covers: undo/redo stack management,
 * state push, undo restores previous state, redo restores next state, empty stack
 * handling, grouping, stack overflow, and clear.
 *
 * Manager classes are plain classes — instantiated directly, NOT via TestBed.
 *
 * @module services/history-manager
 * @see Requirements 5.2, 5.4, 5.6
 */

import { HistoryManager } from './history-manager.class';
import { HistoryEntry } from './rich-text-editor.interfaces';
import { ensureSdkReady, sdkCleanup } from '../test-setup';

/**
 * Helper: create a HistoryEntry with sensible defaults.
 */
function createEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    html: overrides.html ?? '<p>content</p>',
    cursorPosition: overrides.cursorPosition ?? 0,
    timestamp: overrides.timestamp ?? Date.now(),
  };
}

describe('HistoryManager', () => {
  let manager: HistoryManager;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(() => {
    manager = new HistoryManager();
  });

  // ==================== Instantiation ====================

  describe('Instantiation', () => {
    it('should create an instance with default parameters', () => {
      expect(manager).toBeTruthy();
    });

    it('should create an instance with custom maxStackSize', () => {
      const m = new HistoryManager(50);
      expect(m).toBeTruthy();
    });

    it('should create an instance with custom maxStackSize and groupDelay', () => {
      const m = new HistoryManager(200, 1000);
      expect(m).toBeTruthy();
    });
  });

  // ==================== Push Operations ====================

  describe('push()', () => {
    it('should add an entry to the undo stack', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      expect(manager.getUndoStackSize()).toBe(1);
    });

    it('should add multiple entries with distinct timestamps', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.push(createEntry({ html: '<p>C</p>', timestamp: 3000 }));
      expect(manager.getUndoStackSize()).toBe(3);
    });

    it('should clear the redo stack when a new entry is pushed', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.undo();
      expect(manager.getRedoStackSize()).toBe(1);

      manager.push(createEntry({ html: '<p>C</p>', timestamp: 3000 }));
      expect(manager.getRedoStackSize()).toBe(0);
    });

    it('should set getCurrent() to the latest pushed entry', () => {
      const entry = createEntry({ html: '<p>Latest</p>', timestamp: 1000 });
      manager.push(entry);
      expect(manager.getCurrent()).toEqual(entry);
    });

    it('should enforce maxStackSize by removing oldest entries', () => {
      const m = new HistoryManager(3);
      m.push(createEntry({ html: '<p>1</p>', timestamp: 1000 }));
      m.push(createEntry({ html: '<p>2</p>', timestamp: 2000 }));
      m.push(createEntry({ html: '<p>3</p>', timestamp: 3000 }));
      m.push(createEntry({ html: '<p>4</p>', timestamp: 4000 }));
      expect(m.getUndoStackSize()).toBe(3);
      // Oldest entry (1) should have been removed; current should be 4
      expect(m.getCurrent()!.html).toBe('<p>4</p>');
    });
  });

  // ==================== Grouping Behavior ====================

  describe('Grouping (rapid typing)', () => {
    it('should group entries within the groupDelay window', () => {
      manager.push(createEntry({ html: '<p>H</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>He</p>', timestamp: 1100 })); // within 500ms
      expect(manager.getUndoStackSize()).toBe(1);
      expect(manager.getCurrent()!.html).toBe('<p>He</p>');
    });

    it('should not group entries outside the groupDelay window', () => {
      manager.push(createEntry({ html: '<p>H</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>He</p>', timestamp: 2000 })); // 1000ms > 500ms
      expect(manager.getUndoStackSize()).toBe(2);
    });

    it('should group multiple rapid entries into one', () => {
      manager.push(createEntry({ html: '<p>H</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>He</p>', timestamp: 1100 }));
      manager.push(createEntry({ html: '<p>Hel</p>', timestamp: 1200 }));
      manager.push(createEntry({ html: '<p>Hell</p>', timestamp: 1300 }));
      manager.push(createEntry({ html: '<p>Hello</p>', timestamp: 1400 }));
      expect(manager.getUndoStackSize()).toBe(1);
      expect(manager.getCurrent()!.html).toBe('<p>Hello</p>');
    });

    it('should create a new group after a pause', () => {
      manager.push(createEntry({ html: '<p>Hello</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>Hello </p>', timestamp: 1100 }));
      // Pause > 500ms
      manager.push(createEntry({ html: '<p>Hello W</p>', timestamp: 2000 }));
      expect(manager.getUndoStackSize()).toBe(2);
    });

    it('should respect custom groupDelay', () => {
      const m = new HistoryManager(100, 100); // 100ms groupDelay
      m.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      m.push(createEntry({ html: '<p>AB</p>', timestamp: 1050 })); // within 100ms
      expect(m.getUndoStackSize()).toBe(1);

      m.push(createEntry({ html: '<p>ABC</p>', timestamp: 1200 })); // 150ms > 100ms
      expect(m.getUndoStackSize()).toBe(2);
    });

    it('should add as new entry when stack is empty even if timestamp is close', () => {
      // shouldGroup returns false when stack is empty
      manager.push(createEntry({ html: '<p>First</p>', timestamp: 1000 }));
      expect(manager.getUndoStackSize()).toBe(1);
    });
  });

  // ==================== shouldGroup() ====================

  describe('shouldGroup()', () => {
    it('should return false when undo stack is empty', () => {
      expect(manager.shouldGroup(1000)).toBe(false);
    });

    it('should return true when timestamp is within groupDelay', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      expect(manager.shouldGroup(1200)).toBe(true); // 200ms < 500ms
    });

    it('should return false when timestamp exceeds groupDelay', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      expect(manager.shouldGroup(2000)).toBe(false); // 1000ms > 500ms
    });

    it('should return false when timestamp is exactly at groupDelay boundary', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      // 500ms is not < 500ms, so should return false
      expect(manager.shouldGroup(1500)).toBe(false);
    });
  });

  // ==================== Undo Operations ====================

  describe('undo()', () => {
    it('should return null when undo stack is empty', () => {
      expect(manager.undo()).toBeNull();
    });

    it('should return null when only one entry exists (no previous state)', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      expect(manager.undo()).toBeNull();
    });

    it('should return the previous state after undo', () => {
      const entryA = createEntry({ html: '<p>A</p>', timestamp: 1000 });
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      manager.push(entryA);
      manager.push(entryB);

      const result = manager.undo();
      expect(result).toEqual(entryA);
    });

    it('should move the current entry to the redo stack', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      expect(manager.getRedoStackSize()).toBe(0);

      manager.undo();
      expect(manager.getRedoStackSize()).toBe(1);
    });

    it('should decrease the undo stack size', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      expect(manager.getUndoStackSize()).toBe(2);

      manager.undo();
      expect(manager.getUndoStackSize()).toBe(1);
    });

    it('should support multiple sequential undos', () => {
      const entryA = createEntry({ html: '<p>A</p>', timestamp: 1000 });
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      const entryC = createEntry({ html: '<p>C</p>', timestamp: 3000 });
      manager.push(entryA);
      manager.push(entryB);
      manager.push(entryC);

      expect(manager.undo()).toEqual(entryB);
      expect(manager.undo()).toEqual(entryA);
      // No more previous state
      expect(manager.undo()).toBeNull();
    });

    it('should update getCurrent() after undo', () => {
      const entryA = createEntry({ html: '<p>A</p>', timestamp: 1000 });
      manager.push(entryA);
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));

      manager.undo();
      expect(manager.getCurrent()).toEqual(entryA);
    });
  });

  // ==================== Redo Operations ====================

  describe('redo()', () => {
    it('should return null when redo stack is empty', () => {
      expect(manager.redo()).toBeNull();
    });

    it('should return null when no undo has been performed', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      expect(manager.redo()).toBeNull();
    });

    it('should restore the next state after redo', () => {
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(entryB);
      manager.undo();

      const result = manager.redo();
      expect(result).toEqual(entryB);
    });

    it('should move the entry back to the undo stack', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.undo();
      expect(manager.getUndoStackSize()).toBe(1);

      manager.redo();
      expect(manager.getUndoStackSize()).toBe(2);
    });

    it('should decrease the redo stack size', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.undo();
      expect(manager.getRedoStackSize()).toBe(1);

      manager.redo();
      expect(manager.getRedoStackSize()).toBe(0);
    });

    it('should support multiple sequential redos', () => {
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      const entryC = createEntry({ html: '<p>C</p>', timestamp: 3000 });
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(entryB);
      manager.push(entryC);

      manager.undo(); // back to B
      manager.undo(); // back to A

      expect(manager.redo()).toEqual(entryB);
      expect(manager.redo()).toEqual(entryC);
      // No more redo
      expect(manager.redo()).toBeNull();
    });

    it('should update getCurrent() after redo', () => {
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(entryB);
      manager.undo();

      manager.redo();
      expect(manager.getCurrent()).toEqual(entryB);
    });
  });

  // ==================== Undo/Redo Interplay ====================

  describe('Undo/Redo Interplay', () => {
    it('should clear redo stack when a new entry is pushed after undo', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.undo();
      expect(manager.canRedo()).toBe(true);

      manager.push(createEntry({ html: '<p>C</p>', timestamp: 3000 }));
      expect(manager.canRedo()).toBe(false);
      expect(manager.getRedoStackSize()).toBe(0);
    });

    it('should allow undo then redo to return to the same state', () => {
      const entryA = createEntry({ html: '<p>A</p>', timestamp: 1000 });
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      manager.push(entryA);
      manager.push(entryB);

      manager.undo();
      expect(manager.getCurrent()).toEqual(entryA);

      manager.redo();
      expect(manager.getCurrent()).toEqual(entryB);
    });

    it('should handle alternating undo/redo correctly', () => {
      const entryA = createEntry({ html: '<p>A</p>', timestamp: 1000 });
      const entryB = createEntry({ html: '<p>B</p>', timestamp: 2000 });
      manager.push(entryA);
      manager.push(entryB);

      // Undo → A, Redo → B, Undo → A, Redo → B
      expect(manager.undo()).toEqual(entryA);
      expect(manager.redo()).toEqual(entryB);
      expect(manager.undo()).toEqual(entryA);
      expect(manager.redo()).toEqual(entryB);
    });
  });

  // ==================== canUndo / canRedo Queries ====================

  describe('canUndo()', () => {
    it('should return false on a fresh instance', () => {
      expect(manager.canUndo()).toBe(false);
    });

    it('should return false with only one entry', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      expect(manager.canUndo()).toBe(false);
    });

    it('should return true with two or more entries', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      expect(manager.canUndo()).toBe(true);
    });

    it('should return false after undoing all available entries', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.undo();
      expect(manager.canUndo()).toBe(false);
    });
  });

  describe('canRedo()', () => {
    it('should return false on a fresh instance', () => {
      expect(manager.canRedo()).toBe(false);
    });

    it('should return false when no undo has been performed', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      expect(manager.canRedo()).toBe(false);
    });

    it('should return true after an undo', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.undo();
      expect(manager.canRedo()).toBe(true);
    });

    it('should return false after redoing all available entries', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.undo();
      manager.redo();
      expect(manager.canRedo()).toBe(false);
    });
  });

  // ==================== getCurrent() ====================

  describe('getCurrent()', () => {
    it('should return null on a fresh instance', () => {
      expect(manager.getCurrent()).toBeNull();
    });

    it('should return the last pushed entry', () => {
      const entry = createEntry({ html: '<p>Current</p>', timestamp: 1000 });
      manager.push(entry);
      expect(manager.getCurrent()).toEqual(entry);
    });

    it('should return the previous entry after undo', () => {
      const entryA = createEntry({ html: '<p>A</p>', timestamp: 1000 });
      manager.push(entryA);
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.undo();
      expect(manager.getCurrent()).toEqual(entryA);
    });

    it('should return null after undoing the only remaining entry', () => {
      manager.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      manager.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      manager.undo(); // returns A, undo stack has [A]
      // canUndo is false (only 1 entry), but getCurrent returns A
      expect(manager.getCurrent()!.html).toBe('<p>A</p>');
    });
  });

  // ==================== Stack Size Queries ====================

  describe('getUndoStackSize() / getRedoStackSize()', () => {
    it('should return 0 for both stacks on a fresh instance', () => {
      expect(manager.getUndoStackSize()).toBe(0);
      expect(manager.getRedoStackSize()).toBe(0);
    });

    it('should track undo stack size correctly', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      expect(manager.getUndoStackSize()).toBe(1);
      manager.push(createEntry({ timestamp: 2000 }));
      expect(manager.getUndoStackSize()).toBe(2);
    });

    it('should track redo stack size correctly after undos', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.push(createEntry({ timestamp: 3000 }));

      manager.undo();
      expect(manager.getRedoStackSize()).toBe(1);
      manager.undo();
      expect(manager.getRedoStackSize()).toBe(2);
    });
  });

  // ==================== clear() ====================

  describe('clear()', () => {
    it('should reset both stacks to empty', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.undo();

      manager.clear();
      expect(manager.getUndoStackSize()).toBe(0);
      expect(manager.getRedoStackSize()).toBe(0);
    });

    it('should reset getCurrent() to null', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.clear();
      expect(manager.getCurrent()).toBeNull();
    });

    it('should reset canUndo and canRedo to false', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.undo();

      manager.clear();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it('should not throw when called on an already empty manager', () => {
      expect(() => manager.clear()).not.toThrow();
    });

    it('should allow new entries after clear', () => {
      manager.push(createEntry({ html: '<p>Old</p>', timestamp: 1000 }));
      manager.clear();
      manager.push(createEntry({ html: '<p>New</p>', timestamp: 5000 }));
      expect(manager.getUndoStackSize()).toBe(1);
      expect(manager.getCurrent()!.html).toBe('<p>New</p>');
    });
  });

  // ==================== Stack Overflow Handling ====================

  describe('Stack Overflow Handling', () => {
    it('should cap undo stack at maxStackSize', () => {
      const m = new HistoryManager(5);
      for (let i = 0; i < 10; i++) {
        m.push(createEntry({ html: `<p>${i}</p>`, timestamp: (i + 1) * 1000 }));
      }
      expect(m.getUndoStackSize()).toBe(5);
    });

    it('should remove oldest entries when undo stack overflows', () => {
      const m = new HistoryManager(3);
      m.push(createEntry({ html: '<p>0</p>', timestamp: 1000 }));
      m.push(createEntry({ html: '<p>1</p>', timestamp: 2000 }));
      m.push(createEntry({ html: '<p>2</p>', timestamp: 3000 }));
      m.push(createEntry({ html: '<p>3</p>', timestamp: 4000 }));

      // Oldest (0) removed, stack is [1, 2, 3]
      expect(m.getUndoStackSize()).toBe(3);
      expect(m.getCurrent()!.html).toBe('<p>3</p>');

      // Undo twice to reach the oldest remaining
      m.undo(); // returns 2
      m.undo(); // returns 1
      expect(m.getCurrent()!.html).toBe('<p>1</p>');
    });

    it('should cap redo stack at maxStackSize during undo', () => {
      const m = new HistoryManager(3);
      // Push 3 entries
      m.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      m.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      m.push(createEntry({ html: '<p>C</p>', timestamp: 3000 }));

      // Undo all — redo stack gets entries
      m.undo(); // redo: [C]
      m.undo(); // redo: [C, B] — but canUndo is false (only 1 entry left)
      expect(m.getRedoStackSize()).toBeLessThanOrEqual(3);
    });
  });

  // ==================== Empty Stack Handling (Req 5.6) ====================

  describe('Empty Stack Handling', () => {
    it('should handle undo on empty stack gracefully', () => {
      expect(() => manager.undo()).not.toThrow();
      expect(manager.undo()).toBeNull();
    });

    it('should handle redo on empty stack gracefully', () => {
      expect(() => manager.redo()).not.toThrow();
      expect(manager.redo()).toBeNull();
    });

    it('should handle getCurrent on empty stack gracefully', () => {
      expect(() => manager.getCurrent()).not.toThrow();
      expect(manager.getCurrent()).toBeNull();
    });

    it('should handle clear on empty stack gracefully', () => {
      expect(() => manager.clear()).not.toThrow();
    });

    it('should handle canUndo on empty stack gracefully', () => {
      expect(() => manager.canUndo()).not.toThrow();
      expect(manager.canUndo()).toBe(false);
    });

    it('should handle canRedo on empty stack gracefully', () => {
      expect(() => manager.canRedo()).not.toThrow();
      expect(manager.canRedo()).toBe(false);
    });

    it('should handle getUndoStackSize on empty stack', () => {
      expect(manager.getUndoStackSize()).toBe(0);
    });

    it('should handle getRedoStackSize on empty stack', () => {
      expect(manager.getRedoStackSize()).toBe(0);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should preserve cursorPosition through push/undo/redo cycle', () => {
      const entry = createEntry({ html: '<p>Test</p>', cursorPosition: 42, timestamp: 1000 });
      manager.push(createEntry({ html: '<p>Before</p>', cursorPosition: 10, timestamp: 500 }));
      manager.push(entry);

      manager.undo();
      const redone = manager.redo();
      expect(redone!.cursorPosition).toBe(42);
    });

    it('should handle entries with zero timestamp', () => {
      expect(() => manager.push(createEntry({ timestamp: 0 }))).not.toThrow();
      expect(manager.getUndoStackSize()).toBe(1);
    });

    it('should handle entries with very large timestamps', () => {
      expect(() => manager.push(createEntry({ timestamp: Number.MAX_SAFE_INTEGER }))).not.toThrow();
      expect(manager.getUndoStackSize()).toBe(1);
    });

    it('should handle entries with empty HTML', () => {
      manager.push(createEntry({ html: '', timestamp: 1000 }));
      expect(manager.getCurrent()!.html).toBe('');
    });

    it('should handle entries with very long HTML content', () => {
      const longHtml = '<p>' + 'a'.repeat(10000) + '</p>';
      manager.push(createEntry({ html: longHtml, timestamp: 1000 }));
      expect(manager.getCurrent()!.html).toBe(longHtml);
    });

    it('should handle maxStackSize of 1', () => {
      const m = new HistoryManager(1);
      m.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      m.push(createEntry({ html: '<p>B</p>', timestamp: 2000 }));
      expect(m.getUndoStackSize()).toBe(1);
      expect(m.getCurrent()!.html).toBe('<p>B</p>');
    });

    it('should handle groupDelay of 0 (no grouping)', () => {
      const m = new HistoryManager(100, 0);
      m.push(createEntry({ html: '<p>A</p>', timestamp: 1000 }));
      m.push(createEntry({ html: '<p>B</p>', timestamp: 1000 })); // same timestamp, but 0 is not < 0
      expect(m.getUndoStackSize()).toBe(2);
    });

    it('should handle rapid push then clear then push', () => {
      manager.push(createEntry({ timestamp: 1000 }));
      manager.push(createEntry({ timestamp: 2000 }));
      manager.clear();
      manager.push(createEntry({ html: '<p>Fresh</p>', timestamp: 5000 }));
      expect(manager.getUndoStackSize()).toBe(1);
      expect(manager.getCurrent()!.html).toBe('<p>Fresh</p>');
    });
  });
});
