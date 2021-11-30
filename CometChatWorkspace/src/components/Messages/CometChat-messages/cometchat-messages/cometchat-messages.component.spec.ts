import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatMessagesComponent } from "./cometchat-messages.component";

describe("CometchatMessageListScreenComponent", () => {
  let component: CometChatMessagesComponent;
  let fixture: ComponentFixture<CometChatMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
