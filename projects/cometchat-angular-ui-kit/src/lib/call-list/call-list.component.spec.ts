import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallListComponent } from './call-list.component';

describe('CallListComponent', () => {
  let component: CallListComponent;
  let fixture: ComponentFixture<CallListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
