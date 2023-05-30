import {  ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatConversationsComponent } from "./cometchat-conversations.component";

describe("CometChatConversationsComponent", () => {
  let component: CometChatConversationsComponent;
  let fixture: ComponentFixture<CometChatConversationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CometChatConversationsComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatConversationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
