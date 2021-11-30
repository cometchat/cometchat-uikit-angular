import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatMessageComposerComponent } from "./cometchat-message-composer.component";

describe("CometChatMessageComposerComponent", () => {
  let component: CometChatMessageComposerComponent;
  let fixture: ComponentFixture<CometChatMessageComposerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatMessageComposerComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
