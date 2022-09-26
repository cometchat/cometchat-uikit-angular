import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatDataItemComponent } from "./cometchat-data-item.component";

describe("CometChatDataItemComponent", () => {
  let component: CometChatDataItemComponent;
  let fixture: ComponentFixture<CometChatDataItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatDataItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDataItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
