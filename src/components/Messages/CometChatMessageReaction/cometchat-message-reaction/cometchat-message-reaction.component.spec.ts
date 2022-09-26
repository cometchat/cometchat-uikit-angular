import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatMessageReactionComponent } from './cometchat-message-reaction.component';

describe('CometchatMessageReactionComponent', () => {
  let component: CometChatMessageReactionComponent;
  let fixture: ComponentFixture<CometChatMessageReactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatMessageReactionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageReactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
