import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupsWithMessagesDemoComponent } from './groups-with-messages-demo.component';

describe('GroupsWithMessagesDemoComponent', () => {
  let component: GroupsWithMessagesDemoComponent;
  let fixture: ComponentFixture<GroupsWithMessagesDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupsWithMessagesDemoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupsWithMessagesDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
