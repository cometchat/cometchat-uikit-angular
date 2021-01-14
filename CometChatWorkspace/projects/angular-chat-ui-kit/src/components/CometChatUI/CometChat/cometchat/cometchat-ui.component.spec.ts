import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatUIComponent } from "./cometchat-ui.component";

describe("CometChatUnifiedComponent", () => {
  let component: CometChatUIComponent;
  let fixture: ComponentFixture<CometChatUIComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatUIComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatUIComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
