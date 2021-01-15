import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatGroupListWithMessagesComponent } from "./cometchat-group-list-with-messages.component";

describe("CometchatGroupListScreenComponent", () => {
  let component: CometChatGroupListWithMessagesComponent;
  let fixture: ComponentFixture<CometChatGroupListWithMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupListWithMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupListWithMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
