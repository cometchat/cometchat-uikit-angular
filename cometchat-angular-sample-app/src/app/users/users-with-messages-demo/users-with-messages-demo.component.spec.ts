import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersWithMessagesDemoComponent } from './users-with-messages-demo.component';

describe('UsersWithMessagesDemoComponent', () => {
  let component: UsersWithMessagesDemoComponent;
  let fixture: ComponentFixture<UsersWithMessagesDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UsersWithMessagesDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersWithMessagesDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
