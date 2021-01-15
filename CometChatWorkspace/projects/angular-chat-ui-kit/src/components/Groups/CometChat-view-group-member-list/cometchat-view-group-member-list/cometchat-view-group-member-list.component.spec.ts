import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatViewGroupMemberListComponent } from "./cometchat-view-group-member-list.component";

describe("CometchatViewMembersComponent", () => {
  let component: CometChatViewGroupMemberListComponent;
  let fixture: ComponentFixture<CometChatViewGroupMemberListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatViewGroupMemberListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatViewGroupMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
