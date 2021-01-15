import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatAddGroupMemberListComponent } from "./cometchat-add-group-member-list.component";

describe("CometchatAddMembersComponent", () => {
  let component: CometChatAddGroupMemberListComponent;
  let fixture: ComponentFixture<CometChatAddGroupMemberListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatAddGroupMemberListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatAddGroupMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
