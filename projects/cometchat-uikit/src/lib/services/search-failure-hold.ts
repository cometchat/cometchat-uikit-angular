import { Injectable } from '@angular/core';

/** The two result lists of the search component. */
export type SearchScope = 'conversations' | 'messages';

/**
 * Offline (D84, Android's `updateFinalStateIfCompleted`): inside the search component, a scope that
 * fails with a real error while nothing is shown does not report it on its own. It hands the error
 * to the search component, which has the other scope's answer and decides once every scope has
 * answered: both failed is the error view and `searchError`; results in the other scope stay and the
 * failure still reaches `searchError`; no results anywhere is the plain empty state and no report.
 *
 * Provided by the search component only, and read by the two search services when it is there; a
 * service used without it keeps throwing its error to its caller. Not part of the public API.
 *
 * @internal
 */
@Injectable()
export class SearchFailureHold {
  private readonly held = new Map<SearchScope, unknown>();

  /** Keep a scope's real error until the search component has both answers. */
  hold(scope: SearchScope, error: unknown): void {
    this.held.set(scope, error);
  }

  /** Forget a scope's held error: its search ended, restarted or was reset. */
  drop(scope: SearchScope): void {
    this.held.delete(scope);
  }

  /** Whether any error is waiting. */
  get hasHeld(): boolean {
    return this.held.size > 0;
  }

  /** Hand over every held error and forget them. */
  take(): unknown[] {
    const errors = [...this.held.values()];
    this.held.clear();
    return errors;
  }
}
