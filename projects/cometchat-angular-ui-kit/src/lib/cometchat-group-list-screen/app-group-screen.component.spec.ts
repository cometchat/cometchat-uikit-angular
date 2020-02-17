import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppGroupScreenComponent } from './app-group-screen.component';

describe('AppGroupScreenComponent', () => {
  let component: AppGroupScreenComponent;
  let fixture: ComponentFixture<AppGroupScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppGroupScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppGroupScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
