import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatIncomingCallComponent } from "./cometchat-incoming-call.component";

describe("CallAlertComponent", () => {
  let component: CometChatIncomingCallComponent;
  let fixture: ComponentFixture<CometChatIncomingCallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatIncomingCallComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatIncomingCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
