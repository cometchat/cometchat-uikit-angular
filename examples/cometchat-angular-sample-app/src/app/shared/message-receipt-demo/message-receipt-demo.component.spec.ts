import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptDemoComponent } from './message-receipt-demo.component';

describe('ReceiptDemoComponent', () => {
  let component: ReceiptDemoComponent;
  let fixture: ComponentFixture<ReceiptDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReceiptDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReceiptDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
