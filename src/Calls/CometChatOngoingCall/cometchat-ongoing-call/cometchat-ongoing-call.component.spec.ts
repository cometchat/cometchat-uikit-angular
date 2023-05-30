import {  ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatOngoingCallComponent } from "./cometchat-ongoing-call.component";

describe("CometChatOngoingCallComponent", () => {
  let component: CometChatOngoingCallComponent;
  let fixture: ComponentFixture<CometChatOngoingCallComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatOngoingCallComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatOngoingCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
