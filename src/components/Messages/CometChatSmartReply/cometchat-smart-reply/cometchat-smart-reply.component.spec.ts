import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSmartReplyComponent } from "./cometchat-smart-reply.component";

describe("ReplyPreviewComponent", () => {
  let component: CometChatSmartReplyComponent;
  let fixture: ComponentFixture<CometChatSmartReplyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSmartReplyComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatSmartReplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
