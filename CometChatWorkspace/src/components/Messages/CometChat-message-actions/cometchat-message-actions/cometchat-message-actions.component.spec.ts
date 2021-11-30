import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatMessageActionsComponent } from "./cometchat-message-actions.component";

describe("ToolTipComponent", () => {
  let component: CometChatMessageActionsComponent;
  let fixture: ComponentFixture<CometChatMessageActionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessageActionsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
