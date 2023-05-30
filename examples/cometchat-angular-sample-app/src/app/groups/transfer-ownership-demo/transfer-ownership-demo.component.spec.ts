import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferOwnershipDemoComponent } from './transfer-ownership-demo.component';

describe('TransferOwnershipDemoComponent', () => {
  let component: TransferOwnershipDemoComponent;
  let fixture: ComponentFixture<TransferOwnershipDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransferOwnershipDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferOwnershipDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
