import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSmartReplyPreviewComponent } from "./cometchat-smart-reply-preview.component";

describe("ReplyPreviewComponent", () => {
  let component: CometChatSmartReplyPreviewComponent;
  let fixture: ComponentFixture<CometChatSmartReplyPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSmartReplyPreviewComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatSmartReplyPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
