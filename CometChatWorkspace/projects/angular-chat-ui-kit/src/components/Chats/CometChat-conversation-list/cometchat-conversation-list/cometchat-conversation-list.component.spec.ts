import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatConversationListComponent } from "./cometchat-conversation-list.component";

describe("CometChatConversationListComponent", () => {
  let component: CometChatConversationListComponent;
  let fixture: ComponentFixture<CometChatConversationListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatConversationListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatConversationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
