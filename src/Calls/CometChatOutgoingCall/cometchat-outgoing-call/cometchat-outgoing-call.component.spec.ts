import {  ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatOutgoingCallComponent } from "./cometchat-outgoing-call.component";

describe("CometChatOutgoingCallComponent", () => {
  let component: CometChatOutgoingCallComponent;
  let fixture: ComponentFixture<CometChatOutgoingCallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatOutgoingCallComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatOutgoingCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
