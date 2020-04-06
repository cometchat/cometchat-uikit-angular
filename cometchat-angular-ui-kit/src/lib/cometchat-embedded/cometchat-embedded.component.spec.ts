import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatEmbeddedComponent } from './cometchat-embedded.component';

describe('CometchatEmbeddedComponent', () => {
  let component: CometchatEmbeddedComponent;
  let fixture: ComponentFixture<CometchatEmbeddedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CometchatEmbeddedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatEmbeddedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
