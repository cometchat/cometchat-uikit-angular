/**
 * safeEffect Tests
 *
 * Covers: option pass-through (always allowSignalWrites: true), reactive
 * re-runs, signal writes inside the effect body, manual destroy, and the
 * injection-context requirement.
 *
 * @module utils/safe-effect
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Injector, signal } from '@angular/core';

vi.mock('@angular/core', async importOriginal => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return {
    ...actual,
    effect: vi.fn((fn: () => void, opts?: unknown) => actual.effect(fn, opts as never)),
  };
});

import { effect } from '@angular/core';
import { safeEffect } from './safe-effect';

const effectSpy = effect as unknown as ReturnType<typeof vi.fn>;

describe('safeEffect', () => {
  beforeEach(() => {
    effectSpy.mockClear();
    TestBed.resetTestingModule();
  });

  it('always passes allowSignalWrites: true when no options are given', () => {
    const fn = () => {};
    const ref = TestBed.runInInjectionContext(() => safeEffect(fn));
    expect(effectSpy).toHaveBeenCalledTimes(1);
    expect(effectSpy.mock.calls[0][0]).toBe(fn);
    expect(effectSpy.mock.calls[0][1]).toEqual({ allowSignalWrites: true });
    ref.destroy();
  });

  it('forwards injector and manualCleanup alongside allowSignalWrites', () => {
    const injector = TestBed.inject(Injector);
    const ref = safeEffect(() => {}, { injector, manualCleanup: true });
    expect(effectSpy.mock.calls[0][1]).toEqual({ injector, manualCleanup: true, allowSignalWrites: true });
    ref.destroy();
  });

  it('runs the body and re-runs when a read signal changes', () => {
    const source = signal(1);
    const seen: number[] = [];
    const ref = safeEffect(() => seen.push(source()), { injector: TestBed.inject(Injector) });

    TestBed.tick();
    expect(seen).toEqual([1]);

    source.set(2);
    TestBed.tick();
    expect(seen).toEqual([1, 2]);
    ref.destroy();
  });

  it('allows writing to another signal inside the effect body', () => {
    const source = signal(3);
    const doubled = signal(0);
    const ref = safeEffect(() => doubled.set(source() * 2), { injector: TestBed.inject(Injector) });

    TestBed.tick();
    expect(doubled()).toBe(6);

    source.set(10);
    TestBed.tick();
    expect(doubled()).toBe(20);
    ref.destroy();
  });

  it('stops reacting once the returned EffectRef is destroyed', () => {
    const source = signal('a');
    const seen: string[] = [];
    const ref = safeEffect(() => seen.push(source()), { injector: TestBed.inject(Injector), manualCleanup: true });

    TestBed.tick();
    ref.destroy();
    source.set('b');
    TestBed.tick();
    expect(seen).toEqual(['a']);
  });

  it('throws outside an injection context when no injector is supplied', () => {
    expect(() => safeEffect(() => {})).toThrow(/NG0203|injection context/);
  });
});
