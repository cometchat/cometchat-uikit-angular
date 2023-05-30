import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMembersDemoComponent } from './add-members-democomponent';

describe('AddMembersDemoComponent', () => {
  let component: AddMembersDemoComponent;
  let fixture: ComponentFixture<AddMembersDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddMembersDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMembersDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
