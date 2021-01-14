import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatThreadedMessageReplyCountComponent } from "./cometchat-threaded-message-reply-count.component";

describe("ReplyCountComponent", () => {
  let component: CometChatThreadedMessageReplyCountComponent;
  let fixture: ComponentFixture<CometChatThreadedMessageReplyCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatThreadedMessageReplyCountComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatThreadedMessageReplyCountComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
