/**
 * CometChatConversationSummary Component Tests
 *
 * Categories: Initialization, State Transitions, Close Button,
 *             Keyboard Accessibility, DOM Rendering, Edge Cases
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatConversationSummaryComponent } from './cometchat-conversation-summary.component';
import { States } from '../../../Enums/Enums';

describe('CometChatConversationSummaryComponent', () => {
  let fixture: ComponentFixture<CometChatConversationSummaryComponent>;
  let component: CometChatConversationSummaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatConversationSummaryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatConversationSummaryComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ──

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should start in loading state', () => {
      expect(component.state()).toBe(States.loading);
    });

    it('should transition to empty state when no callback provided', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      expect(component.state()).toBe(States.empty);
    });
  });

  // ── State Transitions ──

  describe('State Transitions', () => {
    it('should transition to loaded state with summary text', async () => {
      component.getConversationSummary = () => Promise.resolve('Test summary content');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.state()).toBe(States.loaded);
      expect(component.summaryText()).toBe('Test summary content');
    });

    it('should transition to empty state for empty string response', async () => {
      component.getConversationSummary = () => Promise.resolve('');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.state()).toBe(States.empty);
    });

    it('should transition to empty state for whitespace-only response', async () => {
      component.getConversationSummary = () => Promise.resolve('   ');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.state()).toBe(States.empty);
    });

    it('should transition to error state when callback rejects', async () => {
      component.getConversationSummary = () => Promise.reject(new Error('API error'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.state()).toBe(States.error);
    });
  });

  // ── Close Button ──

  describe('Close Button', () => {
    it('should invoke closeCallback on click', async () => {
      const closeSpy = vi.fn();
      component.closeCallback = closeSpy;
      component.getConversationSummary = () => Promise.resolve('Summary');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector(
        '.cometchat-conversation-summary__header-close-button'
      ) as HTMLButtonElement;
      closeBtn?.click();

      expect(closeSpy).toHaveBeenCalledOnce();
    });
  });

  // ── Keyboard Accessibility ──

  describe('Keyboard Accessibility', () => {
    it('should invoke closeCallback on Enter keydown', () => {
      const closeSpy = vi.fn();
      component.closeCallback = closeSpy;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      vi.spyOn(event, 'preventDefault');
      component.onCloseKeydown(event);

      expect(closeSpy).toHaveBeenCalledOnce();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should invoke closeCallback on Space keydown', () => {
      const closeSpy = vi.fn();
      component.closeCallback = closeSpy;

      const event = new KeyboardEvent('keydown', { key: ' ' });
      vi.spyOn(event, 'preventDefault');
      component.onCloseKeydown(event);

      expect(closeSpy).toHaveBeenCalledOnce();
    });

    it('should not invoke closeCallback on other keys', () => {
      const closeSpy = vi.fn();
      component.closeCallback = closeSpy;

      component.onCloseKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  // ── DOM Rendering ──

  describe('DOM Rendering', () => {
    it('should render BEM root class', async () => {
      component.getConversationSummary = () => Promise.resolve('Summary');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const wrapper = fixture.nativeElement.querySelector('.cometchat-conversation-summary__wrapper');
      expect(wrapper).toBeTruthy();
    });

    it('should render shimmer during loading state', () => {
      // Provide a callback that never resolves to keep loading state
      component.getConversationSummary = () => new Promise(() => {});
      fixture.detectChanges();

      const shimmer = fixture.nativeElement.querySelector('.cometchat-conversation-summary__shimmer');
      expect(shimmer).toBeTruthy();
    });

    it('should render summary text in loaded state', async () => {
      component.getConversationSummary = () => Promise.resolve('AI generated summary');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const textEl = fixture.nativeElement.querySelector('.cometchat-conversation-summary__text');
      expect(textEl?.textContent?.trim()).toBe('AI generated summary');
    });

    it('should render error state with role=alert', async () => {
      component.getConversationSummary = () => Promise.reject(new Error('fail'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.cometchat-conversation-summary__error');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.getAttribute('role')).toBe('alert');
    });

    it('should have accessible close button with aria-label', async () => {
      component.getConversationSummary = () => Promise.resolve('Summary');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const closeBtn = fixture.nativeElement.querySelector(
        '.cometchat-conversation-summary__header-close-button'
      );
      expect(closeBtn?.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
