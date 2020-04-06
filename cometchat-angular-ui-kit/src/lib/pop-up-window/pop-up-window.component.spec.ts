import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopUpWindowComponent } from './pop-up-window.component';

describe('PopUpWindowComponent', () => {
  let component: PopUpWindowComponent;
  let fixture: ComponentFixture<PopUpWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopUpWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopUpWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
