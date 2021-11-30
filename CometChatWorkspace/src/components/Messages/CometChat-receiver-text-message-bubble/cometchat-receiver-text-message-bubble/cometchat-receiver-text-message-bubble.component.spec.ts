import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverTextMessageBubbleComponent } from "./cometchat-receiver-text-message-bubble.component";

describe("CometChatReceiverMessageBubbleComponent", () => {
  let component: CometChatReceiverTextMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverTextMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverTextMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverTextMessageBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
