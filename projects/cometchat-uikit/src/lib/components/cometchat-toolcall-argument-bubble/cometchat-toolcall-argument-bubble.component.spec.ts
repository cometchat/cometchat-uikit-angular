import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatToolCallArgumentBubble } from './cometchat-toolcall-argument-bubble.component';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface ToolCallStub {
  id?: string;
  function: {
    name: string;
    displayName?: string;
    executionText?: string;
    arguments: string;
  };
  getId?: () => string;
}

function makeMessage(toolCalls: ToolCallStub[]): CometChat.AIToolArgumentMessage {
  // Add getId() and top-level properties to each tool call
  const enrichedCalls = toolCalls.map((tc, i) => ({
    ...tc,
    getId: tc.getId ?? (() => tc.id ?? `tc-${i}`),
    displayName: tc.function.displayName,
    executionText: tc.function.executionText,
  }));
  return {
    getToolArgumentMessageData: () => ({
      getToolCalls: () => enrichedCalls,
    }),
  } as unknown as CometChat.AIToolArgumentMessage;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CometChatToolCallArgumentBubble', () => {
  let fixture: ComponentFixture<CometChatToolCallArgumentBubble>;
  let component: CometChatToolCallArgumentBubble;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatToolCallArgumentBubble],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatToolCallArgumentBubble);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('message', makeMessage([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ── toolCalls computed signal ────────────────────────────────────────────────

  describe('toolCalls computed signal', () => {
    it('should return the tool calls array from message data', () => {
      const calls: ToolCallStub[] = [
        { function: { name: 'search', arguments: '{}' } },
        { function: { name: 'fetch', arguments: '{"url":"https://example.com"}' } },
      ];
      fixture.componentRef.setInput('message', makeMessage(calls));
      fixture.detectChanges();

      expect(component.toolCalls()).toHaveLength(2);
      expect(component.toolCalls()[0].function.name).toBe('search');
      expect(component.toolCalls()[1].function.name).toBe('fetch');
    });

    it('should return empty array when no tool calls', () => {
      fixture.componentRef.setInput('message', makeMessage([]));
      fixture.detectChanges();
      expect(component.toolCalls()).toHaveLength(0);
    });

    it('should update when message input changes', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'a', arguments: '{}' } },
      ]));
      fixture.detectChanges();
      expect(component.toolCalls()).toHaveLength(1);

      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'a', arguments: '{}' } },
        { function: { name: 'b', arguments: '{}' } },
      ]));
      fixture.detectChanges();
      expect(component.toolCalls()).toHaveLength(2);
    });
  });

  // ── formattedArgs — valid JSON ───────────────────────────────────────────────

  describe('formattedArgs — valid JSON pretty-printing', () => {
    it('should pretty-print valid JSON with 2-space indent', () => {
      const raw = '{"key":"value","num":42}';
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: raw } },
      ]));
      fixture.detectChanges();

      const expected = JSON.stringify(JSON.parse(raw), null, 2);
      expect(component.formattedArgs()[0]).toBe(expected);
    });

    it('should handle nested JSON objects', () => {
      const raw = '{"outer":{"inner":true},"arr":[1,2,3]}';
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: raw } },
      ]));
      fixture.detectChanges();

      expect(JSON.parse(component.formattedArgs()[0])).toEqual(JSON.parse(raw));
    });

    it('should handle JSON arrays', () => {
      const raw = '[1,"two",{"three":3}]';
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: raw } },
      ]));
      fixture.detectChanges();

      expect(JSON.parse(component.formattedArgs()[0])).toEqual([1, 'two', { three: 3 }]);
    });

    it('should format each tool call independently', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'a', arguments: '{"x":1}' } },
        { function: { name: 'b', arguments: '{"y":2}' } },
      ]));
      fixture.detectChanges();

      expect(JSON.parse(component.formattedArgs()[0])).toEqual({ x: 1 });
      expect(JSON.parse(component.formattedArgs()[1])).toEqual({ y: 2 });
    });
  });

  // ── formattedArgs — invalid JSON passthrough ─────────────────────────────────

  describe('formattedArgs — invalid JSON raw passthrough', () => {
    it('should return raw string for invalid JSON', () => {
      const raw = 'not valid json {';
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: raw } },
      ]));
      fixture.detectChanges();

      expect(component.formattedArgs()[0]).toBe(raw);
    });

    it('should return raw string for empty string', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: '' } },
      ]));
      fixture.detectChanges();

      expect(component.formattedArgs()[0]).toBe('');
    });

    it('should return raw string for partial JSON', () => {
      const raw = '{"key": "val';
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: raw } },
      ]));
      fixture.detectChanges();

      expect(component.formattedArgs()[0]).toBe(raw);
    });
  });

  // ── Template rendering ───────────────────────────────────────────────────────

  describe('template rendering', () => {
    it('should render display name when present', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'search', displayName: 'Web Search', arguments: '{}' } },
      ]));
      fixture.detectChanges();

      const nameEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-argument-bubble__name'
      );
      expect(nameEl).toBeTruthy();
      expect(nameEl.textContent.trim()).toBe('Web Search');
    });

    it('should not render name element when displayName is absent', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'search', arguments: '{}' } },
      ]));
      fixture.detectChanges();

      const nameEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-argument-bubble__name'
      );
      expect(nameEl).toBeNull();
    });

    it('should render execution text when present', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', executionText: 'Searching the web...', arguments: '{}' } },
      ]));
      fixture.detectChanges();

      const execEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-argument-bubble__execution-text'
      );
      expect(execEl).toBeTruthy();
      expect(execEl.textContent.trim()).toBe('Searching the web...');
    });

    it('should not render execution text element when absent', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: '{}' } },
      ]));
      fixture.detectChanges();

      const execEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-argument-bubble__execution-text'
      );
      expect(execEl).toBeNull();
    });

    it('should render formatted arguments in a pre element', () => {
      const raw = '{"key":"value"}';
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'fn', arguments: raw } },
      ]));
      fixture.detectChanges();

      const preEl = fixture.nativeElement.querySelector(
        '.cometchat-toolcall-argument-bubble__arguments'
      );
      expect(preEl).toBeTruthy();
      expect(preEl.textContent.trim()).toBe(JSON.stringify(JSON.parse(raw), null, 2));
    });

    it('should render one item per tool call', () => {
      fixture.componentRef.setInput('message', makeMessage([
        { function: { name: 'a', arguments: '{}' } },
        { function: { name: 'b', arguments: '{}' } },
        { function: { name: 'c', arguments: '{}' } },
      ]));
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(
        '.cometchat-toolcall-argument-bubble__item'
      );
      expect(items).toHaveLength(3);
    });

    it('should render nothing when tool calls array is empty', () => {
      fixture.componentRef.setInput('message', makeMessage([]));
      fixture.detectChanges();

      const items = fixture.nativeElement.querySelectorAll(
        '.cometchat-toolcall-argument-bubble__item'
      );
      expect(items).toHaveLength(0);
    });
  });
});
