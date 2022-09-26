import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatImageBubbleComponent } from './cometchat-image-bubble.component';

describe('CometChatImageMessageBubbleComponent', () => {
  let component: CometChatImageBubbleComponent;
  let fixture: ComponentFixture<CometChatImageBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatImageBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatImageBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
