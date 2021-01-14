import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatUserListWithMessagesComponent } from "./cometchat-user-list-with-messages.component";

describe("CometchatUserListScreenComponent", () => {
  let component: CometChatUserListWithMessagesComponent;
  let fixture: ComponentFixture<CometChatUserListWithMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatUserListWithMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatUserListWithMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
