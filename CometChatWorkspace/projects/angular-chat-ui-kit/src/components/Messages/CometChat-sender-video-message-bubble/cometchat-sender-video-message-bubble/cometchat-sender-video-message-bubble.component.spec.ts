import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderVideoMessageBubbleComponent } from "./cometchat-sender-video-message-bubble.component";

describe("SenderVideoBubbleComponent", () => {
  let component: CometChatSenderVideoMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderVideoMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderVideoMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderVideoMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
