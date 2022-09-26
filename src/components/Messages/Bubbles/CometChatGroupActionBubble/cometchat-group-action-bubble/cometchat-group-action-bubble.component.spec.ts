import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatGroupActionBubbleComponent } from './cometchat-group-action-bubble.component';

describe('CometchatGroupActionBubbleComponent', () => {
  let component: CometChatGroupActionBubbleComponent;
  let fixture: ComponentFixture<CometChatGroupActionBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatGroupActionBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatGroupActionBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
