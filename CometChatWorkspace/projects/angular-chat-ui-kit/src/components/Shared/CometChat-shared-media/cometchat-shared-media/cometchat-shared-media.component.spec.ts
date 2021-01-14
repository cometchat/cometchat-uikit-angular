import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatSharedMediaComponent } from "./cometchat-shared-media.component";

describe("SharedMediaViewComponent", () => {
  let component: CometChatSharedMediaComponent;
  let fixture: ComponentFixture<CometChatSharedMediaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatSharedMediaComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatSharedMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
