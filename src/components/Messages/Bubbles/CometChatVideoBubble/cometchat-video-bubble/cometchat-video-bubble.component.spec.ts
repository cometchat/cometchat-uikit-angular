import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatVideoBubbleComponent } from './cometchat-video-bubble.component';

describe('CometChatVideoMessageBubbleComponent', () => {
  let component: CometChatVideoBubbleComponent;
  let fixture: ComponentFixture<CometChatVideoBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatVideoBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatVideoBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
