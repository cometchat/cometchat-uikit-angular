import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatPopoverComponent } from './cometchat-popover.component';

describe('CometchatTooltipComponent', () => {
  let component: CometChatPopoverComponent;
  let fixture: ComponentFixture<CometChatPopoverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatPopoverComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
