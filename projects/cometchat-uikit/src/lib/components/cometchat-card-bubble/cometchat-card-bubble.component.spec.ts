import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CometChatCardBubbleComponent, CardBubbleAction } from './cometchat-card-bubble.component';
import { CometChatMessageEvents, ICardActionEvent } from '../../events/CometChatMessageEvents';

function makeCardMessage(
  opts: { card?: unknown; text?: string; fallbackText?: string } = {}
): CometChat.CardMessage {
  return {
    getCard: () => opts.card,
    getText: () => opts.text ?? '',
    getFallbackText: () => opts.fallbackText ?? '',
    getId: () => 42,
  } as unknown as CometChat.CardMessage;
}

describe('CometChatCardBubbleComponent', () => {
  let fixture: ComponentFixture<CometChatCardBubbleComponent>;
  let component: CometChatCardBubbleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CometChatCardBubbleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CometChatCardBubbleComponent);
    component = fixture.componentInstance;
  });

  function setMessage(msg: CometChat.CardMessage): void {
    fixture.componentRef.setInput('message', msg);
    fixture.detectChanges();
  }

  it('creates', () => {
    setMessage(makeCardMessage({ card: { version: '1.0', body: [] } }));
    expect(component).toBeTruthy();
  });

  describe('cardJson / hasCard', () => {
    it('serializes a non-empty card and reports hasCard', () => {
      const card = { version: '1.0', body: [{ type: 'text' }] };
      setMessage(makeCardMessage({ card }));
      expect((component as unknown as { hasCard(): boolean }).hasCard()).toBe(true);
      expect((component as unknown as { cardJson(): string }).cardJson()).toBe(JSON.stringify(card));
    });

    it('reports no card for an empty payload and exposes the fallback text', () => {
      setMessage(makeCardMessage({ card: {}, fallbackText: 'Sneaker X' }));
      expect((component as unknown as { hasCard(): boolean }).hasCard()).toBe(false);
      expect((component as unknown as { cardJson(): string }).cardJson()).toBe('');
      expect((component as unknown as { fallbackText(): string }).fallbackText()).toBe('Sneaker X');
    });

    it('falls back to getText() when there is no fallbackText', () => {
      setMessage(makeCardMessage({ card: null, text: 'Order shipped' }));
      expect((component as unknown as { hasCard(): boolean }).hasCard()).toBe(false);
      expect((component as unknown as { fallbackText(): string }).fallbackText()).toBe('Order shipped');
    });
  });

  describe('handleAction — pure forward on both channels', () => {
    it('emits on the (onCardAction) output and the ccCardActionClicked bus', () => {
      const msg = makeCardMessage({ card: { version: '1.0', body: [] } });
      setMessage(msg);

      const emitted: CardBubbleAction[] = [];
      component.onCardAction.subscribe((e) => emitted.push(e));
      const busEvents: ICardActionEvent[] = [];
      const sub = CometChatMessageEvents.ccCardActionClicked.subscribe((e) => busEvents.push(e));

      const action = { type: 'openUrl', url: 'https://example.com' };
      (component as unknown as { handleAction(e: unknown): void }).handleAction({
        action,
        elementId: 'el1',
        cardJson: '{}',
      });

      expect(emitted).toEqual([{ message: msg, action }]);
      expect(busEvents).toHaveLength(1);
      expect(busEvents[0]).toMatchObject({ message: msg, action, elementId: 'el1', cardJson: '{}' });

      sub.unsubscribe();
    });
  });
});
