import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDataitemDemoComponent } from './user-dataitem-demo.component';

describe('UserDataitemDemoComponent', () => {
  let component: UserDataitemDemoComponent;
  let fixture: ComponentFixture<UserDataitemDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserDataitemDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDataitemDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
