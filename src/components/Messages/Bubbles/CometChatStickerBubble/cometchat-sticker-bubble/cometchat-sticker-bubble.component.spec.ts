import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatStickerBubbleComponent } from './cometchat-sticker-bubble.component';

describe('CometChatStickerMessageBubbleComponent', () => {
  let component: CometChatStickerBubbleComponent;
  let fixture: ComponentFixture<CometChatStickerBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatStickerBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatStickerBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
