import {  ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatGroupMembersComponent } from "./cometchat-group-members.component";

describe("CometChatGroupMembersComponent", () => {
  let component: CometChatGroupMembersComponent;
  let fixture: ComponentFixture<CometChatGroupMembersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupMembersComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
