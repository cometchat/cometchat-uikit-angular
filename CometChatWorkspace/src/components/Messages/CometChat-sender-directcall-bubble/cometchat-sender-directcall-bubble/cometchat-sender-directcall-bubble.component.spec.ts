import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSenderDirectCallBubbleComponent } from "./cometchat-sender-directcall-bubble.component";

describe("CometChatReceiverMessageBubbleComponent", () => {
  let component: CometChatSenderDirectCallBubbleComponent;
  let fixture: ComponentFixture<CometChatSenderDirectCallBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSenderDirectCallBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatSenderDirectCallBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
