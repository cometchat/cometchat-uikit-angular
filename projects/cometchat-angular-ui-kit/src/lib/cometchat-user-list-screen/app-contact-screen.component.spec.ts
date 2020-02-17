import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppContactScreenComponent } from './app-contact-screen.component';

describe('AppContactScreenComponent', () => {
  let component: AppContactScreenComponent;
  let fixture: ComponentFixture<AppContactScreenComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppContactScreenComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppContactScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
