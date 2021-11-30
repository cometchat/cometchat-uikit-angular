import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderStickerMessageBubbleComponent } from "./cometchat-sender-sticker-message-bubble.component";

describe("SenderStickerBubbleComponent", () => {
  let component: CometChatSenderStickerMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderStickerMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderStickerMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderStickerMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
