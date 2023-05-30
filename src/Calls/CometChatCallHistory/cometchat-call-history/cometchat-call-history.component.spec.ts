import {  ComponentFixture, TestBed } from "@angular/core/testing";
import { CometChatCallHistoryComponent } from "./cometchat-call-history.component";

describe("CometChatCallHistoryComponent", () => {
  let component: CometChatCallHistoryComponent;
  let fixture: ComponentFixture<CometChatCallHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatCallHistoryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatCallHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
