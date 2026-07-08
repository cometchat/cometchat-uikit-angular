import { effect, EffectRef, Injector } from '@angular/core';

/**
 * Options for safeEffect — mirrors Angular's EffectOptions but always
 * includes allowSignalWrites: true so the effect works across Angular 18–21.
 *
 * Background:
 * - Angular 18/19: `allowSignalWrites` is REQUIRED when writing to signals
 *   inside an effect body. Omitting it throws a runtime error.
 * - Angular 21+: `allowSignalWrites` is deprecated and optional (signal writes
 *   inside effects are allowed by default).
 *
 * Using this wrapper means developers never need to remember to add the flag,
 * and the codebase stays compatible across all supported Angular versions.
 */
export interface SafeEffectOptions {
  injector?: Injector;
  manualCleanup?: boolean;
}

/**
 * Drop-in replacement for Angular's `effect()` that is safe to use across
 * Angular 18, 19, 20, and 21.
 *
 * Always passes `allowSignalWrites: true` so signal writes inside the effect
 * body work on Angular 18/19 without requiring each call site to remember
 * the flag. On Angular 21+ the flag is a no-op.
 *
 * @example
 * // Instead of:
 * effect(() => { this.someSignal.set(value); }, { injector: this.injector });
 *
 * // Use:
 * safeEffect(() => { this.someSignal.set(value); }, { injector: this.injector });
 *
 * @param effectFn - The reactive effect function to run
 * @param options  - Optional injector and manualCleanup settings
 * @returns EffectRef that can be used to destroy the effect manually
 */
export function safeEffect(
  effectFn: () => void,
  options?: SafeEffectOptions
): EffectRef {
  return effect(effectFn, {
    ...options,
    allowSignalWrites: true,
  });
}
