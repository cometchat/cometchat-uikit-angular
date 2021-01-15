import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatActionMessageBubbleComponent } from "./cometchat-action-message-bubble.component";

describe("CallMessageComponent", () => {
  let component: CometChatActionMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatActionMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatActionMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatActionMessageBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
