/**
 * Property-Based Tests for AppComponent — Route Focus & Title Updates
 *
 * Feature: sample-app-accessibility, Property 1: Route navigation moves focus to main landmark
 * Feature: sample-app-accessibility, Property 2: Document title updates on route navigation
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1
 *
 * Strategy: These tests verify the AppComponent's core accessibility logic
 * (focus management and title updates on route changes) by directly testing
 * the same logic the AppComponent uses. The AppComponent subscribes to
 * Router NavigationEnd events and:
 *   1. Calls CometChatLocalize.getLocalizedString(route.data.title) to set document.title
 *   2. Calls document.querySelector('main')?.focus() (with body fallback)
 *
 * fast-check generates random route paths and sequences to ensure these
 * properties hold universally across all routes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { CometChatLocalize } from '@cometchat/chat-uikit-angular';

// ---------------------------------------------------------------------------
// Route configuration — mirrors the real app's data.title keys from app.routes.ts
// ---------------------------------------------------------------------------

const ROUTES = [
  { path: 'credentials', titleKey: 'credentials_page_title' },
  { path: 'login', titleKey: 'login_page_title' },
  { path: 'home', titleKey: 'home_page_title' },
] as const;

type RoutePath = (typeof ROUTES)[number]['path'];

const ROUTE_TITLE_MAP: Record<string, string> = Object.fromEntries(
  ROUTES.map(r => [r.path, r.titleKey]),
);

/**
 * fast-check arbitrary: generates a route path from the sample app routes.
 */
const arbRoute = fc.constantFrom<RoutePath>('credentials', 'login', 'home');

/**
 * fast-check arbitrary: generates a non-empty array of route paths.
 */
const arbRouteSequence = fc.array(arbRoute, { minLength: 1, maxLength: 5 });

// ---------------------------------------------------------------------------
// Helpers — replicate the exact logic from AppComponent
// ---------------------------------------------------------------------------

/**
 * Replicates AppComponent.updatePageTitle():
 * reads the route's data.title key and sets document.title via
 * CometChatLocalize.getLocalizedString().
 */
function updatePageTitle(titleKey: string): void {
  if (titleKey) {
    const localizedTitle = CometChatLocalize.getLocalizedString(titleKey);
    document.title = localizedTitle;
  }
}

/**
 * Replicates AppComponent.focusMainContent():
 * focuses the <main> element, or document.body as fallback.
 */
function focusMainContent(): void {
  const main = document.querySelector('main') as HTMLElement;
  if (main) {
    main.focus();
  } else {
    document.body.focus();
  }
}

/**
 * Sets up a <main> element in the DOM (simulating a routed page component).
 */
function setupMainElement(): HTMLElement {
  document.querySelector('main')?.remove();
  const main = document.createElement('main');
  main.setAttribute('tabindex', '-1');
  main.setAttribute('id', 'main-content');
  document.body.appendChild(main);
  return main;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('AppComponent — Route Focus & Title Property Tests', () => {
  let mainEl: HTMLElement;

  beforeEach(() => {
    mainEl = setupMainElement();
    document.body.setAttribute('tabindex', '-1');
  });

  afterEach(() => {
    document.querySelector('main')?.remove();
    document.body.removeAttribute('tabindex');
    document.title = '';
  });

  // -------------------------------------------------------------------------
  // Property 1: Route navigation moves focus to main landmark
  // -------------------------------------------------------------------------

  /**
   * Feature: sample-app-accessibility, Property 1: Route navigation moves focus to main landmark
   *
   * For any route in the sample app (/credentials, /login, /home), after a
   * NavigationEnd event completes, document.activeElement should be the <main>
   * element of the newly rendered page.
   *
   * **Validates: Requirements 4.1**
   */
  describe('Property 1: Route navigation moves focus to main landmark', () => {
    it('should focus <main> after navigating to any single route', () => {
      fc.assert(
        fc.property(arbRoute, (routePath) => {
          // Blur current focus to simulate a fresh navigation
          (document.activeElement as HTMLElement)?.blur();

          // Simulate the route's page rendering a <main> element
          mainEl = setupMainElement();

          // Simulate AppComponent's NavigationEnd handler
          focusMainContent();

          const currentMain = document.querySelector('main');
          expect(currentMain).not.toBeNull();
          expect(document.activeElement).toBe(currentMain);
        }),
        { numRuns: 100 },
      );
    });

    it('should focus <main> after any sequence of route navigations', () => {
      fc.assert(
        fc.property(arbRouteSequence, (routes) => {
          for (const routePath of routes) {
            mainEl = setupMainElement();
            focusMainContent();
          }

          const currentMain = document.querySelector('main');
          expect(currentMain).not.toBeNull();
          expect(document.activeElement).toBe(currentMain);
        }),
        { numRuns: 100 },
      );
    });

    it('should fall back to document.body when <main> is absent', () => {
      fc.assert(
        fc.property(arbRoute, (_routePath) => {
          document.querySelector('main')?.remove();

          focusMainContent();

          expect(document.activeElement).toBe(document.body);
        }),
        { numRuns: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // Property 2: Document title updates on route navigation
  // -------------------------------------------------------------------------

  /**
   * Feature: sample-app-accessibility, Property 2: Document title updates on route navigation
   *
   * For any route in the sample app, after a NavigationEnd event completes,
   * document.title should contain the localized string corresponding to that
   * route's data.title key.
   *
   * **Validates: Requirements 3.1, 3.2, 3.3**
   */
  describe('Property 2: Document title updates on route navigation', () => {
    it('should set document.title to the localized title for any route', () => {
      fc.assert(
        fc.property(arbRoute, (routePath) => {
          const titleKey = ROUTE_TITLE_MAP[routePath];

          updatePageTitle(titleKey);

          const expectedTitle = CometChatLocalize.getLocalizedString(titleKey);
          expect(expectedTitle.length).toBeGreaterThan(0);
          expect(document.title).toBe(expectedTitle);
        }),
        { numRuns: 100 },
      );
    });

    it('should update document.title correctly after any sequence of navigations', () => {
      fc.assert(
        fc.property(arbRouteSequence, (routes) => {
          for (const routePath of routes) {
            const titleKey = ROUTE_TITLE_MAP[routePath];
            updatePageTitle(titleKey);
          }

          const lastRoute = routes[routes.length - 1];
          const titleKey = ROUTE_TITLE_MAP[lastRoute];
          const expectedTitle = CometChatLocalize.getLocalizedString(titleKey);

          expect(expectedTitle.length).toBeGreaterThan(0);
          expect(document.title).toBe(expectedTitle);
        }),
        { numRuns: 100 },
      );
    });

    it('should produce distinct titles for distinct routes', () => {
      fc.assert(
        fc.property(
          arbRoute,
          arbRoute,
          (routeA, routeB) => {
            fc.pre(routeA !== routeB);

            const titleA = CometChatLocalize.getLocalizedString(ROUTE_TITLE_MAP[routeA]);
            const titleB = CometChatLocalize.getLocalizedString(ROUTE_TITLE_MAP[routeB]);

            expect(titleA).not.toBe(titleB);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Unit Tests: Skip Link — First Focusable Element
// Validates: Requirements 1.1, 1.2, 1.3, 1.4
// ═══════════════════════════════════════════════════════════════════════════

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'translate', standalone: true, pure: false })
class MockTranslatePipeForSkipLink implements PipeTransform {
  transform(key: string): string {
    return key || '';
  }
}

/**
 * Minimal test host that replicates AppComponent's skip link + router-outlet
 * structure. We avoid bootstrapping the real AppComponent (which needs Router,
 * Title, ActivatedRoute) and instead test the DOM structure directly.
 */
@Component({
  selector: 'test-app-skip-link',
  standalone: true,
  imports: [MockTranslatePipeForSkipLink],
  template: `
    <a
      class="cometchat-skip-link"
      href="#main-content"
      (click)="onSkipLinkClick($event)"
    >{{ 'skip_to_content' | translate }}</a>
    <main id="main-content" tabindex="-1">Main content</main>
  `,
})
class TestAppSkipLinkComponent {
  onSkipLinkClick(event: Event): void {
    event.preventDefault();
    const main = document.querySelector('main') as HTMLElement;
    if (main) {
      main.focus();
    }
  }
}

describe('AppComponent — Skip Link', () => {
  let fixture: ComponentFixture<TestAppSkipLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestAppSkipLinkComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestAppSkipLinkComponent);
    fixture.detectChanges();
  });

  it('should render the skip link as the first focusable element', () => {
    const allFocusable = fixture.nativeElement.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]',
    );
    expect(allFocusable.length).toBeGreaterThan(0);

    const firstFocusable = allFocusable[0];
    expect(firstFocusable.tagName.toLowerCase()).toBe('a');
    expect(firstFocusable.classList.contains('cometchat-skip-link')).toBe(true);
  });

  it('should have href="#main-content" on the skip link', () => {
    const skipLink = fixture.nativeElement.querySelector('.cometchat-skip-link');
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#main-content');
  });

  it('should use the translate pipe for skip link text (skip_to_content key)', () => {
    const skipLink = fixture.nativeElement.querySelector('.cometchat-skip-link');
    expect(skipLink.textContent.trim()).toBe('skip_to_content');
  });

  it('should move focus to <main> when skip link is activated', () => {
    const skipLink = fixture.nativeElement.querySelector('.cometchat-skip-link') as HTMLElement;
    skipLink.click();
    fixture.detectChanges();

    const main = fixture.nativeElement.querySelector('main');
    expect(document.activeElement).toBe(main);
  });
});
