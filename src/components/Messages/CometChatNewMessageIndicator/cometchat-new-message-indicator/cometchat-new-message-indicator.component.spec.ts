import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatNewMessageIndicatorComponent } from "./cometchat-new-message-indicator.component";

describe("ReplyPreviewComponent", () => {
  let component: CometChatNewMessageIndicatorComponent;
  let fixture: ComponentFixture<CometChatNewMessageIndicatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatNewMessageIndicatorComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatNewMessageIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
