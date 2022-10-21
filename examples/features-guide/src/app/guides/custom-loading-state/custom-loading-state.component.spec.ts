import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomLoadingStateComponent } from './custom-loading-state.component';

describe('CustomLoadingStateComponent', () => {
  let component: CustomLoadingStateComponent;
  let fixture: ComponentFixture<CustomLoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomLoadingStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomLoadingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
