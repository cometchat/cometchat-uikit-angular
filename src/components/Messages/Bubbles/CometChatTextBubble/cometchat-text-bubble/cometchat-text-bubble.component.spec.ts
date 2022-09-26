import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatTextBubbleComponent } from './cometchat-text-bubble.component';

describe('CometChatTextMessageBubbleComponent', () => {
  let component: CometChatTextBubbleComponent;
  let fixture: ComponentFixture<CometChatTextBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatTextBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatTextBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
