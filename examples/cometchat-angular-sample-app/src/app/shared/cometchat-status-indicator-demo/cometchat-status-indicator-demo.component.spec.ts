import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatStatusIndicatorDemoComponent } from './cometchat-status-indicator-demo.component';

describe('CometChatStatusIndicatorDemoComponent', () => {
  let component: CometChatStatusIndicatorDemoComponent;
  let fixture: ComponentFixture<CometChatStatusIndicatorDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatStatusIndicatorDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatStatusIndicatorDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
