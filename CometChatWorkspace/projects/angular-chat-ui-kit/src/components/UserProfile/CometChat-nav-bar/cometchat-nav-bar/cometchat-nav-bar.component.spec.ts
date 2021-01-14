import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatNavBarComponent } from "./cometchat-nav-bar.component";

describe("NavBarComponent", () => {
  let component: CometChatNavBarComponent;
  let fixture: ComponentFixture<CometChatNavBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatNavBarComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatNavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
