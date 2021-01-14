import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { CometChatStickerKeyboardComponent } from "./cometchat-sticker-keyboard.component";

describe("StickerViewComponent", () => {
  let component: CometChatStickerKeyboardComponent;
  let fixture: ComponentFixture<CometChatStickerKeyboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CometChatStickerKeyboardComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatStickerKeyboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
