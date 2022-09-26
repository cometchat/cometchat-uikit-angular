import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatListBaseComponent } from "./cometchat-list-base.component";

describe("AvatarComponent", () => {
  let component: CometChatListBaseComponent;
  let fixture: ComponentFixture<CometChatListBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatListBaseComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatListBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
