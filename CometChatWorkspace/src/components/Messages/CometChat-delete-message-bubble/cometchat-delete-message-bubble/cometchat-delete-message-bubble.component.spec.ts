import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatDeleteMessageBubbleComponent } from "./cometchat-delete-message-bubble.component";

describe("DeletedMessageBubbleComponent", () => {
  let component: CometChatDeleteMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatDeleteMessageBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatDeleteMessageBubbleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDeleteMessageBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
