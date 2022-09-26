import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatWhiteboardBubbleComponent } from './cometchat-whiteboard-bubble.component';

describe('CometChatWhiteboardMessageBubbleComponent', () => {
  let component: CometChatWhiteboardBubbleComponent;
  let fixture: ComponentFixture<CometChatWhiteboardBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatWhiteboardBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatWhiteboardBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
