import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatAudioBubbleComponent } from './cometchat-audio-bubble.component';

describe('CometChatAudioMessageBubbleComponent', () => {
  let component: CometChatAudioBubbleComponent;
  let fixture: ComponentFixture<CometChatAudioBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatAudioBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatAudioBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
