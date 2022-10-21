import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredefinedMessageOptionsComponent } from './predefined-message-options.component';

describe('PredefinedMessageOptionsComponent', () => {
  let component: PredefinedMessageOptionsComponent;
  let fixture: ComponentFixture<PredefinedMessageOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PredefinedMessageOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PredefinedMessageOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
