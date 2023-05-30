import {  ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatCallButtonsComponent } from "./cometchat-call-buttons.component";

describe("CometChatCallButtonsComponent", () => {
  let component: CometChatCallButtonsComponent;
  let fixture: ComponentFixture<CometChatCallButtonsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatCallButtonsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatCallButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
