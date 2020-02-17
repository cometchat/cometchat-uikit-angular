import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DemoUserViewComponent } from './demo-user-view.component';

describe('DemoUserViewComponent', () => {
  let component: DemoUserViewComponent;
  let fixture: ComponentFixture<DemoUserViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DemoUserViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoUserViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
