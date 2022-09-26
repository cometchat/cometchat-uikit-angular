import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatDeleteBubbleComponent } from './cometchat-delete-bubble.component';

describe('CometChatDeleteBubbleComponent', () => {
  let component: CometChatDeleteBubbleComponent;
  let fixture: ComponentFixture<CometChatDeleteBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatDeleteBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatDeleteBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
