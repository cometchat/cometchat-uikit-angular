import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomMessageTypesComponent } from './custom-message-types.component';

describe('CustomMessageTypesComponent', () => {
  let component: CustomMessageTypesComponent;
  let fixture: ComponentFixture<CustomMessageTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomMessageTypesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomMessageTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
