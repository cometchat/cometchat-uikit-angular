import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CometChatAIAssistantMessageBubble } from './cometchat-ai-assistant-message-bubble.component';
import { CometChatUIEvents, IDialog } from '../../events/CometChatUIEvents';

function makeMessage(text: string): CometChat.AIAssistantMessage {
  return {
    getAssistantMessageData: () => ({ getText: () => text }),
  } as unknown as CometChat.AIAssistantMessage;
}

function makeNullDataMessage(): CometChat.AIAssistantMessage {
  return {
    getAssistantMessageData: () => null,
  } as unknown as CometChat.AIAssistantMessage;
}

describe('CometChatAIAssistantMessageBubble', () => {
  let fixture: ComponentFixture<CometChatAIAssistantMessageBubble>;
  let component: CometChatAIAssistantMessageBubble;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatAIAssistantMessageBubble],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatAIAssistantMessageBubble);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    fixture.componentRef.setInput('message', makeMessage('Hello'));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('messageText computed signal', () => {
    it('should extract text from message data', () => {
      fixture.componentRef.setInput('message', makeMessage('Hello AI'));
      fixture.detectChanges();
      expect(component.messageText()).toBe('Hello AI');
    });

    it('should return empty string when getAssistantMessageData returns null', () => {
      fixture.componentRef.setInput('message', makeNullDataMessage());
      fixture.detectChanges();
      expect(component.messageText()).toBe('');
    });

    it('should update when message input changes', () => {
      fixture.componentRef.setInput('message', makeMessage('First'));
      fixture.detectChanges();
      expect(component.messageText()).toBe('First');

      fixture.componentRef.setInput('message', makeMessage('Second'));
      fixture.detectChanges();
      expect(component.messageText()).toBe('Second');
    });
  });

  describe('colorScheme signal', () => {
    it('should default to light', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();
      expect(component.colorScheme()).toBe('light');
    });

    it('should update to dark when media query fires dark change', () => {
      const listeners: Array<(e: MediaQueryListEvent) => void> = [];
      const mockMql = {
        matches: false,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
        removeEventListener: vi.fn(),
      };
      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMql as unknown as MediaQueryList);

      const f2 = TestBed.createComponent(CometChatAIAssistantMessageBubble);
      const c2 = f2.componentInstance;
      f2.componentRef.setInput('message', makeMessage(''));
      f2.detectChanges();

      expect(c2.colorScheme()).toBe('light');
      listeners.forEach(cb => cb({ matches: true } as MediaQueryListEvent));
      expect(c2.colorScheme()).toBe('dark');
      listeners.forEach(cb => cb({ matches: false } as MediaQueryListEvent));
      expect(c2.colorScheme()).toBe('light');

      f2.destroy();
    });

    it('should remove media query listener on destroy', () => {
      const removeListenerSpy = vi.fn();
      const mockMql = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: removeListenerSpy,
      };
      vi.spyOn(window, 'matchMedia').mockReturnValue(mockMql as unknown as MediaQueryList);

      const f2 = TestBed.createComponent(CometChatAIAssistantMessageBubble);
      f2.componentRef.setInput('message', makeMessage(''));
      f2.detectChanges();

      f2.destroy();
      expect(removeListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('imageClick forwarded to CometChatUIEvents.ccShowDialog', () => {
    it('should emit ccShowDialog when onImageClick is called', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();

      const emitted: IDialog[] = [];
      const sub = CometChatUIEvents.ccShowDialog.subscribe(d => emitted.push(d));

      component.onImageClick('https://example.com/img.png');

      expect(emitted).toHaveLength(1);
      expect(emitted[0].child).toBeDefined();
      expect(typeof emitted[0].confirmCallback).toBe('function');

      sub.unsubscribe();
    });

    it('should set activeImageUrl before emitting dialog', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();

      const sub = CometChatUIEvents.ccShowDialog.subscribe(() => {});
      component.onImageClick('https://example.com/photo.jpg');

      expect(component.activeImageUrl()).toBe('https://example.com/photo.jpg');
      sub.unsubscribe();
    });
  });

  describe('@defer placeholder', () => {
    it('should render the placeholder element before viewport trigger', () => {
      fixture.componentRef.setInput('message', makeMessage('Hello'));
      fixture.detectChanges();

      const placeholder = fixture.nativeElement.querySelector(
        '.cometchat-ai-assistant-message-bubble__placeholder'
      );
      expect(placeholder).toBeTruthy();
    });
  });
});
