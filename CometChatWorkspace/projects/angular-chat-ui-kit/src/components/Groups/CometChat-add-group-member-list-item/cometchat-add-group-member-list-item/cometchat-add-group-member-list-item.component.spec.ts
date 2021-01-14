import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatAddGroupMemberListItemComponent } from "./cometchat-add-group-member-list-item.component";

describe("AddMemberViewComponent", () => {
  let component: CometChatAddGroupMemberListItemComponent;
  let fixture: ComponentFixture<CometChatAddGroupMemberListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatAddGroupMemberListItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatAddGroupMemberListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
