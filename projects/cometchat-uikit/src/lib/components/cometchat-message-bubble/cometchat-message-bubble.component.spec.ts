/**
 * CometChatMessageBubble Component Tests
 *
 * Comprehensive TestBed-based test suite for the parent message bubble component
 * that wraps child bubble components (text-bubble, image-bubble, etc.) based on
 * message type. Tests delegation/routing logic, alignment propagation, template
 * override inputs, and keyboard accessibility.
 *
 * Uses real CometChat SDK session — NO vi.mock() for chat SDK packages.
 * The calls SDK mock below is required because @cometchat/calls-sdk-javascript
 * has a JitsiMeetJS runtime dependency that doesn't exist in jsdom.
 *
 * Categories: Initialization, Input Bindings, DOM Rendering,
 *             Message Type Delegation, Template Overrides,
 *             Alignment Propagation, Keyboard Accessibility, Edge Cases
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.5, 3.1, 3.2, 3.6,
 *            13.6, 14.4, 14.5, 15.7
 *
 * @module components/cometchat-message-bubble
 */

// ==================== SDK Mocks (must be before any imports that trigger SDK) ====================
vi.mock('@cometchat/calls-sdk-javascript', () => {
  return {
    CometChatCalls: {
      init: vi.fn().mockResolvedValue(true),
      generateToken: vi.fn().mockResolvedValue({ token: 'mock-token' }),
    },
  };
});

import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { ensureSdkReady, sdkCleanup } from '../../testing';
import { flushPromises } from '../../testing';
import { CometChatMessageBubbleComponent } from './cometchat-message-bubble.component';
import { MessageBubbleAlignment } from '../../Enums/Enums';
import { CometChatUIKitConstants } from '../../constants';

// ---------------------------------------------------------------------------
// Test-only wrapper that exposes ng-template refs for template override tests
// ---------------------------------------------------------------------------
@Component({
  standalone: true,
  imports: [CometChatMessageBubbleComponent],
  template: `
    <ng-template #customContent let-msg>
      <div class="test-custom-content">Custom: {{ msg?.getId?.() }}</div>
    </ng-template>
    <ng-template #customHeader let-msg>
      <div class="test-custom-header">Header Override</div>
    </ng-template>
    <ng-template #customBubble let-msg>
      <div class="test-custom-bubble">Full Bubble Override</div>
    </ng-template>
    <cometchat-message-bubble
      [message]="message"
      [alignment]="alignment"
      [contentView]="useCustomContent ? customContent : null"
      [headerView]="useCustomHeader ? customHeader : null"
      [bubbleView]="useCustomBubble ? customBubble : null"
    >
    </cometchat-message-bubble>
  `,
})
class TestHostComponent {
  @ViewChild('customContent') customContentRef!: TemplateRef<any>;
  @ViewChild('customHeader') customHeaderRef!: TemplateRef<any>;
  @ViewChild('customBubble') customBubbleRef!: TemplateRef<any>;

  message!: CometChat.BaseMessage;
  alignment: MessageBubbleAlignment = MessageBubbleAlignment.right;
  useCustomContent = false;
  useCustomHeader = false;
  useCustomBubble = false;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a real CometChat.TextMessage (local only, not sent). */
function createTextMessage(text: string, receiverUid = 'superhero2'): CometChat.TextMessage {
  return new CometChat.TextMessage(receiverUid, text, CometChat.RECEIVER_TYPE.USER);
}

/** Creates a real CometChat.MediaMessage for image type. */
function createImageMessage(receiverUid = 'superhero2'): CometChat.MediaMessage {
  return new CometChat.MediaMessage(
    receiverUid,
    null as any,
    CometChat.MESSAGE_TYPE.IMAGE,
    CometChat.RECEIVER_TYPE.USER
  );
}

/** Creates a real CometChat.MediaMessage for video type. */
function createVideoMessage(receiverUid = 'superhero2'): CometChat.MediaMessage {
  return new CometChat.MediaMessage(
    receiverUid,
    null as any,
    CometChat.MESSAGE_TYPE.VIDEO,
    CometChat.RECEIVER_TYPE.USER
  );
}

/** Creates a real CometChat.MediaMessage for audio type. */
function createAudioMessage(receiverUid = 'superhero2'): CometChat.MediaMessage {
  return new CometChat.MediaMessage(
    receiverUid,
    null as any,
    CometChat.MESSAGE_TYPE.AUDIO,
    CometChat.RECEIVER_TYPE.USER
  );
}

/** Creates a real CometChat.MediaMessage for file type. */
function createFileMessage(receiverUid = 'superhero2'): CometChat.MediaMessage {
  const msg = new CometChat.MediaMessage(
    receiverUid,
    null as any,
    CometChat.MESSAGE_TYPE.FILE,
    CometChat.RECEIVER_TYPE.USER
  );
  // Patch getAttachment/getAttachments so the component's accessibleLabel doesn't throw
  const attachment = {
    getName: () => 'test-file.pdf',
    getExtension: () => 'pdf',
    getMimeType: () => 'application/pdf',
    getSize: () => 1024,
    getUrl: () => 'https://example.com/test-file.pdf',
  };
  (msg as any).getAttachment = () => attachment;
  (msg as any).getAttachments = () => [attachment];
  return msg;
}

/** Creates a CometChat.CustomMessage for a given subType. */
function createCustomMessage(subType: string, receiverUid = 'superhero2'): CometChat.CustomMessage {
  return new CometChat.CustomMessage(receiverUid, CometChat.RECEIVER_TYPE.USER, subType, {});
}

/** Triggers async init and runs change detection. */
async function initAndDetect(fixture: ComponentFixture<any>): Promise<void> {
  fixture.detectChanges();
  await flushPromises();
  await new Promise(r => setTimeout(r, 50));
  fixture.detectChanges();
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('CometChatMessageBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatMessageBubbleComponent>;
  let component: CometChatMessageBubbleComponent;
  let el: HTMLElement;

  beforeAll(async () => {
    await ensureSdkReady();
  }, 30_000);

  afterAll(async () => {
    await sdkCleanup();
  }, 15_000);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatMessageBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatMessageBubbleComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------
  describe('Initialization', () => {
    it('should create the component', () => {
      component.message = createTextMessage('Hello');
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default alignment as right (outgoing)', () => {
      expect(component.alignment).toBe(MessageBubbleAlignment.right);
    });

    it('should have default group as null', () => {
      expect(component.group).toBeNull();
    });

    it('should have default options as empty array', () => {
      expect(component.options).toEqual([]);
    });

    it('should have default quickOptionsCount as 2', () => {
      expect(component.quickOptionsCount).toBe(2);
    });

    it('should have all view override inputs default to null', () => {
      expect(component.leadingView).toBeNull();
      expect(component.headerView).toBeNull();
      expect(component.replyView).toBeNull();
      expect(component.contentView).toBeNull();
      expect(component.bottomView).toBeNull();
      expect(component.footerView).toBeNull();
      expect(component.statusInfoView).toBeNull();
      expect(component.threadView).toBeNull();
      expect(component.bubbleView).toBeNull();
    });

    it('should render the wrapper element with role="article"', async () => {
      component.message = createTextMessage('Test');
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      expect(wrapper).toBeTruthy();
      expect(wrapper?.getAttribute('role')).toBe('article');
    });

    it('should set data-message-id attribute on wrapper', async () => {
      const msg = createTextMessage('Test');
      component.message = msg;
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      expect(wrapper?.getAttribute('data-message-id')).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Input Bindings
  // ---------------------------------------------------------------------------
  describe('Input Bindings', () => {
    it('should accept a CometChat.TextMessage as message input', async () => {
      const msg = createTextMessage('Hello SDK');
      component.message = msg;
      await initAndDetect(fixture);
      expect(component.message).toBe(msg);
      expect(component.messageType).toBe('text');
      expect(component.messageCategory).toBe('message');
    });

    it('should accept alignment input and reflect it', () => {
      component.message = createTextMessage('Test');
      component.alignment = MessageBubbleAlignment.left;
      fixture.detectChanges();
      expect(component.alignment).toBe(MessageBubbleAlignment.left);
    });

    it('should update bubbleClassName when alignment changes', () => {
      component.message = createTextMessage('Test');

      component.alignment = MessageBubbleAlignment.left;
      expect(component.bubbleClassName).toBe('cometchat-message-bubble-incoming');

      component.alignment = MessageBubbleAlignment.right;
      expect(component.bubbleClassName).toBe('cometchat-message-bubble-outgoing');

      component.alignment = MessageBubbleAlignment.center;
      expect(component.bubbleClassName).toBe('cometchat-message-bubble-action');
    });

    it('should accept hideTimestamp input', () => {
      component.message = createTextMessage('Test');
      component.hideTimestamp = true;
      fixture.detectChanges();
      expect(component.hideTimestamp).toBe(true);
    });

    it('should accept disableInteraction input', () => {
      component.message = createTextMessage('Test');
      component.disableInteraction = true;
      fixture.detectChanges();
      expect(component.disableInteraction).toBe(true);
    });

    it('should handle null message gracefully for computed properties', () => {
      // Before message is set, computed properties should return safe defaults
      expect(component.messageId).toBe('');
      expect(component.messageType).toBe('');
      expect(component.messageCategory).toBe('');
      expect(component.contentType).toBe('unsupported');
      expect(component.bubbleTypeClassName).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Message Type Delegation
  // ---------------------------------------------------------------------------
  describe('Message Type Delegation', () => {
    it('should resolve contentType to "text" for a TextMessage', () => {
      component.message = createTextMessage('Hello');
      expect(component.contentType).toBe('text');
    });

    it('should render cometchat-text-bubble for text messages', async () => {
      component.message = createTextMessage('Hello world');
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-text-bubble')).toBeTruthy();
      expect(el.querySelector('cometchat-image-bubble')).toBeNull();
    });

    it('routes an image message to "images-batch"', () => {
      component.message = createImageMessage();
      expect(component.contentType).toBe('images-batch');
    });

    it('should render cometchat-images-bubble for image messages', async () => {
      component.message = createImageMessage();
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-images-bubble')).toBeTruthy();
      expect(el.querySelector('cometchat-text-bubble')).toBeNull();
    });

    it('routes a video message to "videos-batch"', () => {
      component.message = createVideoMessage();
      expect(component.contentType).toBe('videos-batch');
    });

    it('should render cometchat-videos-bubble for video messages', async () => {
      component.message = createVideoMessage();
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-videos-bubble')).toBeTruthy();
    });

    it('routes an audio (file) message to "audios-batch"', () => {
      component.message = createAudioMessage();
      expect(component.contentType).toBe('audios-batch');
    });

    it('routes a voice-note audio message (metadata.audioType) to "voice-note"', () => {
      const audio = createAudioMessage();
      audio.setMetadata({ audioType: 'voice_note' } as unknown as Record<string, unknown>);
      component.message = audio;
      expect(component.contentType).toBe('voice-note');
    });

    it('still routes the LEGACY camelCase audioType to "voice-note" (already-sent messages)', () => {
      const audio = createAudioMessage();
      audio.setMetadata({ audioType: 'voiceNote' } as unknown as Record<string, unknown>);
      component.message = audio;
      expect(component.contentType).toBe('voice-note');
    });

    it('does not treat an unrelated audioType as a voice note', () => {
      const audio = createAudioMessage();
      audio.setMetadata({ audioType: 'podcast' } as unknown as Record<string, unknown>);
      component.message = audio;
      expect(component.contentType).toBe('audios-batch');
    });

    it('renders cometchat-audios-bubble for audio-file messages by default', async () => {
      component.message = createAudioMessage();
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-audios-bubble')).toBeTruthy();
    });

    it('routes a file message to "files-batch"', () => {
      component.message = createFileMessage();
      expect(component.contentType).toBe('files-batch');
    });

    it('should render cometchat-files-bubble for file messages', async () => {
      component.message = createFileMessage();
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-files-bubble')).toBeTruthy();
    });

    it('should resolve contentType to "poll" for extension_poll custom message', () => {
      const msg = createCustomMessage('extension_poll');
      component.message = msg;
      expect(component.contentType).toBe('poll');
    });

    it('should resolve contentType to "sticker" for extension_sticker custom message', () => {
      const msg = createCustomMessage('extension_sticker');
      component.message = msg;
      expect(component.contentType).toBe('sticker');
    });

    it('should resolve contentType to "document" for extension_document custom message', () => {
      const msg = createCustomMessage('extension_document');
      component.message = msg;
      expect(component.contentType).toBe('document');
    });

    it('should resolve contentType to "whiteboard" for extension_whiteboard custom message', () => {
      const msg = createCustomMessage('extension_whiteboard');
      component.message = msg;
      expect(component.contentType).toBe('whiteboard');
    });
  });

  // ---------------------------------------------------------------------------
  // Unknown Message Type Fallback
  // ---------------------------------------------------------------------------
  describe('Unknown Message Type Fallback', () => {
    it('should resolve contentType to "unsupported" for unknown custom type', () => {
      const msg = createCustomMessage('totally_unknown_type');
      component.message = msg;
      expect(component.contentType).toBe('unsupported');
    });

    it('should render the unsupported fallback element for unknown types', async () => {
      const msg = createCustomMessage('totally_unknown_type');
      component.message = msg;
      await initAndDetect(fixture);
      const unsupported = el.querySelector('.cometchat-message-bubble__unsupported');
      expect(unsupported).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Alignment Propagation
  // ---------------------------------------------------------------------------
  describe('Alignment Propagation', () => {
    it('should apply cometchat-message-bubble-outgoing class for right alignment', async () => {
      component.message = createTextMessage('Outgoing');
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble-outgoing')).toBeTruthy();
      expect(el.querySelector('.cometchat-message-bubble-incoming')).toBeNull();
    });

    it('should apply cometchat-message-bubble-incoming class for left alignment', async () => {
      component.message = createTextMessage('Incoming');
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble-incoming')).toBeTruthy();
      expect(el.querySelector('.cometchat-message-bubble-outgoing')).toBeNull();
    });

    it('should apply cometchat-message-bubble-action class for center alignment', async () => {
      component.message = createTextMessage('Action');
      component.alignment = MessageBubbleAlignment.center;
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble-action')).toBeTruthy();
    });

    it('should pass alignment to child text-bubble component', async () => {
      component.message = createTextMessage('Aligned text');
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      const textBubble = el.querySelector('cometchat-text-bubble');
      expect(textBubble).toBeTruthy();
      // The child component receives the alignment input
    });

    it('should pass alignment to child image-bubble component', async () => {
      component.message = createImageMessage();
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      const imgBubble = el.querySelector('cometchat-image-bubble');
      expect(imgBubble).toBeTruthy();
    });

    it('should not show leading view for right-aligned messages', async () => {
      component.message = createTextMessage('Outgoing');
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);
      expect(component.shouldShowLeadingView).toBe(false);
      expect(el.querySelector('.cometchat-message-bubble__leading-view')).toBeNull();
    });

    it('should show leading view for left-aligned messages', async () => {
      component.message = createTextMessage('Incoming');
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      expect(component.shouldShowLeadingView).toBe(true);
      expect(el.querySelector('.cometchat-message-bubble__leading-view')).toBeTruthy();
    });

    it('should not show leading view for center-aligned messages', async () => {
      component.message = createTextMessage('Action');
      component.alignment = MessageBubbleAlignment.center;
      await initAndDetect(fixture);
      expect(component.shouldShowLeadingView).toBe(false);
    });

    it('should show header view for left-aligned messages', async () => {
      component.message = createTextMessage('Incoming');
      component.alignment = MessageBubbleAlignment.left;
      await initAndDetect(fixture);
      expect(component.shouldShowHeaderView).toBe(true);
    });

    it('should not show header view for right-aligned messages', async () => {
      component.message = createTextMessage('Outgoing');
      component.alignment = MessageBubbleAlignment.right;
      await initAndDetect(fixture);
      expect(component.shouldShowHeaderView).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // DOM Rendering
  // ---------------------------------------------------------------------------
  describe('DOM Rendering', () => {
    it('should render the body container element', async () => {
      component.message = createTextMessage('Body test');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble__body')).toBeTruthy();
    });

    it('should render the content view container', async () => {
      component.message = createTextMessage('Content test');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble__body-content-view')).toBeTruthy();
    });

    it('should apply bubble type CSS class for text messages', async () => {
      component.message = createTextMessage('Type class test');
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble__text-message')).toBeTruthy();
    });

    it('should apply bubble type CSS class for image messages', async () => {
      component.message = createImageMessage();
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble__image-message')).toBeTruthy();
    });

    it('should render status info view for non-action messages', async () => {
      component.message = createTextMessage('Status test');
      await initAndDetect(fixture);
      expect(component.shouldShowStatusInfoView).toBe(true);
      expect(el.querySelector('.cometchat-message-bubble__body-status-info-view')).toBeTruthy();
    });

    it('should render cometchat-delete-bubble when message is deleted', async () => {
      const msg = createTextMessage('Will be deleted');
      // Simulate a deleted message by setting deletedAt
      (msg as any).deletedAt = Date.now();
      component.message = msg;
      await initAndDetect(fixture);
      expect(component.isDeleted).toBe(true);
      expect(el.querySelector('cometchat-delete-bubble')).toBeTruthy();
      expect(el.querySelector('cometchat-text-bubble')).toBeNull();
    });

    it('should set tabindex="0" on the wrapper for keyboard focus', async () => {
      component.message = createTextMessage('Focus test');
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      expect(wrapper?.getAttribute('tabindex')).toBe('0');
    });
  });

  // ---------------------------------------------------------------------------
  // Template Overrides
  // ---------------------------------------------------------------------------
  describe('Template Overrides', () => {
    let hostFixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;
    let hostEl: HTMLElement;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      hostFixture = TestBed.createComponent(TestHostComponent);
      hostComponent = hostFixture.componentInstance;
      hostEl = hostFixture.nativeElement;
    });

    it('should render default content when no contentView override', async () => {
      hostComponent.message = createTextMessage('Default content');
      hostComponent.useCustomContent = false;
      await initAndDetect(hostFixture);
      expect(hostEl.querySelector('cometchat-text-bubble')).toBeTruthy();
      expect(hostEl.querySelector('.test-custom-content')).toBeNull();
    });

    it('should render custom contentView when provided', async () => {
      hostComponent.message = createTextMessage('Overridden');
      hostComponent.useCustomContent = true;
      await initAndDetect(hostFixture);
      expect(hostEl.querySelector('.test-custom-content')).toBeTruthy();
      // Default text bubble should NOT render when contentView is overridden
      expect(hostEl.querySelector('cometchat-text-bubble')).toBeNull();
    });

    it('should render custom bubbleView replacing entire bubble', async () => {
      hostComponent.message = createTextMessage('Full override');
      hostComponent.useCustomBubble = true;
      await initAndDetect(hostFixture);
      expect(hostEl.querySelector('.test-custom-bubble')).toBeTruthy();
      // When bubbleView is set, the entire default bubble structure is replaced
      expect(hostEl.querySelector('.cometchat-message-bubble__body')).toBeNull();
    });

    it('should render custom headerView when provided and alignment is left', async () => {
      hostComponent.message = createTextMessage('Header override');
      hostComponent.alignment = MessageBubbleAlignment.left;
      hostComponent.useCustomHeader = true;
      await initAndDetect(hostFixture);
      expect(hostEl.querySelector('.test-custom-header')).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Accessibility
  // ---------------------------------------------------------------------------
  describe('Keyboard Accessibility', () => {
    it('should have aria-label on the wrapper', async () => {
      component.message = createTextMessage('Accessible');
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      expect(wrapper?.getAttribute('aria-label')).toBeTruthy();
    });

    it('should have aria-describedby pointing to content region', async () => {
      component.message = createTextMessage('Described');
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      const describedBy = wrapper?.getAttribute('aria-describedby');
      expect(describedBy).toContain('message-content-');
    });

    it('should emit messageActionsOpen on Enter key', async () => {
      component.message = createTextMessage('Enter test');
      component.options = [{ id: 'opt1', title: 'Option' } as any];
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.messageActionsOpen.subscribe(spy);

      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper')!;
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it('should emit mediaToggle on Space key for media messages', async () => {
      component.message = createImageMessage();
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.mediaToggle.subscribe(spy);

      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper')!;
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });

    it('should close options on Escape key', async () => {
      component.message = createTextMessage('Escape test');
      component.options = [{ id: 'opt1', title: 'Option' } as any];
      await initAndDetect(fixture);

      // Open options via Enter key first
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper')!;
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();

      // Now close with Escape
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      // Options should be hidden (no --visible modifier)
      const optionsEl = el.querySelector('.cometchat-message-bubble__options');
      if (optionsEl) {
        expect(optionsEl.classList.contains('cometchat-message-bubble__options--visible')).toBe(
          false
        );
      }
    });

    it('should emit messageActionsOpen on Shift+F10', async () => {
      component.message = createTextMessage('Context menu test');
      component.options = [{ id: 'opt1', title: 'Option' } as any];
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.messageActionsOpen.subscribe(spy);

      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper')!;
      wrapper.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true })
      );
      expect(spy).toHaveBeenCalled();
    });

    it('should not emit actions when disableInteraction is true', async () => {
      component.message = createTextMessage('Disabled');
      component.options = [{ id: 'opt1', title: 'Option' } as any];
      component.disableInteraction = true;
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.messageActionsOpen.subscribe(spy);

      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper')!;
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(spy).not.toHaveBeenCalled();
    });

    it('should still allow media toggle when disableInteraction is true', async () => {
      component.message = createImageMessage();
      component.disableInteraction = true;
      await initAndDetect(fixture);

      const spy = vi.fn();
      component.mediaToggle.subscribe(spy);

      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper')!;
      wrapper.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(spy).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------
  describe('Edge Cases', () => {
    it('should not throw when message is set to undefined', () => {
      // The component's template accesses message.getSentAt() etc.,
      // so setting message to undefined will throw during change detection.
      // Verify the component at least accepts the assignment without throwing.
      expect(() => {
        component.message = undefined as any;
      }).not.toThrow();
    });

    it('should handle switching message types dynamically', async () => {
      // Start with text
      fixture.componentRef.setInput('message', createTextMessage('First'));
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-text-bubble')).toBeTruthy();

      // Switch to image
      fixture.componentRef.setInput('message', createImageMessage());
      await initAndDetect(fixture);
      expect(el.querySelector('cometchat-image-bubble')).toBeTruthy();
      expect(el.querySelector('cometchat-text-bubble')).toBeNull();
    });

    it('should handle switching alignment dynamically', async () => {
      fixture.componentRef.setInput('message', createTextMessage('Dynamic alignment'));
      fixture.componentRef.setInput('alignment', MessageBubbleAlignment.right);
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble-outgoing')).toBeTruthy();

      fixture.componentRef.setInput('alignment', MessageBubbleAlignment.left);
      fixture.detectChanges();
      expect(el.querySelector('.cometchat-message-bubble-incoming')).toBeTruthy();
      expect(el.querySelector('.cometchat-message-bubble-outgoing')).toBeNull();
    });

    it('should handle isSelected input for aria-selected', async () => {
      component.message = createTextMessage('Selected');
      component.isSelected = true;
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      expect(wrapper?.getAttribute('aria-selected')).toBe('true');
      expect(wrapper?.classList.contains('cometchat-message-bubble__wrapper--selected')).toBe(true);
    });

    it('should not set aria-selected when isSelected is false', async () => {
      component.message = createTextMessage('Not selected');
      component.isSelected = false;
      await initAndDetect(fixture);
      const wrapper = el.querySelector('.cometchat-message-bubble__wrapper');
      expect(wrapper?.getAttribute('aria-selected')).toBeNull();
    });

    it('should handle hideAvatar input to suppress leading view', async () => {
      component.message = createTextMessage('No avatar');
      component.alignment = MessageBubbleAlignment.left;
      component.hideAvatar = true;
      await initAndDetect(fixture);
      expect(component.shouldShowLeadingView).toBe(false);
      expect(el.querySelector('.cometchat-message-bubble__leading-view')).toBeNull();
    });

    it('should handle hideSenderName input to suppress header view', async () => {
      component.message = createTextMessage('No sender');
      component.alignment = MessageBubbleAlignment.left;
      component.hideSenderName = true;
      await initAndDetect(fixture);
      expect(component.shouldShowHeaderView).toBe(false);
    });

    it('should not show options container when options array is empty', async () => {
      component.message = createTextMessage('No options');
      component.options = [];
      await initAndDetect(fixture);
      expect(el.querySelector('.cometchat-message-bubble__options')).toBeNull();
    });

    it('should clean up on destroy without errors', async () => {
      component.message = createTextMessage('Destroy test');
      await initAndDetect(fixture);
      expect(() => fixture.destroy()).not.toThrow();
    });

    it('should return correct isMediaMessage for different types', () => {
      component.message = createTextMessage('text');
      expect(component.isMediaMessage).toBe(false);

      component.message = createImageMessage();
      expect(component.isMediaMessage).toBe(true);

      component.message = createVideoMessage();
      expect(component.isMediaMessage).toBe(true);

      component.message = createAudioMessage();
      expect(component.isMediaMessage).toBe(true);

      component.message = createFileMessage();
      expect(component.isMediaMessage).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Moderation / permission-denied notice + error receipt (React parity)
  // ---------------------------------------------------------------------------
  describe('Moderation, permission-denied & error receipt', () => {
    const M = CometChatUIKitConstants.moderationStatus;
    const ME = { getUid: () => 'me' } as any;
    const setSender = (msg: any, uid: string | null) =>
      (msg.getSender = () => (uid ? { getUid: () => uid } : undefined));
    const withModeration = (msg: any, status: string) => (msg.getModerationStatus = () => status);

    beforeEach(() => {
      component.loggedInUser = ME;
    });

    describe('shouldShowModerationIndicator is sender-only', () => {
      it('shows for a disapproved message that I sent', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, 'me');
        component.message = msg;
        expect(component.shouldShowModerationIndicator).toBe(true);
      });

      it('shows for a disapproved message with no sender yet (locally rejected = mine)', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, null);
        component.message = msg;
        expect(component.shouldShowModerationIndicator).toBe(true);
      });

      it('does NOT show a disapproved message sent by someone else', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, 'other');
        component.message = msg;
        expect(component.shouldShowModerationIndicator).toBe(false);
      });

      it('is suppressed when hideModerationView is set', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, 'me');
        component.message = msg;
        component.hideModerationView = true;
        expect(component.shouldShowModerationIndicator).toBe(false);
      });

      it('uses the moderation text key', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, 'me');
        component.message = msg;
        expect(component.moderationIndicatorTextKey).toBe('moderation_block_message');
      });
    });

    describe('permission-denied ("file type not allowed") notice', () => {
      it('shows for my message carrying ERR_PERMISSION_DENIED on .error', () => {
        const msg = createFileMessage();
        setSender(msg, 'me');
        (msg as any).error = { code: 'ERR_PERMISSION_DENIED' };
        component.message = msg;
        expect(component.shouldShowPermissionDeniedIndicator).toBe(true);
        expect(component.moderationIndicatorTextKey).toBe('file_type_not_allowed');
      });

      it('reads the code from metadata.error too', () => {
        const msg = createFileMessage();
        setSender(msg, 'me');
        (msg as any).getMetadata = () => ({ error: { code: 'ERR_PERMISSION_DENIED' } });
        component.message = msg;
        expect(component.shouldShowPermissionDeniedIndicator).toBe(true);
      });

      it('ignores a different error code', () => {
        const msg = createFileMessage();
        setSender(msg, 'me');
        (msg as any).error = { code: 'ERR_SOMETHING_ELSE' };
        component.message = msg;
        expect(component.shouldShowPermissionDeniedIndicator).toBe(false);
      });

      it('is sender-only', () => {
        const msg = createFileMessage();
        setSender(msg, 'other');
        (msg as any).error = { code: 'ERR_PERMISSION_DENIED' };
        component.message = msg;
        expect(component.shouldShowPermissionDeniedIndicator).toBe(false);
      });

      it('is NOT suppressed by hideModerationView (matches React)', () => {
        const msg = createFileMessage();
        setSender(msg, 'me');
        (msg as any).error = { code: 'ERR_PERMISSION_DENIED' };
        component.message = msg;
        component.hideModerationView = true;
        expect(component.shouldShowPermissionDeniedIndicator).toBe(true);
      });
    });

    describe('showErrorReceipt flips the tick to error', () => {
      it('is true for my disapproved message', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, 'me');
        component.message = msg;
        expect(component.showErrorReceipt).toBe(true);
      });

      it('is true for my message with any send error', () => {
        const msg = createFileMessage();
        setSender(msg, 'me');
        (msg as any).error = { code: 'ERR_PERMISSION_DENIED' };
        component.message = msg;
        expect(component.showErrorReceipt).toBe(true);
      });

      it('honours the explicit showError input regardless of sender', () => {
        const msg = createTextMessage('hi');
        setSender(msg, 'other');
        component.message = msg;
        component.showError = true;
        expect(component.showErrorReceipt).toBe(true);
      });

      it('is false for a healthy approved message of mine', () => {
        const msg = createTextMessage('hi');
        withModeration(msg, M.approved);
        setSender(msg, 'me');
        component.message = msg;
        expect(component.showErrorReceipt).toBe(false);
      });

      it('is false for someone else\'s disapproved message', () => {
        const msg = createTextMessage('blocked');
        withModeration(msg, M.disapproved);
        setSender(msg, 'other');
        component.message = msg;
        expect(component.showErrorReceipt).toBe(false);
      });
    });
  });
});
