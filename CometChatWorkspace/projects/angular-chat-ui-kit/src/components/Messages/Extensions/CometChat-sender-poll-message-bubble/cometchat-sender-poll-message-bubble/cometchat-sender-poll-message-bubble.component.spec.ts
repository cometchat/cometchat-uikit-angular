import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderPollMessageBubbleComponent } from "./cometchat-sender-poll-message-bubble.component";

describe("SenderPollBubbleComponent", () => {
  let component: CometChatSenderPollMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderPollMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderPollMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderPollMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
