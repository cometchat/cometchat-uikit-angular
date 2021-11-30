import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderAudioMessageBubbleComponent } from "./cometchat-sender-audio-message-bubble.component";

describe("SenderAudioBubbleComponent", () => {
  let component: CometChatSenderAudioMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderAudioMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderAudioMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderAudioMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
