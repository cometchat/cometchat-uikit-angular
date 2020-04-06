import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMembersComponentComponent } from './add-members-component.component';

describe('AddMembersComponentComponent', () => {
  let component: AddMembersComponentComponent;
  let fixture: ComponentFixture<AddMembersComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMembersComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMembersComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
