import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatFileBubbleComponent } from './cometchat-file-bubble.component';

describe('CometChatFileMessageBubbleComponent', () => {
  let component: CometChatFileBubbleComponent;
  let fixture: ComponentFixture<CometChatFileBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatFileBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatFileBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
