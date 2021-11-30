import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatConversationListItemComponent } from "./cometchat-conversation-list-item.component";

describe("ConversationViewComponent", () => {
  let component: CometChatConversationListItemComponent;
  let fixture: ComponentFixture<CometChatConversationListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatConversationListItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatConversationListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
