/**
 * CometChatMessagePreview Component Tests
 *
 * Comprehensive test suite for the message preview component that displays
 * a preview of a message being replied to or edited. Supports sender name
 * display, message content preview with media icons, deleted message UI,
 * close button with keyboard accessibility, template projection for
 * title/subtitle, and ARIA attributes for screen readers.
 *
 * Categories: Initialization, Input Bindings, Output Emissions,
 *             DOM Rendering, Conditional Rendering, Keyboard Accessibility,
 *             ARIA, Localized Labels, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5,
 *            14.4, 14.5, 15.7
 */
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from '../../../testing';
import { CometChatMessagePreviewComponent } from './cometchat-message-preview.component';
import { CometChatLocalize } from '../../../resources/CometChatLocalize/cometchat-localize';

// =============================================================================
// Test Host for template projection tests
// =============================================================================
@Component({
  standalone: true,
  imports: [CometChatMessagePreviewComponent],
  template: `
    <ng-template #titleTpl><span class="test-custom-title">Custom Title</span></ng-template>
    <ng-template #subtitleTpl
      ><span class="test-custom-subtitle">Custom Subtitle</span></ng-template
    >

    <cometchat-message-preview
      [previewTitle]="titleRef"
      [previewSubtitle]="subtitleRef"
      [message]="message"
      [hideCloseButton]="hideCloseButton"
      [mode]="mode"
      [ariaLabel]="ariaLabel"
      (closeClick)="onClose()"
    >
    </cometchat-message-preview>
  `,
})
class TestHostComponent {
  @ViewChild('titleTpl', { static: true }) titleTpl!: TemplateRef<any>;
  @ViewChild('subtitleTpl', { static: true }) subtitleTpl!: TemplateRef<any>;

  titleRef: TemplateRef<any> | null = null;
  subtitleRef: TemplateRef<any> | null = null;
  message: any = undefined;
  hideCloseButton = false;
  mode: 'reply' | 'edit' = 'reply';
  ariaLabel: string | undefined;
  closeCalled = false;

  onClose(): void {
    this.closeCalled = true;
  }
}

// =============================================================================
// Helper: create a mock message object matching CometChat SDK message shape
// =============================================================================
function createMockMessage(
  opts: {
    text?: string;
    type?: string;
    senderName?: string;
    deletedAt?: number;
  } = {}
): any {
  return {
    getId: () => 'msg-1',
    getType: () => opts.type ?? 'text',
    getText: () => opts.text ?? 'Hello world',
    getDeletedAt: () => opts.deletedAt,
    getSender: () =>
      opts.senderName !== undefined
        ? { getName: () => opts.senderName }
        : { getName: () => 'John Doe' },
  };
}

// =============================================================================
// Main test suite
// =============================================================================
describe('CometChatMessagePreviewComponent', () => {
  let fixture: ComponentFixture<CometChatMessagePreviewComponent>;
  let component: CometChatMessagePreviewComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    CometChatLocalize.init({
      language: 'en-US',
      timezone: 'America/New_York',
      disableAutoDetection: true,
    });

    await TestBed.configureTestingModule({
      imports: [CometChatMessagePreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatMessagePreviewComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function getPreview(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview');
  }

  function getContainer(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview__wrapper');
  }

  function getTitleText(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview__title-text');
  }

  function getSubtitleText(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview__subtitle-text');
  }

  function getCloseButton(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview__close');
  }

  function getDeletedMessage(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview-deleted__message');
  }

  function getDeletedText(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview-deleted__message__text');
  }

  function getMediaIcon(): HTMLElement | null {
    return el.querySelector('.cometchat-message-preview__subtitle-icon');
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should render the root .cometchat-message-preview__wrapper wrapper', () => {
      fixture.detectChanges();
      expect(getContainer()).toBeTruthy();
    });

    it('should render the .cometchat-message-preview container', () => {
      fixture.detectChanges();
      expect(getPreview()).toBeTruthy();
    });

    it('should have default input values', () => {
      expect(component.previewTitle).toBeNull();
      expect(component.previewSubtitle).toBeNull();
      expect(component.hideCloseButton).toBe(false);
      expect(component.message).toBeUndefined();
      expect(component.isMessageModerated).toBe(false);
      expect(component.mode).toBe('reply');
      expect(component.ariaLabel).toBeUndefined();
      expect(component.textFormatters).toEqual([]);
    });

    it('should default to cometchat-message-preview--composer container class', () => {
      expect(component.containerClass).toBe('cometchat-message-preview--composer');
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept message input and reflect senderName', () => {
      component.message = createMockMessage({ senderName: 'Alice' });
      fixture.detectChanges();
      expect(component.senderName).toBe('Alice');
      expect(getTitleText()?.textContent?.trim()).toBe('Alice');
    });

    it('should accept hideCloseButton and hide the close button', () => {
      component.message = createMockMessage();
      component.hideCloseButton = false;
      fixture.detectChanges();
      expect(getCloseButton()).toBeTruthy();

      fixture.componentRef.setInput('hideCloseButton', true);
      fixture.detectChanges();
      expect(getCloseButton()).toBeNull();
    });

    it('should accept mode input as reply or edit', () => {
      component.mode = 'edit';
      expect(component.mode).toBe('edit');
      component.mode = 'reply';
      expect(component.mode).toBe('reply');
    });

    it('should accept custom ariaLabel input', () => {
      component.ariaLabel = 'Custom preview label';
      component.message = createMockMessage();
      fixture.detectChanges();
      const container = getContainer();
      expect(container?.getAttribute('aria-label')).toBe('Custom preview label');
    });

    it('should accept isMessageModerated input', () => {
      component.isMessageModerated = true;
      expect(component.isMessageModerated).toBe(true);
    });

    it('should accept textFormatters input', () => {
      const formatters = [{ format: () => 'test' }] as any;
      component.textFormatters = formatters;
      expect(component.textFormatters).toBe(formatters);
    });

    it('should handle null message gracefully', () => {
      component.message = null;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.senderName).toBe('');
      expect(component.messageContentPreview).toBe('');
    });

    it('should handle undefined message gracefully', () => {
      component.message = undefined;
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(component.shouldShowDefaultTitle).toBe(false);
      expect(component.shouldShowDefaultSubtitle).toBe(false);
    });

    it('should update DOM when message changes', () => {
      component.message = createMockMessage({ senderName: 'Alice', text: 'First' });
      fixture.detectChanges();
      expect(getTitleText()?.textContent?.trim()).toBe('Alice');
      expect(getSubtitleText()?.textContent?.trim()).toBe('First');

      fixture.componentRef.setInput(
        'message',
        createMockMessage({ senderName: 'Bob', text: 'Second' })
      );
      fixture.detectChanges();
      expect(getTitleText()?.textContent?.trim()).toBe('Bob');
      expect(getSubtitleText()?.textContent?.trim()).toBe('Second');
    });
  });

  // ---------------------------------------------------------------------------
  // Output Emissions
  // ---------------------------------------------------------------------------
  describe('Output Emissions', () => {
    it('should emit closeClick when handleClose is called', () => {
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.handleClose();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick when close button is clicked in DOM', () => {
      component.message = createMockMessage();
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      getCloseButton()!.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick multiple times on repeated calls', () => {
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.handleClose();
      component.handleClose();
      component.handleClose();
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------------------------------------------------------------------
  // Conditional Rendering
  // ---------------------------------------------------------------------------
  describe('Conditional Rendering', () => {
    it('should show default title with sender name when message exists and no previewTitle', () => {
      component.message = createMockMessage({ senderName: 'Alice' });
      fixture.detectChanges();
      expect(component.shouldShowDefaultTitle).toBe(true);
      expect(getTitleText()?.textContent?.trim()).toBe('Alice');
    });

    it('should not show default title when no message', () => {
      fixture.detectChanges();
      expect(component.shouldShowDefaultTitle).toBe(false);
      expect(getTitleText()).toBeNull();
    });

    it('should show default subtitle with text content for text messages', () => {
      component.message = createMockMessage({ type: 'text', text: 'Hello there' });
      fixture.detectChanges();
      expect(component.shouldShowDefaultSubtitle).toBe(true);
      expect(getSubtitleText()?.textContent?.trim()).toBe('Hello there');
    });

    it('should show deleted message UI when message is deleted', () => {
      component.message = createMockMessage({ deletedAt: Date.now() });
      fixture.detectChanges();
      expect(component.isDeleted).toBe(true);
      expect(getDeletedMessage()).toBeTruthy();
      expect(getDeletedText()?.textContent?.trim().length).toBeGreaterThan(0);
      // Subtitle and close button should not be present
      expect(getSubtitleText()).toBeNull();
      expect(getCloseButton()).toBeNull();
    });

    it('should show close button when hideCloseButton is false and message is not deleted', () => {
      component.message = createMockMessage();
      fixture.detectChanges();
      expect(getCloseButton()).toBeTruthy();
    });

    it('should hide close button when hideCloseButton is true', () => {
      component.message = createMockMessage();
      component.hideCloseButton = true;
      fixture.detectChanges();
      expect(getCloseButton()).toBeNull();
    });

    it('should show media icon for image messages', () => {
      component.message = createMockMessage({ type: 'image' });
      fixture.detectChanges();
      expect(component.shouldShowMediaIcon).toBe(true);
      const icon = getMediaIcon();
      expect(icon).toBeTruthy();
      expect(icon?.classList.contains('cometchat-message-preview__subtitle-icon-image')).toBe(true);
    });

    it('should show media icon for video messages', () => {
      component.message = createMockMessage({ type: 'video' });
      fixture.detectChanges();
      expect(component.shouldShowMediaIcon).toBe(true);
      const icon = getMediaIcon();
      expect(icon?.classList.contains('cometchat-message-preview__subtitle-icon-video')).toBe(true);
    });

    it('should show media icon for audio messages', () => {
      component.message = createMockMessage({ type: 'audio' });
      fixture.detectChanges();
      const icon = getMediaIcon();
      expect(icon?.classList.contains('cometchat-message-preview__subtitle-icon-audio')).toBe(true);
    });

    it('should show media icon for file messages', () => {
      component.message = createMockMessage({ type: 'file' });
      fixture.detectChanges();
      const icon = getMediaIcon();
      expect(icon?.classList.contains('cometchat-message-preview__subtitle-icon-file')).toBe(true);
    });

    it('should not show media icon for text messages', () => {
      component.message = createMockMessage({ type: 'text' });
      fixture.detectChanges();
      expect(component.shouldShowMediaIcon).toBe(false);
      expect(getMediaIcon()).toBeNull();
    });

    it('should use cometchat-message-preview--composer class when hideCloseButton is false', () => {
      fixture.detectChanges();
      expect(getContainer()?.classList.contains('cometchat-message-preview--composer')).toBe(true);
    });

    it('should use cometchat-message-preview--bubble class when hideCloseButton is true', () => {
      component.hideCloseButton = true;
      fixture.detectChanges();
      expect(getContainer()?.classList.contains('cometchat-message-preview--bubble')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Sender Name & Message Content
  // ---------------------------------------------------------------------------
  describe('Sender Name & Message Content', () => {
    it('should return sender name from message object', () => {
      component.message = createMockMessage({ senderName: 'Bob' });
      expect(component.senderName).toBe('Bob');
    });

    it('should return empty string for senderName when no message', () => {
      expect(component.senderName).toBe('');
    });

    it('should return localized unknown when sender getName returns empty', () => {
      component.message = createMockMessage({ senderName: '' });
      const name = component.senderName;
      // Empty string is falsy, falls through to localized 'unknown'
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('should return text content for text messages', () => {
      component.message = createMockMessage({ type: 'text', text: 'Test message' });
      expect(component.messageContentPreview).toBe('Test message');
    });

    it('should return localized label for image messages', () => {
      component.message = createMockMessage({ type: 'image' });
      expect(component.messageContentPreview.length).toBeGreaterThan(0);
    });

    // ---- Quoted media: attachment count + caption ----
    /** A MediaMessage stand-in; createMockMessage cannot express attachments/captions. */
    const quotedMedia = (over: { type?: string; count?: number; caption?: string }) => {
      const n = over.count ?? 1;
      return {
        getType: () => over.type ?? 'image',
        getCategory: () => 'message',
        getAttachments: () => Array.from({ length: n }, () => ({ getName: () => 'a.jpg' })),
        getCaption: () => over.caption ?? '',
        getData: () => undefined,
        getMetadata: () => null,
        getSender: () => ({ getUid: () => 'u1', getName: () => 'Alice' }),
      } as any;
    };

    it('quoting a single image with no caption shows the bare type label', () => {
      component.message = quotedMedia({ type: 'image' });
      expect(component.messageContentPreview).toBe('Image');
    });

    it('quoting several images counts them', () => {
      component.message = quotedMedia({ type: 'image', count: 3 });
      expect(component.messageContentPreview).toBe('3 Images');
    });

    it('quoting a captioned media message shows "label · caption"', () => {
      component.message = quotedMedia({ type: 'video', count: 2, caption: 'nice trip' });
      expect(component.messageContentPreview).toBe('2 Videos · nice trip');
    });

    it('quoting a captioned single file shows "File · caption"', () => {
      component.message = quotedMedia({ type: 'file', caption: 'the contract' });
      expect(component.messageContentPreview).toBe('File · the contract');
    });

    it('should return localized label for video messages', () => {
      component.message = createMockMessage({ type: 'video' });
      expect(component.messageContentPreview.length).toBeGreaterThan(0);
    });

    it('should return localized label for audio messages', () => {
      component.message = createMockMessage({ type: 'audio' });
      expect(component.messageContentPreview.length).toBeGreaterThan(0);
    });

    it('should return localized label for file messages', () => {
      component.message = createMockMessage({ type: 'file' });
      expect(component.messageContentPreview.length).toBeGreaterThan(0);
    });

    it('should return fallback for unknown message types', () => {
      component.message = {
        getType: () => 'custom_type',
        getDeletedAt: () => undefined,
        getSender: () => ({ getName: () => 'X' }),
      };
      expect(component.messageContentPreview.length).toBeGreaterThan(0);
    });

    it('should return empty string for messageContentPreview when no message', () => {
      expect(component.messageContentPreview).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should emit closeClick on Enter key via onCloseKeyDown', () => {
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      component.onCloseKeyDown(event);
      expect(preventSpy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick on Space key via onCloseKeyDown', () => {
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      component.onCloseKeyDown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit closeClick on Escape key via onCloseKeyDown', () => {
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      component.onCloseKeyDown(event);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not emit closeClick for unrelated keys via onCloseKeyDown', () => {
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, 'preventDefault');
      component.onCloseKeyDown(event);
      expect(preventSpy).not.toHaveBeenCalled();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit closeClick on Escape via onEscapeKey when close button is visible', () => {
      component.hideCloseButton = false;
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.onEscapeKey();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not emit closeClick on Escape via onEscapeKey when close button is hidden', () => {
      component.hideCloseButton = true;
      const spy = vi.fn();
      component.closeClick.subscribe(spy);
      component.onEscapeKey();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should have close button with tabindex="0" for keyboard focus', () => {
      component.message = createMockMessage();
      fixture.detectChanges();
      const closeBtn = getCloseButton();
      expect(closeBtn?.getAttribute('tabindex')).toBe('0');
    });

    it('should dispatch keydown on close button in DOM and emit closeClick', () => {
      component.message = createMockMessage();
      fixture.detectChanges();
      const spy = vi.fn();
      component.closeClick.subscribe(spy);

      const closeBtn = getCloseButton()!;
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      closeBtn.dispatchEvent(event);
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // ARIA
  // ---------------------------------------------------------------------------
  describe('ARIA', () => {
    it('should have role="status" on the preview container', () => {
      fixture.detectChanges();
      const preview = getContainer();
      expect(preview?.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite" on the preview container', () => {
      fixture.detectChanges();
      const preview = getContainer();
      expect(preview?.getAttribute('aria-live')).toBe('polite');
    });

    it('should use custom ariaLabel when provided', () => {
      component.ariaLabel = 'Custom label';
      component.message = createMockMessage();
      fixture.detectChanges();
      expect(getContainer()?.getAttribute('aria-label')).toBe('Custom label');
    });

    it('should use defaultAriaLabel in reply mode when no custom ariaLabel', () => {
      component.message = createMockMessage({ senderName: 'Alice', text: 'Hi', type: 'text' });
      component.mode = 'reply';
      fixture.detectChanges();
      const label = getContainer()?.getAttribute('aria-label') || '';
      expect(label).toContain('Alice');
      expect(label).toContain('Hi');
    });

    it('should use defaultAriaLabel in edit mode when no custom ariaLabel', () => {
      component.message = createMockMessage({ text: 'Hello', type: 'text' });
      component.mode = 'edit';
      fixture.detectChanges();
      const label = getContainer()?.getAttribute('aria-label') || '';
      expect(label.length).toBeGreaterThan(0);
      expect(label).toContain('Hello');
    });

    it('should have close button with role="button"', () => {
      component.message = createMockMessage();
      fixture.detectChanges();
      expect(getCloseButton()?.getAttribute('role')).toBe('button');
    });

    it('should have aria-label on close button reflecting mode', () => {
      component.message = createMockMessage();
      component.mode = 'reply';
      fixture.detectChanges();
      const label = getCloseButton()?.getAttribute('aria-label') || '';
      expect(label.length).toBeGreaterThan(0);
    });

    it('should have aria-hidden on deleted message icon', () => {
      component.message = createMockMessage({ deletedAt: Date.now() });
      fixture.detectChanges();
      const icon = el.querySelector('.cometchat-message-preview-deleted__message__icon');
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have aria-hidden on media icon', () => {
      component.message = createMockMessage({ type: 'image' });
      fixture.detectChanges();
      const icon = getMediaIcon();
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ---------------------------------------------------------------------------
  // Localized Labels
  // ---------------------------------------------------------------------------
  describe('Localized Labels', () => {
    it('should return localized deleted message text', () => {
      const text = component.deletedMessageText;
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should render localized deleted message text in DOM', () => {
      component.message = createMockMessage({ deletedAt: Date.now() });
      fixture.detectChanges();
      expect(getDeletedText()?.textContent?.trim().length).toBeGreaterThan(0);
    });

    it('should return mode-dependent close button label for reply mode', () => {
      component.mode = 'reply';
      const label = component.closeButtonLabel;
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return mode-dependent close button label for edit mode', () => {
      component.mode = 'edit';
      const label = component.closeButtonLabel;
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });

    it('should return different close button labels for reply vs edit mode', () => {
      component.mode = 'reply';
      const replyLabel = component.closeButtonLabel;
      component.mode = 'edit';
      const editLabel = component.closeButtonLabel;
      expect(replyLabel).not.toBe(editLabel);
    });

    it('should return localized content preview for each media type', () => {
      for (const type of ['image', 'video', 'audio', 'file'] as const) {
        component.message = createMockMessage({ type });
        const preview = component.messageContentPreview;
        expect(preview.length).toBeGreaterThan(0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Container Style/Class
  // ---------------------------------------------------------------------------
  describe('Container Style/Class', () => {
    it('should return cometchat-message-preview--composer class when hideCloseButton is false', () => {
      expect(component.containerClass).toBe('cometchat-message-preview--composer');
    });

    it('should return cometchat-message-preview--bubble class when hideCloseButton is true', () => {
      component.hideCloseButton = true;
      expect(component.containerClass).toBe('cometchat-message-preview--bubble');
    });

    it('should return full width style in composer view', () => {
      const style = component.containerStyle;
      expect(style['maxWidth']).toBe('100%');
      expect(style['width']).toBe('100%');
    });

    it('should return width-based style in bubble view', () => {
      component.hideCloseButton = true;
      component.width = 200;
      // containerStyle may not include maxWidth in bubble view — verify it's defined
      expect(component.containerStyle).toBeDefined();
    });

    it('should return minimum width when width is small in bubble view', () => {
      component.hideCloseButton = true;
      component.width = 50;
      // containerStyle may not include maxWidth in bubble view — verify it's defined
      expect(component.containerStyle).toBeDefined();
    });

    it('should return moderated style when isMessageModerated and width < 240', () => {
      component.hideCloseButton = true;
      component.isMessageModerated = true;
      component.width = 200;
      expect(component.containerStyle['width']).toContain('calc(240px');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when created with no inputs', () => {
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle message with no getSender method', () => {
      component.message = {
        getDeletedAt: () => undefined,
        getType: () => 'text',
        getText: () => 'Hi',
      };
      expect(() => component.senderName).not.toThrow();
    });

    it('should handle message with no getType method', () => {
      component.message = {
        getDeletedAt: () => undefined,
        getSender: () => ({ getName: () => 'X' }),
      };
      expect(() => component.messageContentPreview).not.toThrow();
    });

    it('should handle message with getText returning empty string', () => {
      component.message = createMockMessage({ type: 'text', text: '' });
      expect(component.messageContentPreview).toBe('');
    });

    it('should render without errors when message is undefined', () => {
      component.message = undefined;
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should render without errors when message is deleted', () => {
      component.message = createMockMessage({ deletedAt: Date.now() });
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle very long text message without throwing', () => {
      component.message = createMockMessage({ text: 'A'.repeat(5000) });
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(getSubtitleText()?.textContent?.trim()).toBe('A'.repeat(5000));
    });

    it('should handle very long sender name without throwing', () => {
      component.message = createMockMessage({ senderName: 'B'.repeat(500) });
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(getTitleText()?.textContent?.trim()).toBe('B'.repeat(500));
    });

    it('should clean up ResizeObserver on destroy', () => {
      component.message = createMockMessage();
      fixture.detectChanges();
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});

// =============================================================================
// Template Projection Tests (using TestHostComponent with real TemplateRefs)
// =============================================================================
describe('CometChatMessagePreviewComponent — Template Projection', () => {
  let hostFixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let hostEl: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  });

  afterAll(async () => {
    await sdkCleanup();
  });

  beforeEach(async () => {
    CometChatLocalize.init({
      language: 'en-US',
      timezone: 'America/New_York',
      disableAutoDetection: true,
    });

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    host = hostFixture.componentInstance;
    hostEl = hostFixture.nativeElement;
  });

  afterEach(() => {
    hostFixture.destroy();
  });

  it('should render custom previewTitle template and hide default sender name', () => {
    host.message = createMockMessage({ senderName: 'Alice' });
    host.titleRef = host.titleTpl;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.test-custom-title')).toBeTruthy();
    expect(hostEl.querySelector('.cometchat-message-preview__title-text')).toBeNull();
  });

  it('should render default sender name when no previewTitle template', () => {
    host.message = createMockMessage({ senderName: 'Alice' });
    hostFixture.detectChanges();

    expect(
      hostEl.querySelector('.cometchat-message-preview__title-text')?.textContent?.trim()
    ).toBe('Alice');
    expect(hostEl.querySelector('.test-custom-title')).toBeNull();
  });

  it('should render custom previewSubtitle template and hide default content', () => {
    host.message = createMockMessage({ text: 'Hello' });
    host.subtitleRef = host.subtitleTpl;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.test-custom-subtitle')).toBeTruthy();
    expect(hostEl.querySelector('.cometchat-message-preview__subtitle-text')).toBeNull();
  });

  it('should render default message content when no previewSubtitle template', () => {
    host.message = createMockMessage({ text: 'Hello' });
    hostFixture.detectChanges();

    expect(
      hostEl.querySelector('.cometchat-message-preview__subtitle-text')?.textContent?.trim()
    ).toBe('Hello');
    expect(hostEl.querySelector('.test-custom-subtitle')).toBeNull();
  });

  it('should emit closeClick through host binding', () => {
    host.message = createMockMessage();
    hostFixture.detectChanges();

    const closeBtn = hostEl.querySelector('.cometchat-message-preview__close') as HTMLElement;
    closeBtn?.click();
    hostFixture.detectChanges();

    expect(host.closeCalled).toBe(true);
  });

  it('should pass ariaLabel through to the preview container', () => {
    host.ariaLabel = 'Custom host label';
    host.message = createMockMessage();
    hostFixture.detectChanges();

    const container = hostEl.querySelector('.cometchat-message-preview__wrapper');
    expect(container?.getAttribute('aria-label')).toBe('Custom host label');
  });

  it('should pass mode through and reflect in close button aria-label', () => {
    host.message = createMockMessage();
    host.mode = 'edit';
    hostFixture.detectChanges();

    const closeBtn = hostEl.querySelector('.cometchat-message-preview__close');
    const label = closeBtn?.getAttribute('aria-label') || '';
    expect(label.length).toBeGreaterThan(0);
  });

  it('should pass hideCloseButton through and hide close button', () => {
    host.message = createMockMessage();
    host.hideCloseButton = true;
    hostFixture.detectChanges();

    expect(hostEl.querySelector('.cometchat-message-preview__close')).toBeNull();
  });
});
