import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatBackdropComponent } from "./cometchat-backdrop.component";

describe("BackdropComponent", () => {
  let component: CometChatBackdropComponent;
  let fixture: ComponentFixture<CometChatBackdropComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatBackdropComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatBackdropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
