import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatGroupWithMessagesComponent } from "./cometchat-group-with-messages.component";

describe("CometchatGroupListScreenComponent", () => {
  let component: CometChatGroupWithMessagesComponent;
  let fixture: ComponentFixture<CometChatGroupWithMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupWithMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupWithMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
