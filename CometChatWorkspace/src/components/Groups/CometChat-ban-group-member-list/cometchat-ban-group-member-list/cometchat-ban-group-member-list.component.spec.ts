import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatBanGroupMemberListComponent } from "./cometchat-ban-group-member-list.component";

describe("BanMemberViewComponent", () => {
  let component: CometChatBanGroupMemberListComponent;
  let fixture: ComponentFixture<CometChatBanGroupMemberListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatBanGroupMemberListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatBanGroupMemberListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
