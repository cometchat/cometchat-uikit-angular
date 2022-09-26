import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatUsersWithMessagesComponent } from "./cometchat-users-with-messages.component";

describe("CometChatUsersWithMessagesComponent", () => {
  let component: CometChatUsersWithMessagesComponent;
  let fixture: ComponentFixture<CometChatUsersWithMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatUsersWithMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatUsersWithMessagesComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
