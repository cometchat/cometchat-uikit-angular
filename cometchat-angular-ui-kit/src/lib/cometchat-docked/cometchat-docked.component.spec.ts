import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatDockedComponent } from './cometchat-docked.component';

describe('CometchatDockedComponent', () => {
  let component: CometchatDockedComponent;
  let fixture: ComponentFixture<CometchatDockedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CometchatDockedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatDockedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
