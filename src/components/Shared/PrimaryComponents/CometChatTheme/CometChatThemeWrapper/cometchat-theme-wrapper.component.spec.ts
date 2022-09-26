import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatWrapperComponent } from './cometchat-theme-wrapper.component';

describe('CometchatWrapperComponent', () => {
  let component: CometChatWrapperComponent;
  let fixture: ComponentFixture<CometChatWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatWrapperComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
