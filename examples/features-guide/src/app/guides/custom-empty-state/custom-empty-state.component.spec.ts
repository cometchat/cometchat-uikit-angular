import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomEmptyStateComponent } from './custom-empty-state.component';

describe('CustomEmptyStateComponent', () => {
  let component: CustomEmptyStateComponent;
  let fixture: ComponentFixture<CustomEmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomEmptyStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomEmptyStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
