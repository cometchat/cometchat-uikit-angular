import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatComponent } from './cometchat.component';

describe('CometchatComponent', () => {
  let component: CometchatComponent;
  let fixture: ComponentFixture<CometchatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CometchatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
