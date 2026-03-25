/**
 * CometChatUIKitUtility Unit Tests
 *
 * Categories: ID Generation, Timestamp, Deep Clone, Edge Cases, Invalid Inputs
 * Validates: Requirements 8.3, 8.6, 14.4, 14.5, 15.7
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ensureSdkReady, sdkCleanup } from './test-setup';
import { CometChatUIKitUtility } from './CometChatUIKitUtility';

describe('CometChatUIKitUtility', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  describe('ID()', () => {
    it('should return a non-empty string', () => {
      const id = CometChatUIKitUtility.ID();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should start with the "cc_" prefix', () => {
      const id = CometChatUIKitUtility.ID();
      expect(id.startsWith('cc_')).toBe(true);
    });

    it('should have at least 4 underscore-separated parts (prefix, timestamp, counter, random)', () => {
      const id = CometChatUIKitUtility.ID();
      const parts = id.split('_');
      expect(parts.length).toBeGreaterThanOrEqual(4);
    });

    it('should contain a numeric timestamp component', () => {
      const id = CometChatUIKitUtility.ID();
      const parts = id.split('_');
      const timestamp = Number(parts[1]);
      expect(Number.isFinite(timestamp)).toBe(true);
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should contain a numeric counter component', () => {
      const id = CometChatUIKitUtility.ID();
      const parts = id.split('_');
      const counter = Number(parts[2]);
      expect(Number.isFinite(counter)).toBe(true);
      expect(counter).toBeGreaterThan(0);
    });

    it('should contain an alphanumeric random suffix', () => {
      const id = CometChatUIKitUtility.ID();
      const parts = id.split('_');
      const randomPart = parts.slice(3).join('_');
      expect(randomPart.length).toBeGreaterThan(0);
      expect(/^[a-z0-9]+$/.test(randomPart)).toBe(true);
    });

    it('should only contain alphanumeric characters and underscores', () => {
      const id = CometChatUIKitUtility.ID();
      expect(/^[a-zA-Z0-9_]+$/.test(id)).toBe(true);
    });

    it('should generate two different IDs on consecutive calls', () => {
      const id1 = CometChatUIKitUtility.ID();
      const id2 = CometChatUIKitUtility.ID();
      expect(id1).not.toBe(id2);
    });

    it('should generate unique IDs across 1000+ calls', () => {
      const ids = new Set<string>();
      const count = 1500;
      for (let i = 0; i < count; i++) {
        ids.add(CometChatUIKitUtility.ID());
      }
      expect(ids.size).toBe(count);
    });

    it('should have incrementing counter values for rapid successive calls', () => {
      const id1 = CometChatUIKitUtility.ID();
      const id2 = CometChatUIKitUtility.ID();
      const counter1 = Number(id1.split('_')[2]);
      const counter2 = Number(id2.split('_')[2]);
      expect(counter2).toBe(counter1 + 1);
    });
  });

  describe('getUnixTimestamp()', () => {
    it('should return a number', () => {
      const ts = CometChatUIKitUtility.getUnixTimestamp();
      expect(typeof ts).toBe('number');
    });

    it('should return a value close to Date.now()', () => {
      const before = Date.now();
      const ts = CometChatUIKitUtility.getUnixTimestamp();
      const after = Date.now();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });
  });

  describe('clone()', () => {
    it('should deep clone a plain object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = CometChatUIKitUtility.clone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should deep clone an array', () => {
      const original = [1, [2, 3], { a: 4 }];
      const cloned = CometChatUIKitUtility.clone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should preserve prototype chain', () => {
      class Foo {
        x = 10;
      }
      const original = new Foo();
      const cloned = CometChatUIKitUtility.clone(original);
      expect(cloned).toBeInstanceOf(Foo);
      expect(cloned.x).toBe(10);
      expect(cloned).not.toBe(original);
    });

    it('should not mutate original when cloned object is modified', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = CometChatUIKitUtility.clone(original);
      cloned.b.c = 99;
      expect(original.b.c).toBe(2);
    });

    it('should clone objects with symbol keys', () => {
      const sym = Symbol('test');
      const original = { [sym]: 'value', regular: 42 };
      const cloned = CometChatUIKitUtility.clone(original);
      expect(cloned[sym]).toBe('value');
      expect(cloned.regular).toBe(42);
      expect(cloned).not.toBe(original);
    });
  });

  describe('clone() - Edge Cases', () => {
    it('should return null when cloning null', () => {
      expect(CometChatUIKitUtility.clone(null)).toBeNull();
    });

    it('should return undefined when cloning undefined', () => {
      expect(CometChatUIKitUtility.clone(undefined)).toBeUndefined();
    });

    it('should return primitive values as-is', () => {
      expect(CometChatUIKitUtility.clone(42)).toBe(42);
      expect(CometChatUIKitUtility.clone('hello')).toBe('hello');
      expect(CometChatUIKitUtility.clone(true)).toBe(true);
      expect(CometChatUIKitUtility.clone(0)).toBe(0);
      expect(CometChatUIKitUtility.clone('')).toBe('');
      expect(CometChatUIKitUtility.clone(false)).toBe(false);
    });

    it('should copy functions by reference', () => {
      const fn = () => 'test';
      expect(CometChatUIKitUtility.clone(fn)).toBe(fn);
    });

    it('should return an empty object when cloning an empty object', () => {
      const cloned = CometChatUIKitUtility.clone({});
      expect(cloned).toEqual({});
    });

    it('should return an empty array when cloning an empty array', () => {
      const cloned = CometChatUIKitUtility.clone([] as unknown[]);
      expect(cloned).toEqual([]);
    });

    it('should handle deeply nested objects', () => {
      const original = { a: { b: { c: { d: { e: 5 } } } } };
      const cloned = CometChatUIKitUtility.clone(original);
      expect(cloned).toEqual(original);
      expect(cloned.a.b.c.d).not.toBe(original.a.b.c.d);
    });

    it('should clone arrays containing mixed types', () => {
      const original = [1, 'two', { three: 3 }, [4], null, true];
      const cloned = CometChatUIKitUtility.clone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
      expect(cloned[3]).not.toBe(original[3]);
    });

    it('should preserve property descriptors (non-writable, non-enumerable)', () => {
      const original: Record<string, unknown> = {};
      Object.defineProperty(original, 'readOnly', {
        value: 42,
        writable: false,
        enumerable: true,
        configurable: true,
      });
      const cloned = CometChatUIKitUtility.clone(original);
      const desc = Object.getOwnPropertyDescriptor(cloned, 'readOnly');
      expect(desc?.value).toBe(42);
      expect(desc?.writable).toBe(false);
    });
  });

  describe('ID() - Boundary Inputs', () => {
    it('should maintain uniqueness across 5000 rapid calls', () => {
      const ids = new Set<string>();
      const count = 5000;
      for (let i = 0; i < count; i++) {
        ids.add(CometChatUIKitUtility.ID());
      }
      expect(ids.size).toBe(count);
    });
  });
});
