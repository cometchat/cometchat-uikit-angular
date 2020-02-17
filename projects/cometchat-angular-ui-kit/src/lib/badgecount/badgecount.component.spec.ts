import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgecountComponent } from './badgecount.component';

describe('BadgecountComponent', () => {
  let component: BadgecountComponent;
  let fixture: ComponentFixture<BadgecountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BadgecountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BadgecountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
