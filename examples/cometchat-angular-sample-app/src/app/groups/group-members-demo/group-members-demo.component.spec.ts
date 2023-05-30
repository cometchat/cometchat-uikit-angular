import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupMembersDemoComponent } from './group-members-demo.component';

describe('GroupMembersDemoComponent', () => {
  let component: GroupMembersDemoComponent;
  let fixture: ComponentFixture<GroupMembersDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupMembersDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupMembersDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
