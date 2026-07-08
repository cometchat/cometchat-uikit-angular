/**
 * cometchat-group-members.utils Tests
 *
 * Covers: emitMemberSelectionChange, selectMemberRange,
 *         focusNextMemberItem, focusPreviousMemberItem,
 *         scrollMemberItemIntoView.
 *
 * @module components/cometchat-group-members/utils
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { signal } from '@angular/core';
import {
  emitMemberSelectionChange,
  selectMemberRange,
  focusNextMemberItem,
  focusPreviousMemberItem,
  scrollMemberItemIntoView,
} from './cometchat-group-members.utils';
import { SelectionMode } from '../../Enums/Enums';
import { EventEmitter } from '@angular/core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMember(uid: string): CometChat.GroupMember {
  const m = new CometChat.GroupMember(uid, CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT);
  m.setName(`User ${uid}`);
  return m;
}

function makeMembers(count: number): CometChat.GroupMember[] {
  return Array.from({ length: count }, (_, i) => makeMember(`uid-${i}`));
}

describe('cometchat-group-members.utils', () => {

  // ==================== emitMemberSelectionChange ====================

  describe('emitMemberSelectionChange', () => {
    it('should emit a SelectionState with the correct mode', () => {
      const emitter = new EventEmitter<any>();
      const spy = vi.fn();
      emitter.subscribe(spy);

      emitMemberSelectionChange(
        SelectionMode.multiple,
        new Set(['uid1', 'uid2']),
        'uid2',
        emitter
      );

      expect(spy).toHaveBeenCalledTimes(1);
      const emitted = spy.mock.calls[0][0];
      expect(emitted.mode).toBe(SelectionMode.multiple);
    });

    it('should emit selectedIds as a Set copy', () => {
      const emitter = new EventEmitter<any>();
      const spy = vi.fn();
      emitter.subscribe(spy);
      const original = new Set(['uid1']);

      emitMemberSelectionChange(SelectionMode.single, original, 'uid1', emitter);

      const emitted = spy.mock.calls[0][0];
      expect(emitted.selectedIds).toBeInstanceOf(Set);
      expect(emitted.selectedIds.has('uid1')).toBe(true);
      // Should be a copy, not the same reference
      expect(emitted.selectedIds).not.toBe(original);
    });

    it('should emit lastSelectedId correctly', () => {
      const emitter = new EventEmitter<any>();
      const spy = vi.fn();
      emitter.subscribe(spy);

      emitMemberSelectionChange(SelectionMode.multiple, new Set(), 'uid5', emitter);

      expect(spy.mock.calls[0][0].lastSelectedId).toBe('uid5');
    });

    it('should handle null lastSelectedId', () => {
      const emitter = new EventEmitter<any>();
      const spy = vi.fn();
      emitter.subscribe(spy);

      emitMemberSelectionChange(SelectionMode.multiple, new Set(), null, emitter);

      expect(spy.mock.calls[0][0].lastSelectedId).toBeNull();
    });
  });

  // ==================== selectMemberRange ====================

  describe('selectMemberRange', () => {
    it('should select all members in range when none are selected', () => {
      const members = makeMembers(5);
      const selected = new Set<string>();
      const emitter = new EventEmitter<any>();
      const spy = vi.fn();
      emitter.subscribe(spy);

      selectMemberRange(members, 1, 3, selected, emitter, SelectionMode.multiple);

      expect(selected.has('uid-1')).toBe(true);
      expect(selected.has('uid-2')).toBe(true);
      expect(selected.has('uid-3')).toBe(true);
    });

    it('should deselect all members in range when clicked member is already selected', () => {
      const members = makeMembers(5);
      const selected = new Set(['uid-1', 'uid-2', 'uid-3']);
      const emitter = new EventEmitter<any>();

      selectMemberRange(members, 1, 3, selected, emitter, SelectionMode.multiple);

      expect(selected.has('uid-1')).toBe(false);
      expect(selected.has('uid-2')).toBe(false);
      expect(selected.has('uid-3')).toBe(false);
    });

    it('should handle reversed range (endIndex < startIndex)', () => {
      const members = makeMembers(5);
      const selected = new Set<string>();
      const emitter = new EventEmitter<any>();

      selectMemberRange(members, 3, 1, selected, emitter, SelectionMode.multiple);

      expect(selected.has('uid-1')).toBe(true);
      expect(selected.has('uid-2')).toBe(true);
      expect(selected.has('uid-3')).toBe(true);
    });

    it('should return the endIndex', () => {
      const members = makeMembers(5);
      const selected = new Set<string>();
      const emitter = new EventEmitter<any>();

      const result = selectMemberRange(members, 0, 2, selected, emitter, SelectionMode.multiple);
      expect(result).toBe(2);
    });

    it('should emit selection change event', () => {
      const members = makeMembers(3);
      const selected = new Set<string>();
      const emitter = new EventEmitter<any>();
      const spy = vi.fn();
      emitter.subscribe(spy);

      selectMemberRange(members, 0, 2, selected, emitter, SelectionMode.multiple);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== focusNextMemberItem ====================

  describe('focusNextMemberItem', () => {
    it('should do nothing when memberCount is 0', () => {
      const focusedIndex = signal(0);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusNextMemberItem(0, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(0);
      expect(cdr.markForCheck).not.toHaveBeenCalled();
    });

    it('should move to next index', () => {
      const focusedIndex = signal(0);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusNextMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(1);
    });

    it('should wrap to 0 from last index', () => {
      const focusedIndex = signal(4);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusNextMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(0);
    });

    it('should move to 0 when current index is -1', () => {
      const focusedIndex = signal(-1);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusNextMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(0);
    });

    it('should call markForCheck and scroll callback', () => {
      const focusedIndex = signal(0);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusNextMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(cdr.markForCheck).toHaveBeenCalled();
      expect(scroll).toHaveBeenCalled();
    });
  });

  // ==================== focusPreviousMemberItem ====================

  describe('focusPreviousMemberItem', () => {
    it('should do nothing when memberCount is 0', () => {
      const focusedIndex = signal(0);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusPreviousMemberItem(0, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(0);
    });

    it('should move to previous index', () => {
      const focusedIndex = signal(3);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusPreviousMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(2);
    });

    it('should wrap to last index from 0', () => {
      const focusedIndex = signal(0);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusPreviousMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(focusedIndex()).toBe(4);
    });

    it('should call markForCheck and scroll callback', () => {
      const focusedIndex = signal(2);
      const cdr = { markForCheck: vi.fn() };
      const scroll = vi.fn();
      focusPreviousMemberItem(5, focusedIndex, cdr as any, scroll);
      expect(cdr.markForCheck).toHaveBeenCalled();
      expect(scroll).toHaveBeenCalled();
    });
  });

  // ==================== scrollMemberItemIntoView ====================

  describe('scrollMemberItemIntoView', () => {
    it('should not throw when listContainer is undefined', () => {
      vi.useFakeTimers();
      const timers: ReturnType<typeof setTimeout>[] = [];
      expect(() => scrollMemberItemIntoView(undefined, 0, timers)).not.toThrow();
      vi.advanceTimersByTime(0);
      vi.useRealTimers();
    });

    it('should push a timer reference to pendingTimers', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const timers: ReturnType<typeof setTimeout>[] = [];
      scrollMemberItemIntoView(container, 0, timers);
      expect(timers.length).toBe(1);
      vi.useRealTimers();
    });

    it('should call scrollIntoView on the focused element', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.setAttribute('data-index', '2');
      item.scrollIntoView = vi.fn();
      container.appendChild(item);

      const timers: ReturnType<typeof setTimeout>[] = [];
      scrollMemberItemIntoView(container, 2, timers);
      vi.advanceTimersByTime(0);
      expect(item.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
      vi.useRealTimers();
    });

    it('should not throw when element at index is not found', () => {
      vi.useFakeTimers();
      const container = document.createElement('div');
      const timers: ReturnType<typeof setTimeout>[] = [];
      scrollMemberItemIntoView(container, 99, timers);
      expect(() => vi.advanceTimersByTime(0)).not.toThrow();
      vi.useRealTimers();
    });
  });
});
