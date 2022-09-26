import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatPlaceholderBubbleComponent } from './cometchat-placeholder-bubble.component';

describe('CometChatPlaceholderBubbleComponent', () => {
  let component: CometChatPlaceholderBubbleComponent;
  let fixture: ComponentFixture<CometChatPlaceholderBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatPlaceholderBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatPlaceholderBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
