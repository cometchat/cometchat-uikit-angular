import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverImageMessageBubbleComponent } from "./cometchat-receiver-image-message-bubble.component";

describe("ReceiverImageBubbleComponent", () => {
  let component: CometChatReceiverImageMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverImageMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverImageMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverImageMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
