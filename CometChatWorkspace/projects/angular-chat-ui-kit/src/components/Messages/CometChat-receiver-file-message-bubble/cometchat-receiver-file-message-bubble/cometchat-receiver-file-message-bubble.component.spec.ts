import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverFileMessageBubbleComponent } from "./cometchat-receiver-file-message-bubble.component";

describe("ReceiverFileBubbleComponent", () => {
  let component: CometChatReceiverFileMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverFileMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverFileMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverFileMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
