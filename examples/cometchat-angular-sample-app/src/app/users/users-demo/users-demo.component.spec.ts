import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersDemoComponent } from './users-demo.component';

describe('UsersDemoComponent', () => {
  let component: UsersDemoComponent;
  let fixture: ComponentFixture<UsersDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
