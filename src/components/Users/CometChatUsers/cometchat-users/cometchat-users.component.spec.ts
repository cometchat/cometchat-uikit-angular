import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatUsersComponent } from "./cometchat-users.component";

describe("CometChatUsersComponent", () => {
  let component: CometChatUsersComponent;
  let fixture: ComponentFixture<CometChatUsersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatUsersComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
