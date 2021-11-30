import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatUserProfileComponent } from "./cometchat-user-profile.component";

describe("CometChatUserInfoScreenComponent", () => {
  let component: CometChatUserProfileComponent;
  let fixture: ComponentFixture<CometChatUserProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatUserProfileComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
