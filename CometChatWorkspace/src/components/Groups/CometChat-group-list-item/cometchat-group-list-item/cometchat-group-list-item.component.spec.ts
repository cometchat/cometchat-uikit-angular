import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatGroupListItemComponent } from "./cometchat-group-list-item.component";

describe("GroupViewComponent", () => {
  let component: CometChatGroupListItemComponent;
  let fixture: ComponentFixture<CometChatGroupListItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatGroupListItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
