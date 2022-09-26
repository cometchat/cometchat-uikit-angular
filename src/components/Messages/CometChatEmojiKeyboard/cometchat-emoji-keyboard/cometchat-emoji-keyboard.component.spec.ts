import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatEmojiKeyboardComponent } from './cometchat-emoji-keyboard.component';

describe('CometchatEmojiKeyboardComponent', () => {
  let component: CometChatEmojiKeyboardComponent;
  let fixture: ComponentFixture<CometChatEmojiKeyboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatEmojiKeyboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatEmojiKeyboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
