import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatBadgeCountComponent } from "./cometchat-badge-count.component";

describe("BadgeCountComponent", () => {
  let component: CometChatBadgeCountComponent;
  let fixture: ComponentFixture<CometChatBadgeCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatBadgeCountComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatBadgeCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
