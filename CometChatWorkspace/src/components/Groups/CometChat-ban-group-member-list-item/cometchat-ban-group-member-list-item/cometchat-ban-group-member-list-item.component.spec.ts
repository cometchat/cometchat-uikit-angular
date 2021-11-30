import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatBanGroupMemberListItemComponent } from "./cometchat-ban-group-member-list-item.component";

describe("CometChatBanMembersComponent", () => {
  let component: CometChatBanGroupMemberListItemComponent;
  let fixture: ComponentFixture<CometChatBanGroupMemberListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatBanGroupMemberListItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatBanGroupMemberListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
