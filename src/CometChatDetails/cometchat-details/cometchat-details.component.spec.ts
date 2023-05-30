import {  ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatDetailsComponent } from "./cometchat-details.component";

describe("CometChatDetailsComponent", () => {
  let component: CometChatDetailsComponent;
  let fixture: ComponentFixture<CometChatDetailsComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [CometChatDetailsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
