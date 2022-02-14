import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatOutgoingDirectCallComponent } from "./cometchat-outgoing-direct-call.component";

describe("CallScreenComponent", () => {
  let component: CometChatOutgoingDirectCallComponent;
  let fixture: ComponentFixture<CometChatOutgoingDirectCallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatOutgoingDirectCallComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatOutgoingDirectCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
