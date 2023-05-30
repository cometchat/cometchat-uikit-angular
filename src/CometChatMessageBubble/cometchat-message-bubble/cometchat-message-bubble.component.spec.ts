import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatMessageBubbleComponent } from './cometchat-message-bubble.component';

describe('CometchatMessageBubbleComponent', () => {
  let component: CometChatMessageBubbleComponent;
  let fixture: ComponentFixture<CometChatMessageBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatMessageBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
