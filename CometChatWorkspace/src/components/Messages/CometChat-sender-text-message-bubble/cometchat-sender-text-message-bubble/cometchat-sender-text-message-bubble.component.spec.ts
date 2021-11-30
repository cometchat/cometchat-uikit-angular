import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderTextMessageBubbleComponent } from "./cometchat-sender-text-message-bubble.component";

describe("CometChatSenderMessageBubbleComponent", () => {
  let component: CometChatSenderTextMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderTextMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderTextMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderTextMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
