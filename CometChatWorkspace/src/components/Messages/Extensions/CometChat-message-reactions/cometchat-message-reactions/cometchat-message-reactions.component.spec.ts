import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatMessageReactionsComponent } from "./cometchat-message-reactions.component";

describe("CometchatRegularReactionViewComponent", () => {
  let component: CometChatMessageReactionsComponent;
  let fixture: ComponentFixture<CometChatMessageReactionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessageReactionsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageReactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
