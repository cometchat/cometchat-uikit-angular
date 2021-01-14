import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatUserDetailsComponent } from "./cometchat-user-details.component";

describe("CometChatUserDetailComponent", () => {
  let component: CometChatUserDetailsComponent;
  let fixture: ComponentFixture<CometChatUserDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatUserDetailsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatUserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
