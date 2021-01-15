import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatMessageThreadComponent } from "./cometchat-message-thread.component";

describe("MessageThreadComponent", () => {
  let component: CometChatMessageThreadComponent;
  let fixture: ComponentFixture<CometChatMessageThreadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessageThreadComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
