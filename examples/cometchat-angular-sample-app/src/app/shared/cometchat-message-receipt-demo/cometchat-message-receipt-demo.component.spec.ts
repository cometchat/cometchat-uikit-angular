import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometChatMessageReceiptDemoComponent } from './cometchat-message-receipt-demo.component';

describe('CometChatMessageReceiptDemoComponent', () => {
  let component: CometChatMessageReceiptDemoComponent;
  let fixture: ComponentFixture<CometChatMessageReceiptDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CometChatMessageReceiptDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CometChatMessageReceiptDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
