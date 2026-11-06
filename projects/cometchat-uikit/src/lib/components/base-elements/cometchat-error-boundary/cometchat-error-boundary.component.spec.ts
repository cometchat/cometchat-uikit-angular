/**
 * CometChatErrorBoundary Component Tests
 *
 * Categories: Defaults, handleError, retry, Rendering (content / fallback /
 *             custom fallbackView), Accessibility.
 *
 * Validates: Requirements 7.1, 7.2, 7.3
 *
 * @module components/base-elements/cometchat-error-boundary
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CometChatErrorBoundaryComponent } from './cometchat-error-boundary.component';
import { CometChatLogger } from '../../../utils/CometChatLogger';

/** Host that projects content and can supply a custom fallback template. */
@Component({
  standalone: true,
  imports: [CometChatErrorBoundaryComponent],
  template: `
    <cometchat-error-boundary [componentName]="name" [fallbackView]="useCustom ? custom : undefined">
      <span class="projected">child content</span>
    </cometchat-error-boundary>

    <ng-template #custom let-ctx>
      <span class="custom-fallback">{{ ctx.componentName }}: {{ ctx.error.message }}</span>
    </ng-template>
  `,
})
class HostComponent {
  name = 'MessageBubble';
  useCustom = false;
  @ViewChild('custom') custom!: TemplateRef<unknown>;
}

describe('CometChatErrorBoundaryComponent', () => {
  let fixture: ComponentFixture<CometChatErrorBoundaryComponent>;
  let component: CometChatErrorBoundaryComponent;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.spyOn(CometChatLogger, 'error').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [CometChatErrorBoundaryComponent, HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatErrorBoundaryComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Defaults
  // -------------------------------------------------------------------------

  describe('Defaults', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should start with no error', () => {
      expect(component.hasError()).toBe(false);
      expect(component.errorContext()).toBeNull();
    });

    it('should default componentName to Unknown', () => {
      expect(component.componentName).toBe('Unknown');
    });

    it('should have no fallbackView by default', () => {
      expect(component.fallbackView).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // handleError
  // -------------------------------------------------------------------------

  describe('handleError', () => {
    it('should enter the error state', () => {
      component.handleError(new Error('boom'));
      expect(component.hasError()).toBe(true);
    });

    it('should record the error on the context', () => {
      const err = new Error('boom');
      component.handleError(err);
      expect(component.errorContext()?.error).toBe(err);
    });

    it('should record the component name on the context', () => {
      component.componentName = 'MessageList';
      component.handleError(new Error('boom'));
      expect(component.errorContext()?.componentName).toBe('MessageList');
    });

    it('should stamp the context with a timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(1700000000000));

      component.handleError(new Error('boom'));
      expect(component.errorContext()?.timestamp).toBe(1700000000000);

      vi.useRealTimers();
    });

    it('should emit the context on the error output', () => {
      const spy = vi.fn();
      component.error.subscribe(spy);
      const err = new Error('boom');

      component.handleError(err);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].error).toBe(err);
    });

    it('should log the error against the component name', () => {
      component.componentName = 'Composer';
      component.handleError(new Error('boom'));
      expect(CometChatLogger.error).toHaveBeenCalled();
    });

    it('should replace the context when a second error arrives', () => {
      component.handleError(new Error('first'));
      component.handleError(new Error('second'));
      expect(component.errorContext()?.error.message).toBe('second');
    });
  });

  // -------------------------------------------------------------------------
  // retry
  // -------------------------------------------------------------------------

  describe('retry', () => {
    it('should clear the error state', () => {
      component.handleError(new Error('boom'));
      component.retry();
      expect(component.hasError()).toBe(false);
    });

    it('should clear the error context', () => {
      component.handleError(new Error('boom'));
      component.retry();
      expect(component.errorContext()).toBeNull();
    });

    it('should be a no-op when there is no error', () => {
      expect(() => component.retry()).not.toThrow();
      expect(component.hasError()).toBe(false);
    });

    it('should not emit on the error output', () => {
      const spy = vi.fn();
      component.handleError(new Error('boom'));
      component.error.subscribe(spy);

      component.retry();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow recovering and failing again', () => {
      component.handleError(new Error('first'));
      component.retry();
      component.handleError(new Error('second'));

      expect(component.hasError()).toBe(true);
      expect(component.errorContext()?.error.message).toBe('second');
    });
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  describe('Rendering', () => {
    it('should render projected content while healthy', () => {
      const host = TestBed.createComponent(HostComponent);
      host.detectChanges();
      expect((host.nativeElement as HTMLElement).querySelector('.projected')).not.toBeNull();
    });

    it('should swap projected content for the fallback on error', () => {
      const host = TestBed.createComponent(HostComponent);
      host.detectChanges();

      const boundary = host.debugElement.children[0].componentInstance as CometChatErrorBoundaryComponent;
      boundary.handleError(new Error('boom'));
      host.detectChanges();

      const hostEl = host.nativeElement as HTMLElement;
      expect(hostEl.querySelector('.projected')).toBeNull();
      expect(hostEl.querySelector('.cometchat-error-boundary__fallback')).not.toBeNull();
    });

    it('should render a retry button in the default fallback', () => {
      fixture.detectChanges();
      component.handleError(new Error('boom'));
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-error-boundary__retry')).not.toBeNull();
    });

    it('should recover when the retry button is clicked', () => {
      const host = TestBed.createComponent(HostComponent);
      host.detectChanges();

      const boundary = host.debugElement.children[0].componentInstance as CometChatErrorBoundaryComponent;
      boundary.handleError(new Error('boom'));
      host.detectChanges();

      const hostEl = host.nativeElement as HTMLElement;
      (hostEl.querySelector('.cometchat-error-boundary__retry') as HTMLButtonElement).click();
      host.detectChanges();

      expect(hostEl.querySelector('.projected')).not.toBeNull();
      expect(hostEl.querySelector('.cometchat-error-boundary__fallback')).toBeNull();
    });

    it('should prefer a supplied fallbackView over the default fallback', () => {
      const host = TestBed.createComponent(HostComponent);
      host.componentInstance.useCustom = true;
      host.detectChanges();

      const boundary = host.debugElement.children[0].componentInstance as CometChatErrorBoundaryComponent;
      boundary.handleError(new Error('kaboom'));
      host.detectChanges();

      const hostEl = host.nativeElement as HTMLElement;
      expect(hostEl.querySelector('.cometchat-error-boundary__fallback')).toBeNull();
      expect(hostEl.querySelector('.custom-fallback')).not.toBeNull();
    });

    it('should pass the error context into a custom fallbackView', () => {
      const host = TestBed.createComponent(HostComponent);
      host.componentInstance.useCustom = true;
      host.detectChanges();

      const boundary = host.debugElement.children[0].componentInstance as CometChatErrorBoundaryComponent;
      boundary.handleError(new Error('kaboom'));
      host.detectChanges();

      const text = (host.nativeElement as HTMLElement).querySelector('.custom-fallback')?.textContent;
      expect(text).toContain('MessageBubble');
      expect(text).toContain('kaboom');
    });
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  describe('Accessibility', () => {
    it('should give the retry button an aria-label', () => {
      fixture.detectChanges();
      component.handleError(new Error('boom'));
      fixture.detectChanges();

      const retry = el.querySelector('.cometchat-error-boundary__retry');
      expect(retry?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should expose the retry affordance as a real button', () => {
      fixture.detectChanges();
      component.handleError(new Error('boom'));
      fixture.detectChanges();

      expect(el.querySelector('.cometchat-error-boundary__retry')?.tagName).toBe('BUTTON');
    });
  });
});
