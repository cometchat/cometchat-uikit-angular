import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatPollBubbleComponent } from './cometchat-poll-bubble.component';

describe('CometChatPollMessageBubbleComponent', () => {
  let component: CometChatPollBubbleComponent;
  let fixture: ComponentFixture<CometChatPollBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatPollBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatPollBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
