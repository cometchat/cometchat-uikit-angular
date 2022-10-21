import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomMessageOptionsComponent } from './custom-message-options.component';

describe('CustomMessageOptionsComponent', () => {
  let component: CustomMessageOptionsComponent;
  let fixture: ComponentFixture<CustomMessageOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomMessageOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomMessageOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
