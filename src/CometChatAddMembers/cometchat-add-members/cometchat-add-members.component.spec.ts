import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatAddMembersComponent } from "./cometchat-add-members.component";

describe("CometChatAddMembersComponent", () => {
  let component: CometChatAddMembersComponent;
  let fixture: ComponentFixture<CometChatAddMembersComponent>;

  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [CometChatAddMembersComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatAddMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
