import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverStickerMessageBubbleComponent } from "./cometchat-receiver-sticker-message-bubble.component";

describe("ReceiverStickerBubbleComponent", () => {
  let component: CometChatReceiverStickerMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverStickerMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverStickerMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverStickerMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
