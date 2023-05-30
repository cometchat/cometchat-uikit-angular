import {  ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatBannedMembersComponent } from "./cometchat-banned-members.component";

describe("CometChatBannedMembersComponent", () => {
  let component: CometChatBannedMembersComponent;
  let fixture: ComponentFixture<CometChatBannedMembersComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [CometChatBannedMembersComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatBannedMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
