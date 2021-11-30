import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatCreatePollComponent } from "./cometchat-create-poll.component";

describe("CreatePollViewComponent", () => {
  let component: CometChatCreatePollComponent;
  let fixture: ComponentFixture<CometChatCreatePollComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatCreatePollComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatCreatePollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
