import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatGroupDetailsComponent } from "./cometchat-group-details.component";

describe("CometchatGroupDetailComponent", () => {
  let component: CometChatGroupDetailsComponent;
  let fixture: ComponentFixture<CometChatGroupDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupDetailsComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
