import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatReceiverDirectCallBubbleComponent } from "./cometchat-receiver-directcall-bubble.component";

describe("CometChatReceiverMessageBubbleComponent", () => {
  let component: CometChatReceiverDirectCallBubbleComponent;
  let fixture: ComponentFixture<CometChatReceiverDirectCallBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatReceiverDirectCallBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatReceiverDirectCallBubbleComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
