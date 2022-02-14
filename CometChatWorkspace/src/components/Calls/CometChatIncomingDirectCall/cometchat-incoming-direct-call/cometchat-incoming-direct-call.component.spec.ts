import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatIncomingDirectCallComponent } from "./cometchat-incoming-direct-call.component";

describe("CallAlertComponent", () => {
  let component: CometChatIncomingDirectCallComponent;
  let fixture: ComponentFixture<CometChatIncomingDirectCallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatIncomingDirectCallComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatIncomingDirectCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
