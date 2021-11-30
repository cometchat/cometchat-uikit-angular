import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverVideoMessageBubbleComponent } from "./cometchat-receiver-video-message-bubble.component";

describe("ReceiverVideoBubbleComponent", () => {
  let component: CometChatReceiverVideoMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverVideoMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverVideoMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverVideoMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
