import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CometchatEmbededComponent } from './cometchat-embeded.component';

describe('CometchatEmbededComponent', () => {
  let component: CometchatEmbededComponent;
  let fixture: ComponentFixture<CometchatEmbededComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CometchatEmbededComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CometchatEmbededComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
