import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomMessageBubbleComponent } from './custom-message-bubble.component';

describe('CustomMessageBubbleComponent', () => {
  let component: CustomMessageBubbleComponent;
  let fixture: ComponentFixture<CustomMessageBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomMessageBubbleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomMessageBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
