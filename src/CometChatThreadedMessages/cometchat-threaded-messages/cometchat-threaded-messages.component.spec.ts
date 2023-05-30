import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatThreadedMessagesComponent } from "./cometchat-threaded-messages.component";

describe("CometChatThreadedMessagesComponent", () => {
  let component: CometChatThreadedMessagesComponent;
  let fixture: ComponentFixture<CometChatThreadedMessagesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatThreadedMessagesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatThreadedMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
