import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListDemoComponent } from './user-list-demo.component';

describe('UserListDemoComponent', () => {
  let component: UserListDemoComponent;
  let fixture: ComponentFixture<UserListDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserListDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserListDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
