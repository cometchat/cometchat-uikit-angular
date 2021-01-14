import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatAvatarComponent } from "./cometchat-avatar.component";

describe("AvatarComponent", () => {
  let component: CometChatAvatarComponent;
  let fixture: ComponentFixture<CometChatAvatarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatAvatarComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
