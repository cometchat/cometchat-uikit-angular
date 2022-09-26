import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatMessagePreviewComponent } from './cometchat-message-preview.component';

describe('CometchatMessagePreviewComponent', () => {
  let component: CometChatMessagePreviewComponent;
  let fixture: ComponentFixture<CometChatMessagePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatMessagePreviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessagePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
