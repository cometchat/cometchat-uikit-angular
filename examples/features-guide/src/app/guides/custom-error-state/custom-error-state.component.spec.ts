import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomErrorStateComponent } from './custom-error-state.component';

describe('CustomErrorStateComponent', () => {
  let component: CustomErrorStateComponent;
  let fixture: ComponentFixture<CustomErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomErrorStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomErrorStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
