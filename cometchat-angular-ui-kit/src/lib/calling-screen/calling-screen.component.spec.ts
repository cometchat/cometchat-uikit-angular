import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallingScreenComponent } from './calling-screen.component';

describe('CallingScreenComponent', () => {
  let component: CallingScreenComponent;
  let fixture: ComponentFixture<CallingScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallingScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallingScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
