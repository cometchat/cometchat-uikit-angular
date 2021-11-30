import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatGroupListComponent } from "./cometchat-group-list.component";

describe("CometChatGroupListComponent", () => {
  let component: CometChatGroupListComponent;
  let fixture: ComponentFixture<CometChatGroupListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
