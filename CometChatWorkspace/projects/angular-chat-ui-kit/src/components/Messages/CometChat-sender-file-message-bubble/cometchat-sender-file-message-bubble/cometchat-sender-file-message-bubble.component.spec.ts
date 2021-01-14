import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderFileMessageBubbleComponent } from "./cometchat-sender-file-message-bubble.component";

describe("SenderFileBubbleComponent", () => {
  let component: CometChatSenderFileMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderFileMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderFileMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderFileMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
