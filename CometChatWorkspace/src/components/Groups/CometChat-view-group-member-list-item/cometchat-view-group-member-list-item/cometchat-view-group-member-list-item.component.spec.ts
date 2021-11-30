import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatViewGroupMemberListItemComponent } from "./cometchat-view-group-member-list-item.component";

describe("MemberViewComponent", () => {
  let component: CometChatViewGroupMemberListItemComponent;
  let fixture: ComponentFixture<CometChatViewGroupMemberListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatViewGroupMemberListItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      CometChatViewGroupMemberListItemComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
