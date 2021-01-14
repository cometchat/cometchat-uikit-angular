import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverPollMessageBubbleComponent } from "./cometchat-receiver-poll-message-bubble.component";

describe("ReceiverPollBubbleComponent", () => {
  let component: CometChatReceiverPollMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverPollMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverPollMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverPollMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
