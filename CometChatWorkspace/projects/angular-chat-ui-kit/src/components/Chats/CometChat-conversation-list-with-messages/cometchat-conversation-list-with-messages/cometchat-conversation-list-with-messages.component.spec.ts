import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatConversationListWithMessagesComponent } from "./cometchat-conversation-list-with-messages.component";

describe("CometChatConversationListScreenComponent", () => {
  let component: CometChatConversationListWithMessagesComponent;
  let fixture: ComponentFixture<CometChatConversationListWithMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatConversationListWithMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatConversationListWithMessagesComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
