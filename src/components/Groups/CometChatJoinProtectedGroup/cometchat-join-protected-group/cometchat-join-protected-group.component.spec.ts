import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatJoinProtectedGroupComponent } from "./cometchat-join-protected-group.component";

describe("CometChatJoinProtectedGroupComponent", () => {
  let component: CometChatJoinProtectedGroupComponent;
  let fixture: ComponentFixture<CometChatJoinProtectedGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatJoinProtectedGroupComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatJoinProtectedGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
