import {  ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatCallDetailsComponent } from "./cometchat-call-details.component";

describe("CometChatCallDetailsComponent", () => {
  let component: CometChatCallDetailsComponent;
  let fixture: ComponentFixture<CometChatCallDetailsComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [CometChatCallDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatCallDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
