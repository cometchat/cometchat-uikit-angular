import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatMessageListComponent } from "./cometchat-message-list.component";

describe("MessageListComponent", () => {
  let component: CometChatMessageListComponent;
  let fixture: ComponentFixture<CometChatMessageListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessageListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
