import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderImageMessageBubbleComponent } from "./cometchat-sender-image-message-bubble.component";

describe("SenderImageBubbleComponent", () => {
  let component: CometChatSenderImageMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderImageMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderImageMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderImageMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
