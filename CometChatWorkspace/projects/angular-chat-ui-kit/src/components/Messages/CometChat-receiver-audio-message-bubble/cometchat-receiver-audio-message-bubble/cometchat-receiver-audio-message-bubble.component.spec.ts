import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverAudioMessageBubbleComponent } from "./cometchat-receiver-audio-message-bubble.component";

describe("ReceiverAudioBubbleComponent", () => {
  let component: CometChatReceiverAudioMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverAudioMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverAudioMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverAudioMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
