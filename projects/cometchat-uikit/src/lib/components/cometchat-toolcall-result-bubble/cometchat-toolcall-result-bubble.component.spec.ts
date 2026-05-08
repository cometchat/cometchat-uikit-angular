import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToolCallResultBubble } from './cometchat-toolcall-result-bubble.component';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMessage(text: string): CometChat.AIToolResultMessage {
  return {
    getToolResultMessageData: () => ({
      getText: () => text,
    }),
  } as unknown as CometChat.AIToolResultMessage;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CometChatToolCallResultBubble', () => {
  let fixture: ComponentFixture<CometChatToolCallResultBubble>;
  let component: CometChatToolCallResultBubble;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatToolCallResultBubble],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatToolCallResultBubble);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('message', makeMessage('{}'));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── resultText computed signal ───────────────────────────────────────────────

  describe('resultText computed signal', () => {
    it('should extract text from message data', () => {
      fixture.componentRef.setInput('message', makeMessage('hello'));
      fixture.detectChanges();
      expect(component.resultText()).toBe('hello');
    });

    it('should return empty string when text is empty', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();
      expect(component.resultText()).toBe('');
    });

    it('should update when message input changes', () => {
      fixture.componentRef.setInput('message', makeMessage('first'));
      fixture.detectChanges();
      expect(component.resultText()).toBe('first');

      fixture.componentRef.setInput('message', makeMessage('second'));
      fixture.detectChanges();
      expect(component.resultText()).toBe('second');
    });
  });

  // ── formattedResult — valid JSON ─────────────────────────────────────────────

  describe('formattedResult — valid JSON pretty-printing', () => {
    it('should pretty-print valid JSON with 2-space indent', () => {
      const raw = '{"key":"value","num":42}';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      const expected = JSON.stringify(JSON.parse(raw), null, 2);
      expect(component.formattedResult()).toBe(expected);
    });

    it('should handle nested JSON objects', () => {
      const raw = '{"outer":{"inner":true},"arr":[1,2,3]}';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      expect(JSON.parse(component.formattedResult()!)).toEqual(JSON.parse(raw));
    });

    it('should handle JSON arrays', () => {
      const raw = '[1,"two",{"three":3}]';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      expect(JSON.parse(component.formattedResult()!)).toEqual([1, 'two', { three: 3 }]);
    });

    it('should handle JSON with special characters', () => {
      const raw = '{"message":"hello\\nworld","emoji":"🎉"}';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      expect(JSON.parse(component.formattedResult()!)).toEqual(JSON.parse(raw));
    });
  });

  // ── formattedResult — invalid JSON passthrough ───────────────────────────────

  describe('formattedResult — invalid JSON raw passthrough', () => {
    it('should return raw string for invalid JSON', () => {
      const raw = 'not valid json {';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      expect(component.formattedResult()).toBe(raw);
    });

    it('should return raw string for partial JSON', () => {
      const raw = '{"key": "val';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      expect(component.formattedResult()).toBe(raw);
    });

    it('should return raw string for plain text', () => {
      const raw = 'The operation completed successfully.';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      expect(component.formattedResult()).toBe(raw);
    });
  });

  // ── formattedResult — empty/null result ─────────────────────────────────────

  describe('formattedResult — empty result returns null', () => {
    it('should return null for empty string', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();

      expect(component.formattedResult()).toBeNull();
    });
  });

  // ── Template rendering ───────────────────────────────────────────────────────

  describe('template rendering', () => {
    it('should render the result content in a pre element', () => {
      const raw = '{"status":"ok"}';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      const preEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-result-bubble__content'
      );
      expect(preEl).toBeTruthy();
      expect(preEl.textContent.trim()).toBe(JSON.stringify(JSON.parse(raw), null, 2));
    });

    it('should render nothing for empty result', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-result-bubble'
      );
      expect(container).toBeNull();
    });

    it('should render the container when result is present', () => {
      fixture.componentRef.setInput('message', makeMessage('{"ok":true}'));
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-result-bubble'
      );
      expect(container).toBeTruthy();
    });

    it('should hide then show when message changes from empty to non-empty', () => {
      fixture.componentRef.setInput('message', makeMessage(''));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cometchat-toolcall-result-bubble')).toBeNull();

      fixture.componentRef.setInput('message', makeMessage('{"data":1}'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.cometchat-toolcall-result-bubble')).toBeTruthy();
    });

    it('should display raw text for invalid JSON', () => {
      const raw = 'plain text result';
      fixture.componentRef.setInput('message', makeMessage(raw));
      fixture.detectChanges();

      const preEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-result-bubble__content'
      );
      expect(preEl.textContent.trim()).toBe(raw);
    });
  });
});
