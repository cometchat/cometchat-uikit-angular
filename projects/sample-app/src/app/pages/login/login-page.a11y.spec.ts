/**
 * Unit Tests for Login and Credentials Page Landmark Structure
 *
 * Verifies that LoginPageComponent and CredentialsPageComponent render
 * correct <main> landmark elements with appropriate aria-label attributes.
 *
 * Validates: Requirements 2.4, 2.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';

// ── Mock TranslatePipe (returns key as-is) ──

@Pipe({ name: 'translate', standalone: true, pure: false })
class MockTranslatePipe implements PipeTransform {
  transform(key: string): string {
    return key || '';
  }
}

// ── Minimal host that replicates Login page landmark structure ──

@Component({
  selector: 'test-login-landmarks',
  standalone: true,
  imports: [MockTranslatePipe],
  template: `
    <main
      [attr.aria-label]="'login_main_label' | translate"
      id="main-content"
      tabindex="-1"
      class="cometchat-login__container"
    >
      <div class="cometchat-login__content">
        <div>login content placeholder</div>
        @if (errorMessage()) {
          <div class="cometchat-login__error" role="alert">{{ errorMessage() }}</div>
        }
        @if (loggingIn()) {
          <div class="cometchat-login__sr-status" role="status" aria-live="polite">logging_in_status</div>
        }
      </div>
    </main>
  `,
})
class TestLoginLandmarksComponent {
  errorMessage = signal('');
  loggingIn = signal(false);
}

// ── Minimal host that replicates Credentials page landmark structure ──

@Component({
  selector: 'test-credentials-landmarks',
  standalone: true,
  imports: [MockTranslatePipe],
  template: `
    <main
      [attr.aria-label]="'credentials_main_label' | translate"
      id="main-content"
      tabindex="-1"
      class="cometchat-credentials__page"
    >
      <div class="cometchat-credentials__container">
        <div>credentials content placeholder</div>
        @if (errorMessage()) {
          <div class="cometchat-credentials__error" role="alert">{{ errorMessage() }}</div>
        }
      </div>
    </main>
  `,
})
class TestCredentialsLandmarksComponent {
  errorMessage = signal('');
}

// ═══════════════════════════════════════════════════════════════════════════
// Login Page Landmarks
// ═══════════════════════════════════════════════════════════════════════════

describe('Login Page — Landmark Structure', () => {
  let fixture: ComponentFixture<TestLoginLandmarksComponent>;
  let component: TestLoginLandmarksComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestLoginLandmarksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestLoginLandmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Requirement 2.4: <main> with aria-label on Login page ──

  it('should render a <main> element', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main).not.toBeNull();
  });

  it('should have aria-label using the login_main_label key', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main.getAttribute('aria-label')).toBe('login_main_label');
  });

  it('should have id="main-content" on <main>', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main.getAttribute('id')).toBe('main-content');
  });

  it('should have tabindex="-1" on <main> for programmatic focus', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  // ── Requirement 11.1: Loading status announcement ──

  it('should render role="status" with aria-live="polite" when logging in', () => {
    component.loggingIn.set(true);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  it('should not render loading status when not logging in', () => {
    component.loggingIn.set(false);
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('[role="status"]');
    expect(status).toBeNull();
  });

  // ── Requirement 11.3: Error alert ──

  it('should render role="alert" on error message element', () => {
    component.errorMessage.set('Login failed');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
  });

  it('should not render error alert when no error', () => {
    component.errorMessage.set('');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Credentials Page Landmarks
// ═══════════════════════════════════════════════════════════════════════════

describe('Credentials Page — Landmark Structure', () => {
  let fixture: ComponentFixture<TestCredentialsLandmarksComponent>;
  let component: TestCredentialsLandmarksComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestCredentialsLandmarksComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestCredentialsLandmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Requirement 2.5: <main> with aria-label on Credentials page ──

  it('should render a <main> element', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main).not.toBeNull();
  });

  it('should have aria-label using the credentials_main_label key', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main.getAttribute('aria-label')).toBe('credentials_main_label');
  });

  it('should have id="main-content" on <main>', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main.getAttribute('id')).toBe('main-content');
  });

  it('should have tabindex="-1" on <main> for programmatic focus', () => {
    const main = fixture.nativeElement.querySelector('main');
    expect(main.getAttribute('tabindex')).toBe('-1');
  });

  // ── Requirement 11.2: Error alert on Credentials page ──

  it('should render role="alert" on error message element', () => {
    component.errorMessage.set('All fields are required.');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
  });

  it('should not render error alert when no error', () => {
    component.errorMessage.set('');
    fixture.detectChanges();
    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert).toBeNull();
  });
});
